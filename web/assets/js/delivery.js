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

const requireLogin = () => {
  if (localStorage.getItem(TOKEN_KEY)) return true;

  localStorage.setItem("hoaminh-login-redirect", window.location.href);
  window.location.replace("checkout.html");
  return false;
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
};

const normalizePhone = (phone = "") => {
  return String(phone).replace(/[\s.-]/g, "");
};

const setFieldError = (form, fieldName, message = "") => {
  const field = form.elements[fieldName];
  if (!field) return;

  field.setCustomValidity(message);
  field.toggleAttribute("aria-invalid", Boolean(message));
  field.classList.toggle("is-invalid", Boolean(message));
};

const clearValidation = (form) => {
  ["name", "phone", "address"].forEach((fieldName) => setFieldError(form, fieldName));
};

const validateDelivery = (form, data) => {
  clearValidation(form);

  const errors = [];
  const phone = normalizePhone(data.phone);

  if (!data.name?.trim() || data.name.trim().length < 2) {
    errors.push({ field: "name", message: "Vui lòng nhập tên khách hàng" });
  }

  if (!/^0\d{9}$/.test(phone)) {
    errors.push({ field: "phone", message: "Số điện thoại phải gồm 10 số và bắt đầu bằng 0" });
  }

  if (!data.address?.trim() || data.address.trim().length < 8) {
    errors.push({ field: "address", message: "Vui lòng nhập địa chỉ cụ thể hơn" });
  }

  errors.forEach((error) => setFieldError(form, error.field, error.message));

  if (errors.length) {
    const firstField = form.elements[errors[0].field];
    showToast(errors[0].message);
    firstField?.focus();
    firstField?.reportValidity();
    return false;
  }

  data.phone = phone;
  return true;
};

const normalizeCartItems = (cart) => {
  return cart.map((item) => ({
    productId: item.productId || item.id,
    id: item.id,
    name: item.name,
    size: item.size || "",
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    engravingText: item.engravingEnabled ? item.engravingText || "" : "",
    isPersonalized: Boolean(item.isPersonalized)
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
    if (!validateDelivery(form, data)) return;

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

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (!["name", "phone", "address"].includes(field.name)) return;
    setFieldError(form, field.name);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  setupMenu();
  setupReveal();
  setupForm();
});
