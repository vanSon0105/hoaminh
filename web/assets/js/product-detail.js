const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const CART_KEY = "hoaminh-cart";

let currentProduct = null;
let selectedVariant = null;
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
    { threshold: 0.16 }
  );
  items.forEach((item) => observer.observe(item));
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
  return `${new Intl.NumberFormat("vi-VN").format(value)} <span>VND</span>`;
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

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
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

const getQuantity = () => {
  const output = document.querySelector("[data-quantity] output");
  return Math.max(1, Number(output ? output.textContent : 1));
};

const addCurrentProductToCart = () => {
  if (!currentProduct) return;

  const quantity = getQuantity();
  const variant = selectedVariant || getDefaultVariant(currentProduct);
  const cartKey = `${currentProduct.id}:${variant.size || "default"}`;
  const cart = readCart();
  const existing = cart.find((item) => (item.cartKey || `${item.id}:${item.size || "default"}`) === cartKey);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      cartKey,
      id: currentProduct.id,
      variantId: variant.id,
      slug: currentProduct.slug,
      name: currentProduct.name,
      size: variant.size || "",
      price: toNumber(variant.price),
      imageUrl: currentProduct.imageUrl,
      quantity
    });
  }

  writeCart(cart);
  showToast("Đã thêm sản phẩm vào giỏ hàng");
};

const setupQuantity = () => {
  const box = document.querySelector("[data-quantity]");
  if (!box) return;
  const output = box.querySelector("output");
  box.querySelector("[data-minus]").addEventListener("click", () => {
    output.textContent = Math.max(1, Number(output.textContent) - 1);
  });
  box.querySelector("[data-plus]").addEventListener("click", () => {
    output.textContent = Number(output.textContent) + 1;
  });
};

const renderSizeOptions = (product, priceElement) => {
  const sizeOptions = document.querySelector("[data-size-options]");
  if (!sizeOptions) return;

  const variants = getActiveVariants(product);
  sizeOptions.hidden = variants.length <= 1;
  sizeOptions.innerHTML = variants
    .map(
      (variant, index) => `
        <button class="size-option${index === 0 ? " is-active" : ""}" type="button" data-variant-id="${variant.id}">
          ${variant.size}
        </button>
      `
    )
    .join("");

  sizeOptions.querySelectorAll("[data-variant-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const variant = variants.find((item) => String(item.id) === button.dataset.variantId);
      if (!variant) return;
      selectedVariant = variant;
      sizeOptions.querySelectorAll(".size-option").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      if (priceElement) priceElement.innerHTML = formatPrice(variant.price);
    });
  });
};

const renderProduct = (product) => {
  currentProduct = product;
  selectedVariant = getDefaultVariant(product);

  const image = document.querySelector("[data-detail-image]");
  const name = document.querySelector("[data-detail-name]");
  const short = document.querySelector("[data-detail-short]");
  const description = document.querySelector("[data-detail-description]");
  const price = document.querySelector("[data-detail-price]");
  const infoName = document.querySelector("[data-info-name]");
  const infoSize = document.querySelector("[data-info-size]");
  const infoMaterial = document.querySelector("[data-info-material]");
  const infoOrigin = document.querySelector("[data-info-origin]");
  const infoNote = document.querySelector("[data-info-note]");

  if (image) {
    image.src = resolveAssetUrl(product.imageUrl);
    image.alt = product.name || "Sản phẩm Họa Minh";
  }
  if (name) name.textContent = product.name || "";
  if (short) short.textContent = "";
  if (description) description.textContent = product.description || "";
  if (price) price.innerHTML = formatPrice(selectedVariant.price);
  if (infoName) infoName.textContent = product.name || "";
  if (infoSize) {
    const variants = getActiveVariants(product);
    infoSize.textContent = variants.map((variant) => variant.size).join(", ");
  }
  if (infoMaterial) infoMaterial.textContent = product.material || "";
  if (infoOrigin) infoOrigin.textContent = product.origin || "";
  if (infoNote) infoNote.textContent = product.note || "";

  renderSizeOptions(product, price);
};

const fetchProduct = async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const url = id ? `${API_BASE}/products/${encodeURIComponent(id)}` : `${API_BASE}/products`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không tải được sản phẩm");
    }

    const product = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!product) {
      showToast("Chưa có sản phẩm trong database");
      return;
    }

    renderProduct(product);
  } catch {
    showToast("Không tải được chi tiết sản phẩm");
  }
};

const setupCartButton = () => {
  const button = document.querySelector("[data-add-cart]");
  if (!button) return;
  button.addEventListener("click", addCurrentProductToCart);
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupQuantity();
  setupCartButton();
  fetchProduct();
});
