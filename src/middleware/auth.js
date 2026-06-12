import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    return next(error);
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    next(error);
  }
};

export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch {
    // Token không hợp lệ — bỏ qua, không chặn
  }

  next();
};
