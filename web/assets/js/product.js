const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const CART_KEY = "hoaminh-cart";

let toastTimer;
let allProducts = [];
const TREND_PRODUCT_IDS = [1, 4, 2];

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

  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 35, 240)}ms`;
    observer.observe(item);
  });
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
  return `${new Intl.NumberFormat("vi-VN").format(value)}<small>VND</small>`;
};

const getActiveVariants = (product) => {
  return Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.isActive !== false)
    : [];
};

const getDefaultVariant = (product) => {
  const variants = getActiveVariants(product);
  return variants[0] || { id: null, size: "", price: 0 };
};

const formatProductPrice = (product) => {
  const variants = getActiveVariants(product);
  if (!variants.length) return "";

  const prices = variants.map((variant) => toNumber(variant.price)).filter((price) => price > 0);
  if (!prices.length) return "";

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const prefix = min === max ? "" : "Từ ";
  return `${prefix}${formatPrice(min)}`;
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
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

const addToCart = (product, quantity = 1) => {
  const variant = getDefaultVariant(product);
  const cart = readCart();
  const cartKey = `${product.id}:${variant.size || "default"}`;
  const existing = cart.find((item) => (item.cartKey || `${item.id}:${item.size || "default"}`) === cartKey);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      cartKey,
      id: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size || "",
      price: toNumber(variant.price),
      imageUrl: product.imageUrl,
      quantity,
      engravingEnabled: false,
      engravingText: "",
      isPersonalized: false
    });
  }

  writeCart(cart);
  showToast("Đã thêm vào giỏ hàng");
};

const getProductById = (id) => {
  return allProducts.find((product) => String(product.id) === String(id));
};

const renderTrendProducts = (products) => {
  const grid = document.querySelector("[data-trend-grid]");
  if (!grid) return;

  const orderedFeatured = TREND_PRODUCT_IDS
    .map((id) => products.find((product) => Number(product.id) === id && product.isFeatured))
    .filter(Boolean);
  const featured = orderedFeatured.length === TREND_PRODUCT_IDS.length
    ? orderedFeatured
    : products.filter((product) => product.isFeatured).slice(0, 3);
  const list = featured.length ? featured : products.slice(0, 3);

  grid.innerHTML = list
    .map((product) => {
      const detailHref = `product-detail.html?id=${encodeURIComponent(product.id)}`;
      return `
        <article>
          <a class="trend-thumb" href="${detailHref}">
            <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
          </a>
          <h2>${escapeHtml(product.name)}</h2>
        </article>
      `;
    })
    .join("");
};

const renderProductGrid = (products) => {
  const grid = document.querySelector("[data-product-grid]");
  const loadMore = document.querySelector("[data-load-more]");
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<p class="product-empty">Chưa có sản phẩm phù hợp.</p>`;
    if (loadMore) loadMore.style.display = "none";
    return;
  }

  grid.innerHTML = products
    .map((product, index) => {
      const detailHref = `product-detail.html?id=${encodeURIComponent(product.id)}`;
      const price = formatProductPrice(product);

      return `
        <article class="product-card${index >= 6 ? " is-extra" : ""}" data-product data-product-id="${product.id}">
          <div class="product-actions">
            <button class="card-icon-button" type="button" data-favorite aria-label="Yêu thích">
              <i class="fa-regular fa-heart" aria-hidden="true"></i>
            </button>
          </div>
          <a class="product-media" href="${detailHref}">
            <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
          </a>
          <div class="product-panel">
            <div class="product-row">
              <h2 class="product-title">${escapeHtml(product.name)}</h2>
              <button class="card-icon-button cart-card-button" type="button" data-add-cart="${product.id}" aria-label="Thêm vào giỏ hàng">
                <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
              </button>
            </div>
            <div class="product-row product-bottom">
              <p class="product-price">${price}</p>
              <a class="btn product-link" href="${detailHref}">Xem thêm <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  if (loadMore) {
    loadMore.style.display = products.length > 6 ? "" : "none";
  }

  setupFavorites();
  setupCartButtons();
};

const setupFavorites = () => {
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-on");
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-regular", !button.classList.contains("is-on"));
        icon.classList.toggle("fa-solid", button.classList.contains("is-on"));
      }
      showToast(button.classList.contains("is-on") ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
    });
  });
};

const setupCartButtons = () => {
  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = getProductById(button.dataset.addCart);
      if (!product) return;
      addToCart(product);
    });
  });
};

const setupLoadMore = () => {
  const button = document.querySelector("[data-load-more]");
  if (!button) return;
  button.addEventListener("click", () => {
    document.querySelectorAll(".product-card.is-extra").forEach((card) => {
      card.classList.remove("is-extra");
      card.classList.add("is-visible");
    });
    button.style.display = "none";
  });
};

const fetchProducts = async () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  const url = q ? `${API_BASE}/products?q=${encodeURIComponent(q)}` : `${API_BASE}/products`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không tải được sản phẩm");
    }

    allProducts = result.data;
    renderTrendProducts(allProducts);
    renderProductGrid(allProducts);
  } catch {
    const grid = document.querySelector("[data-product-grid]");
    if (grid) {
      grid.innerHTML = `<p class="product-empty">Chưa kết nối được database sản phẩm.</p>`;
    }
    showToast("Không tải được sản phẩm từ database");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupLoadMore();
  fetchProducts();
});
