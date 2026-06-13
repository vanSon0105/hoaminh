const CART_KEY = "hoaminh-cart";
const TOKEN_KEY = "hoaminh-token";

const redirectLoggedInUser = () => {
  if (!localStorage.getItem(TOKEN_KEY)) return false;
  window.location.replace("delivery.html");
  return true;
};

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

const renderOrderList = () => {
  const list = document.querySelector("[data-order-list]");
  if (!list) return;

  const cart = readCart();
  if (!cart.length) {
    list.innerHTML = `
      <div class="order-empty">
        <h2>Chưa có sản phẩm trong giỏ hàng</h2>
        <a class="btn" href="product.html">Chọn sản phẩm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
      </div>
    `;
    return;
  }

  list.innerHTML = cart
    .map((item, index) => {
      const detailHref = `product-detail.html?id=${encodeURIComponent(item.id)}`;
      const quantity = Math.max(1, Number(item.quantity || 1));

      return `
        <article class="order-item${index === 0 ? " is-highlight" : ""}">
          <img src="${resolveAssetUrl(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
          <div>
            <h2>${escapeHtml(item.name)}</h2>
            <strong>Số lượng: ${quantity}</strong>
            <p></p>
          </div>
          <a class="btn" href="${detailHref}">Chỉnh sửa</a>
        </article>
      `;
    })
    .join("");
};

document.addEventListener("DOMContentLoaded", () => {
  if (redirectLoggedInUser()) return;
  setupMenu();
  setupReveal();
  renderOrderList();
});
