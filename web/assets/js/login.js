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
  const button = document.querySelector("[data-toggle-password]");
  const input = document.querySelector("[data-password]");
  if (!button || !input) return;
  button.addEventListener("click", () => {
    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    const icon = button.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-eye", !shouldShow);
      icon.classList.toggle("fa-eye-slash", shouldShow);
    }
  });
};

const API_BASE =
  (window.location.protocol === "file:" ||
    (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000"))
    ? "http://localhost:4000/api"
    : "/api";

const LOGIN_REDIRECT_KEY = "hoaminh-login-redirect";

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

const setupSubmit = () => {
  const form = document.querySelector("[data-auth-form]");
  const toast = document.querySelector("[data-toast]");
  if (!form || !toast) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;

    if (!email || !password) {
      showToast(toast, "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const submitBtn = form.querySelector(".auth-submit");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Đang đăng nhập...";
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
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
      showToast(toast, "Đăng nhập thành công!");
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
  setupSubmit();
});
