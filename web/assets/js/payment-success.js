const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const LAST_ORDER_KEY = "hoaminh-last-order";

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

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${new Intl.NumberFormat("vi-VN").format(value)}<small>VND</small>`;
};

const getDisplayPrice = (product) => {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.isActive !== false)
    : [];
  if (!variants.length) return "";

  const prices = variants.map((variant) => Number(variant.price)).filter((price) => price > 0);
  if (!prices.length) return "";

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `${min === max ? "" : "Từ "}${formatPrice(min)}`;
};

const renderRecommendations = (products) => {
  const grid = document.querySelector("[data-recommend-grid]");
  if (!grid) return;

  grid.innerHTML = products
    .slice(0, 3)
    .map((product) => {
      const detailHref = `product-detail.html?id=${encodeURIComponent(product.id)}`;
      return `
        <article class="product-card">
          <button class="card-icon-button recommend-heart" type="button" aria-label="Yêu thích">
            <i class="fa-regular fa-heart" aria-hidden="true"></i>
          </button>
          <a class="product-media" href="${detailHref}">
            <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
          </a>
          <div class="product-panel">
            <div class="product-row">
              <h3 class="product-title">${escapeHtml(product.name)}</h3>
              <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
            </div>
            <div class="product-row product-bottom">
              <p class="product-price">${getDisplayPrice(product)}</p>
              <a class="btn product-link" href="${detailHref}">Xem thêm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
};

const fetchRecommendations = async () => {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không tải được sản phẩm");
    }
    renderRecommendations(result.data);
  } catch {
    const grid = document.querySelector("[data-recommend-grid]");
    if (grid) grid.innerHTML = "";
  }
};

const renderOrderCode = () => {
  const codeElement = document.querySelector("[data-order-code]");
  if (!codeElement) return;

  try {
    const order = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null");
    if (order?.code) {
      codeElement.textContent = `Mã đơn: ${order.code}`;
    }
  } catch {
    codeElement.textContent = "";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  renderOrderCode();
  fetchRecommendations();
});
