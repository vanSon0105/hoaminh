const CART_KEY = "hoaminh-cart";

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
    { threshold: 0.14 }
  );
  items.forEach((item) => observer.observe(item));
};

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const resolveAssetUrl = (url = "") => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `../${url.replace(/^\/+/, "")}`;
};

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

const renderConfirmProduct = () => {
  const target = document.querySelector("[data-confirm-product]");
  if (!target) return;

  const item = readCart()[0];
  if (!item) {
    target.innerHTML = `
      <div class="confirm-empty">
        <h2>Chưa có sản phẩm trong giỏ hàng</h2>
        <a class="btn" href="product.html">Chọn sản phẩm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="confirm-thumb">
      <img src="${resolveAssetUrl(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
    </div>
    <div>
      <h2>${escapeHtml(item.name)}</h2>
      <strong>Số lượng: ${Math.max(1, Number(item.quantity || 1))}</strong>
      <p></p>
      <span></span>
    </div>
  `;
};

const setupConfirm = () => {
  const form = document.querySelector("[data-confirm-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = "payment-success.html";
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  renderConfirmProduct();
  setupConfirm();
});
