const TOKEN_KEY = "hoaminh-token";
const PROFILE_KEY = "hoaminh-account-profile";
const API_BASE =
  (window.location.protocol === "file:" ||
    (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000"))
    ? "http://localhost:4000/api"
    : "/api";

let toastTimer;
let currentUser = null;

const setupMenu = () => {
  const nav = document.querySelector("[data-site-nav]");
  const toggle = document.querySelector("[data-menu-toggle]");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open");
  });
};

const setupReveal = () => {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  items.forEach((item) => observer.observe(item));
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;

  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2100);
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`
});

const resolveAssetUrl = (url = "") => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `../${url.replace(/^\/+/, "")}`;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const readLocalProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveLocalProfile = (profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

const applyUser = (user) => {
  const localProfile = readLocalProfile();
  const merged = { ...localProfile, ...user };
  currentUser = merged;

  const profileForm = document.querySelector("[data-profile-form]");
  const avatar = document.querySelector("[data-avatar-preview]");
  const avatarFallback = document.querySelector("[data-avatar-fallback]");
  const profileName = document.querySelector("[data-profile-name]");
  const profileEmail = document.querySelector("[data-profile-email]");

  if (profileForm) {
    profileForm.elements.name.value = merged.name || "";
    profileForm.elements.birthDate.value = toDateInputValue(merged.birthDate);
    profileForm.elements.email.value = merged.email || "";
  }

  if (avatar && merged.avatarUrl) {
    avatar.src = resolveAssetUrl(merged.avatarUrl);
    avatar.hidden = false;
    if (avatarFallback) {
      avatarFallback.hidden = true;
    }
  } else if (avatar) {
    avatar.removeAttribute("src");
    avatar.hidden = true;
    if (avatarFallback) {
      avatarFallback.hidden = false;
    }
  }

  if (profileName) {
    profileName.textContent = merged.name || "Tài khoản Họa Minh";
  }

  if (profileEmail) {
    profileEmail.textContent = merged.email || "Chưa có Gmail";
  }
};

const fetchMe = async () => {
  const token = getToken();
  if (!token) {
    showToast("Bạn cần đăng nhập trước");
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 650);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không lấy được thông tin tài khoản");
    }

    applyUser(result.data.user);
    saveLocalProfile({ ...readLocalProfile(), ...result.data.user });
  } catch {
    const localProfile = readLocalProfile();
    if (localProfile.email || localProfile.name) {
      applyUser(localProfile);
      showToast("Đang dùng dữ liệu tạm trên máy");
      return;
    }

    showToast("Phiên đăng nhập hết hạn");
    localStorage.removeItem(TOKEN_KEY);
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 850);
  }
};

const setupAvatar = () => {
  const input = document.querySelector("[data-avatar-input]");
  const preview = document.querySelector("[data-avatar-preview]");
  if (!input || !preview) return;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file ảnh");
      input.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast("Ảnh đại diện tối đa 3MB");
      input.value = "";
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Bạn cần đăng nhập để đổi ảnh đại diện");
      input.value = "";
      return;
    }

    const previousUser = currentUser;
    const previewUrl = URL.createObjectURL(file);
    const fallback = document.querySelector("[data-avatar-fallback]");
    preview.src = previewUrl;
    preview.hidden = false;
    if (fallback) {
      fallback.hidden = true;
    }

    try {
      showToast("Đang tải ảnh đại diện...");
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không lưu được ảnh đại diện");
      }

      const profile = { ...readLocalProfile(), ...result.data.user };
      currentUser = profile;
      saveLocalProfile(profile);
      applyUser(profile);
      showToast("Đã lưu ảnh đại diện");
    } catch {
      if (previousUser) {
        applyUser(previousUser);
      }
      showToast("Chưa lưu được ảnh đại diện, kiểm tra backend");
    } finally {
      URL.revokeObjectURL(previewUrl);
      input.value = "";
    }
  });
};

const setupPasswordToggles = () => {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.closest(".password-field");
      const input = field ? field.querySelector("[data-password]") : null;
      if (!input) return;

      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";

      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !shouldShow);
        icon.classList.toggle("fa-eye-slash", shouldShow);
      }
    });
  });
};

const withButtonState = async (button, loadingText, callback) => {
  const originalText = button.innerHTML;
  button.disabled = true;
  button.textContent = loadingText;

  try {
    await callback();
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

const setupProfileForm = () => {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const button = form.querySelector(".save-button");
    const payload = {
      name: form.elements.name.value.trim(),
      birthDate: form.elements.birthDate.value || null
    };
    const avatarUrl = currentUser ? currentUser.avatarUrl || "" : "";
    if (avatarUrl && !avatarUrl.startsWith("data:")) {
      payload.avatarUrl = avatarUrl;
    }

    if (!payload.name) {
      showToast("Nickname không được để trống");
      return;
    }

    withButtonState(button, "Đang lưu...", async () => {
      let user = { ...currentUser, ...payload };
      let savedToBackend = true;

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không lưu được thông tin");
        }

        user = { ...user, ...result.data.user };
      } catch {
        savedToBackend = false;
      }

      saveLocalProfile(user);
      applyUser(user);
      showToast(savedToBackend ? "Đã lưu thông tin tài khoản" : "Backend chưa sẵn sàng, đã lưu tạm trên máy");
    });
  });
};

const setupPasswordForm = () => {
  const form = document.querySelector("[data-password-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentPassword = form.elements.currentPassword.value;
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Vui lòng nhập đủ thông tin mật khẩu");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu nhập lại không khớp");
      return;
    }

    const button = form.querySelector(".save-button");
    withButtonState(button, "Đang cập nhật...", async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/password`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Không đổi được mật khẩu");
        }

        form.reset();
        showToast("Đã cập nhật mật khẩu");
      } catch {
        showToast("Chưa đổi được mật khẩu, kiểm tra backend");
      }
    });
  });
};

const setupLogout = () => {
  const button = document.querySelector("[data-logout]");
  if (!button) return;

  button.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    showToast("Đã đăng xuất");
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupAvatar();
  setupPasswordToggles();
  setupProfileForm();
  setupPasswordForm();
  setupLogout();
  fetchMe();
});
