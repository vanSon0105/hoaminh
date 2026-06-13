const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const CART_KEY = "hoaminh-cart";
const TOKEN_KEY = "hoaminh-token";
const DELIVERY_KEY = "hoaminh-delivery";
const LAST_ORDER_KEY = "hoaminh-last-order";

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

const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
};

const normalizeCartItems = (cart) => {
  return cart.map((item) => ({
    productId: item.productId || item.id,
    id: item.id,
    name: item.name,
    size: item.size || "",
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1))
  }));
};

const fillSavedDelivery = (form) => {
  const saved = readJson(DELIVERY_KEY, null);
  if (!saved) return;

  Object.entries(saved).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field && typeof value === "string") field.value = value;
  });
};

const setSubmitting = (form, isSubmitting) => {
  const button = form.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = isSubmitting;
  button.classList.toggle("is-loading", isSubmitting);
  button.innerHTML = isSubmitting
    ? 'Đang gửi đơn <span class="btn-arrow"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></span>'
    : 'Xác nhận đặt hàng <span class="btn-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>';
};

const setupForm = () => {
  const form = document.querySelector("[data-delivery-form]");
  if (!form) return;

  fillSavedDelivery(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cart = readJson(CART_KEY, []);
    if (!Array.isArray(cart) || !cart.length) {
      showToast("Giỏ hàng đang trống");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      customer: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        address: data.address?.trim(),
        note: data.note?.trim(),
        time: data.time?.trim()
      },
      items: normalizeCartItems(cart)
    };

    setSubmitting(form, true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không gửi được đơn hàng");
      }

      writeJson(DELIVERY_KEY, data);
      writeJson(LAST_ORDER_KEY, result.data.order);
      localStorage.setItem(CART_KEY, "[]");
      showToast("Đã gửi đơn hàng cho Họa Minh");

      window.setTimeout(() => {
        window.location.href = "payment-success.html";
      }, 550);
    } catch (error) {
      showToast(error.message || "Không gửi được đơn hàng");
      setSubmitting(form, false);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupForm();
});
