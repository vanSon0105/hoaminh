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

const setupSubmit = () => {
  const form = document.querySelector("[data-auth-form]");
  const toast = document.querySelector("[data-toast]");
  if (!form || !toast) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    toast.textContent = "Chức năng đăng nhập sẽ nối backend sau";
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupPassword();
  setupSubmit();
});
