import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const roleSelect = { select: { id: true, name: true } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarDir = path.resolve(__dirname, "../../web/assets/avatar");
const avatarUrlPrefix = "assets/avatar";
const avatarMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

fs.mkdirSync(avatarDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, avatarDir),
    filename: (_req, file, callback) => {
      const extension = avatarMimeTypes.get(file.mimetype) || path.extname(file.originalname).toLowerCase() || ".jpg";
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (avatarMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error("Avatar must be an image file"));
  }
});

// ── Helpers ──────────────────────────────────────────────

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  birthDate: user.birthDate,
  role: user.role.name,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const parseBirthDate = (birthDate) => {
  if (!birthDate) return null;

  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("Invalid birth date");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const handleAvatarUpload = (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    error.statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    next(error);
  });
};

const removeLocalAvatar = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith(`${avatarUrlPrefix}/`)) return;

  const fileName = path.basename(avatarUrl);
  await fs.promises.unlink(path.join(avatarDir, fileName)).catch(() => {});
};

const encodeSocialState = (payload) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeSocialState = (state) => {
  try {
    return JSON.parse(Buffer.from(String(state || ""), "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

const getRequestBaseUrl = (req) => {
  return env.publicApiUrl || `${req.protocol}://${req.get("host")}`;
};

const getSocialRedirectUrl = (req) => {
  return typeof req.query.redirect === "string" && req.query.redirect
    ? req.query.redirect
    : `${getRequestBaseUrl(req)}/pages/account.html`;
};

const getSocialCallbackUrl = (req, provider) => {
  if (provider === "google" && env.googleCallbackUrl) return env.googleCallbackUrl;
  if (provider === "facebook" && env.facebookCallbackUrl) return env.facebookCallbackUrl;
  return `${getRequestBaseUrl(req)}/api/auth/${provider}/callback`;
};

const redirectWithSocialError = (res, redirectUrl, message) => {
  res.redirect(`${redirectUrl}#social_error=${encodeURIComponent(message)}`);
};

const redirectWithSocialAuth = (res, redirectUrl, user) => {
  const token = generateToken(user);
  const encodedUser = Buffer.from(JSON.stringify(sanitizeUser(user))).toString("base64url");
  res.redirect(`${redirectUrl}#social_token=${encodeURIComponent(token)}&social_user=${encodeURIComponent(encodedUser)}`);
};

const getOrCreateSocialUser = async ({ email, name, avatarUrl }) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Social account did not return a valid email");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const fallbackName = normalizedEmail.split("@")[0];
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: roleSelect }
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(!existingUser.name && name ? { name: name.trim() } : {}),
        ...(!existingUser.avatarUrl && avatarUrl ? { avatarUrl } : {})
      },
      include: { role: roleSelect }
    });
  }

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  return prisma.user.create({
    data: {
      name: name ? name.trim() : fallbackName,
      email: normalizedEmail,
      avatarUrl: avatarUrl || null,
      passwordHash
    },
    include: { role: roleSelect }
  });
};

const fetchGoogleProfile = async (req, code) => {
  const callbackUrl = getSocialCallbackUrl(req, "google");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl
    })
  });
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || "Cannot connect Google account");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileResponse.json();

  if (!profileResponse.ok || !profile.email) {
    throw new Error("Google account did not return an email");
  }

  return {
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture
  };
};

const fetchFacebookProfile = async (req, code) => {
  const callbackUrl = getSocialCallbackUrl(req, "facebook");
  const tokenUrl = new URL("https://graph.facebook.com/oauth/access_token");
  tokenUrl.search = new URLSearchParams({
    client_id: env.facebookAppId,
    client_secret: env.facebookAppSecret,
    code,
    redirect_uri: callbackUrl
  }).toString();

  const tokenResponse = await fetch(tokenUrl);
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error?.message || "Cannot connect Facebook account");
  }

  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.search = new URLSearchParams({
    fields: "id,name,email,picture.width(400).height(400)",
    access_token: tokenData.access_token
  }).toString();

  const profileResponse = await fetch(profileUrl);
  const profile = await profileResponse.json();

  if (!profileResponse.ok || !profile.email) {
    throw new Error("Facebook account did not return an email");
  }

  return {
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture?.data?.url
  };
};

