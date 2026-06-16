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
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
};

const setupPassword = () => {
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

const API_BASE =
  (window.location.protocol === "file:" ||
    (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000"))
    ? "http://localhost:4000/api"
    : "/api";

const LOGIN_REDIRECT_KEY = "hoaminh-login-redirect";
const TOKEN_KEY = "hoaminh-token";
const PROFILE_KEY = "hoaminh-account-profile";

const getLoginRedirect = () => {
  const redirectUrl = localStorage.getItem(LOGIN_REDIRECT_KEY);
  localStorage.removeItem(LOGIN_REDIRECT_KEY);
  return redirectUrl || "../index.html";
};

let toastTimer;

const showToast = (toast, message) => {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
};

const decodeBase64UrlJson = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const clearSocialHash = () => {
  window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
};

const setupSocialResult = () => {
  const toast = document.querySelector("[data-toast]");
  if (!toast || !window.location.hash) return;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get("social_error");
  const token = params.get("social_token");
  const encodedUser = params.get("social_user");

  if (error) {
    clearSocialHash();
    showToast(toast, error);
    return;
  }

  if (!token || !encodedUser) return;

  try {
    const user = decodeBase64UrlJson(encodedUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    clearSocialHash();
    showToast(toast, "Đăng ký thành công!");
    window.setTimeout(() => {
      window.location.href = getLoginRedirect();
    }, 500);
  } catch {
    clearSocialHash();
    showToast(toast, "Không xử lý được đăng ký mạng xã hội");
  }
};

const setupSocialAuth = () => {
  const toast = document.querySelector("[data-toast]");
  document.querySelectorAll("[data-social-auth]").forEach((button) => {
    button.addEventListener("click", () => {
      const provider = button.dataset.socialAuth;
      if (!provider) return;

      if (window.location.protocol === "file:") {
        if (toast) showToast(toast, "Vui lòng mở bằng Live Server để đăng ký Gmail/Facebook");
        return;
      }

      const redirectUrl = window.location.href.split("#")[0];
      button.disabled = true;
      window.location.href = `${API_BASE}/auth/${encodeURIComponent(provider)}?redirect=${encodeURIComponent(redirectUrl)}`;
    });
  });
};

const setupSubmit = () => {
  const form = document.querySelector("[data-register-form]");
  const toast = document.querySelector("[data-toast]");
  if (!form || !toast) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const passwordField = form.querySelector('[name="password"]');
    const password = passwordField ? passwordField.value : "";

    // Lấy confirm password: input không có name, nằm trong password-field thứ hai
    const passwordFields = form.querySelectorAll("[data-password]");
    let confirmPassword = "";
    if (passwordFields.length >= 2) {
      confirmPassword = passwordFields[1].value;
    }

    // Validate
    if (!name || !email || !phone || !password || !confirmPassword) {
      showToast(toast, "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password.length < 6) {
      showToast(toast, "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      showToast(toast, "Mật khẩu nhập lại không khớp");
      return;
    }

    if (!/^0[0-9]{9,10}$/.test(phone)) {
      showToast(toast, "Số điện thoại không hợp lệ");
      return;
    }

    const submitBtn = form.querySelector(".register-submit");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Đang đăng ký...";
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password })
      });

      const result = await res.json();

      if (!result.success) {
        showToast(toast, result.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      localStorage.setItem("hoaminh-token", result.data.token);
      localStorage.setItem("hoaminh-account-profile", JSON.stringify(result.data.user));
      showToast(toast, "Đăng ký thành công!");
      window.setTimeout(() => {
        window.location.href = getLoginRedirect();
      }, 500);
    } catch {
      showToast(toast, "Lỗi kết nối đến máy chủ");
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupPassword();
  setupSocialResult();
  setupSocialAuth();
  setupSubmit();
});
