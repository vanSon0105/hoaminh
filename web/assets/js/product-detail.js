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

const setupQuantity = () => {
  const box = document.querySelector("[data-quantity]");
  if (!box) return;
  const output = box.querySelector("output");
  box.querySelector("[data-minus]").addEventListener("click", () => {
    output.value = Math.max(1, Number(output.value || output.textContent) - 1);
    output.textContent = output.value;
  });
  box.querySelector("[data-plus]").addEventListener("click", () => {
    output.value = Number(output.value || output.textContent) + 1;
    output.textContent = output.value;
  });
};

const setupCartToast = () => {
  const button = document.querySelector("[data-add-cart]");
  const toast = document.querySelector("[data-toast]");
  if (!button || !toast) return;
  button.addEventListener("click", () => {
    toast.textContent = "Đã thêm sản phẩm tạm vào giỏ hàng";
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupQuantity();
  setupCartToast();
});