// ── POST /register ───────────────────────────────────────

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Validate
    const errors = [];
    if (!name || !name.trim()) errors.push("Name is required");
    if (!email || !email.trim()) errors.push("Email is required");
    if (!phone || !phone.trim()) errors.push("Phone is required");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      errors.push("Invalid email format");
    }
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone || "")) {
      errors.push("Invalid phone number");
    }

    if (errors.length > 0) {
      const error = new Error(errors[0]);
      error.statusCode = 400;
      throw error;
    }

    // Check duplicates
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      const error = new Error("Phone already registered");
      error.statusCode = 409;
      throw error;
    }

    // Hash password & create
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash
      },
      include: { role: roleSelect }
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: { token, user: sanitizeUser(user) }
    });
  })
);

// ── POST /login ──────────────────────────────────────────

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: roleSelect }
    });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: { token, user: sanitizeUser(user) }
    });
  })
);

// GET /google

router.get(
  "/google",
  asyncHandler(async (req, res) => {
    const redirectUrl = getSocialRedirectUrl(req);
    if (!env.googleClientId || !env.googleClientSecret) {
      redirectWithSocialError(res, redirectUrl, "Chưa cấu hình đăng ký Gmail");
      return;
    }

    const callbackUrl = getSocialCallbackUrl(req, "google");
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.search = new URLSearchParams({
      client_id: env.googleClientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: encodeSocialState({ redirectUrl })
    }).toString();

    res.redirect(authUrl.toString());
  })
);

// GET /google/callback

router.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const state = decodeSocialState(req.query.state);
    const redirectUrl = state.redirectUrl || getSocialRedirectUrl(req);

    try {
      if (typeof req.query.code !== "string") {
        throw new Error("Google did not return an authorization code");
      }

      const profile = await fetchGoogleProfile(req, req.query.code);
      const user = await getOrCreateSocialUser(profile);
      redirectWithSocialAuth(res, redirectUrl, user);
    } catch (error) {
      redirectWithSocialError(res, redirectUrl, error.message || "Không đăng ký được bằng Gmail");
    }
  })
);

// GET /facebook

router.get(
  "/facebook",
  asyncHandler(async (req, res) => {
    const redirectUrl = getSocialRedirectUrl(req);
    if (!env.facebookAppId || !env.facebookAppSecret) {
      redirectWithSocialError(res, redirectUrl, "Chưa cấu hình đăng ký Facebook");
      return;
    }

    const callbackUrl = getSocialCallbackUrl(req, "facebook");
    const authUrl = new URL("https://www.facebook.com/dialog/oauth");
    authUrl.search = new URLSearchParams({
      client_id: env.facebookAppId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "email,public_profile",
      state: encodeSocialState({ redirectUrl })
    }).toString();

    res.redirect(authUrl.toString());
  })
);

// GET /facebook/callback

router.get(
  "/facebook/callback",
  asyncHandler(async (req, res) => {
    const state = decodeSocialState(req.query.state);
    const redirectUrl = state.redirectUrl || getSocialRedirectUrl(req);

    try {
      if (typeof req.query.code !== "string") {
        throw new Error("Facebook did not return an authorization code");
      }

      const profile = await fetchFacebookProfile(req, req.query.code);
      const user = await getOrCreateSocialUser(profile);
      redirectWithSocialAuth(res, redirectUrl, user);
    } catch (error) {
      redirectWithSocialError(res, redirectUrl, error.message || "Không đăng ký được bằng Facebook");
    }
  })
);

// ── GET /me ──────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        birthDate: true,
        role: roleSelect,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    res.json({ success: true, data: { user: sanitizeUser(user) } });
  })
);

// PATCH /me

router.patch(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, avatarUrl, birthDate } = req.body;

    if (typeof name === "string" && !name.trim()) {
      const error = new Error("Name cannot be empty");
      error.statusCode = 400;
      throw error;
    }

    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== "string") {
      const error = new Error("Avatar URL must be a string");
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(typeof name === "string" ? { name: name.trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(birthDate !== undefined ? { birthDate: parseBirthDate(birthDate) } : {})
      },
      include: { role: roleSelect }
    });

    res.json({ success: true, data: { user: sanitizeUser(user) } });
  })
);

// POST /avatar

router.post(
  "/avatar",
  authenticate,
  handleAvatarUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      const error = new Error("Avatar image is required");
      error.statusCode = 400;
      throw error;
    }

    const avatarUrl = `${avatarUrlPrefix}/${req.file.filename}`;
    const previousUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      include: { role: roleSelect }
    });

    if (previousUser?.avatarUrl && previousUser.avatarUrl !== avatarUrl) {
      await removeLocalAvatar(previousUser.avatarUrl);
    }

    res.json({ success: true, data: { user: sanitizeUser(user) } });
  })
);

// PATCH /password

router.patch(
  "/password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new Error("Current password and new password are required");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: roleSelect }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash }
    });

    res.json({ success: true, message: "Password updated successfully" });
  })
);

export default router;
