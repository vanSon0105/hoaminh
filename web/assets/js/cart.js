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
    { threshold: 0.14 }
  );
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
};

const setupRemove = () => {
  const toast = document.querySelector("[data-toast]");
  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest("[data-cart-item]");
      if (item) item.remove();
      if (!toast) return;
      toast.textContent = "Đã xóa sản phẩm khỏi giỏ hàng";
      toast.classList.add("is-visible");
      window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupRemove();
});
