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
    { threshold: 0.16 }
  );
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
};

const setupForm = () => {
  const form = document.querySelector("[data-delivery-form]");
  const toast = document.querySelector("[data-toast]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem("hoaminh-delivery", JSON.stringify(data));
    if (toast) {
      toast.textContent = "Đã lưu thông tin vận chuyển tạm";
      toast.classList.add("is-visible");
    }
    window.setTimeout(() => {
      window.location.href = "payment.html";
    }, 450);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupForm();
});
