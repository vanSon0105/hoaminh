const CART_KEY = "hoaminh-cart";
const TOKEN_KEY = "hoaminh-token";

let toastTimer;

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

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatPrice = (price) => {
  const value = toNumber(price);
  if (value <= 0) return "";
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
};

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

const writeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
};

const renderCart = () => {
  const grid = document.querySelector("[data-cart-grid]");
  const checkoutButton = document.querySelector(".cart-bottom .btn");
  if (!grid) return;

  if (checkoutButton) {
    checkoutButton.href = localStorage.getItem(TOKEN_KEY) ? "delivery.html" : "checkout.html";
  }

  const cart = readCart();

  if (!cart.length) {
    grid.innerHTML = `
      <div class="cart-empty">
        <h2>Giỏ hàng đang trống</h2>
        <a class="btn" href="product.html">Xem sản phẩm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
      </div>
    `;
    if (checkoutButton) {
      checkoutButton.classList.add("is-disabled");
      checkoutButton.setAttribute("aria-disabled", "true");
    }
    return;
  }

  if (checkoutButton) {
    checkoutButton.classList.remove("is-disabled");
    checkoutButton.removeAttribute("aria-disabled");
  }

  grid.innerHTML = cart
    .map((item) => {
      const detailHref = `product-detail.html?id=${encodeURIComponent(item.id)}`;
      const price = formatPrice(item.price);
      const quantity = Math.max(1, Number(item.quantity || 1));

      return `
        <article class="cart-item" data-cart-item="${item.id}">
          <div class="cart-item-image">
            <img src="${resolveAssetUrl(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
            <button type="button" data-remove="${item.id}" aria-label="Xóa sản phẩm">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div class="cart-meta">
            <h2>${escapeHtml(item.name)}</h2>
            <strong>${price}</strong>
            <div class="cart-quantity" data-cart-quantity="${item.id}">
              <button type="button" data-cart-minus="${item.id}" aria-label="Giảm số lượng">-</button>
              <output>${quantity}</output>
              <button type="button" data-cart-plus="${item.id}" aria-label="Tăng số lượng">+</button>
            </div>
            <a class="btn" href="${detailHref}">Xem thêm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
          </div>
        </article>
      `;
    })
    .join("");
};

const updateQuantity = (id, direction) => {
  const cart = readCart();
  const item = cart.find((cartItem) => String(cartItem.id) === String(id));
  if (!item) return;

  item.quantity = Math.max(1, Number(item.quantity || 1) + direction);
  writeCart(cart);
  renderCart();
};

const removeItem = (id) => {
  const cart = readCart().filter((item) => String(item.id) !== String(id));
  writeCart(cart);
  renderCart();
  showToast("Đã xóa sản phẩm khỏi giỏ hàng");
};

const setupCartEvents = () => {
  document.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      removeItem(removeButton.dataset.remove);
      return;
    }

    const minusButton = event.target.closest("[data-cart-minus]");
    if (minusButton) {
      updateQuantity(minusButton.dataset.cartMinus, -1);
      return;
    }

    const plusButton = event.target.closest("[data-cart-plus]");
    if (plusButton) {
      updateQuantity(plusButton.dataset.cartPlus, 1);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  renderCart();
  setupCartEvents();
});
