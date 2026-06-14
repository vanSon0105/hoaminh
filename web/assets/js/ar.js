const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const AR_PREVIEW_TYPE = "AR_PREVIEW";

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
  document.querySelectorAll(".reveal").forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
    observer.observe(item);
  });
};

const resolveAssetUrl = (url = "") => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `../${url.replace(/^\/+/, "")}`;
};

const getArPreviewImage = (product) => {
  return Array.isArray(product.images)
    ? product.images.find((item) => item.type === AR_PREVIEW_TYPE && item.url)
    : null;
};

const renderUnsupported = () => {
  const title = document.querySelector("[data-ar-title]");
  const steps = document.querySelector("[data-ar-steps]");
  const frame = document.querySelector("[data-qr-frame]");
  if (title) title.textContent = "Sản Phẩm Không Hỗ Trợ Xem AR";
  if (steps) steps.hidden = true;
  if (frame) frame.hidden = true;
};

const renderProductAr = (product, arPreview) => {
  const title = document.querySelector("[data-ar-title]");
  const steps = document.querySelector("[data-ar-steps]");
  const frame = document.querySelector("[data-qr-frame]");
  const qrImage = document.querySelector("[data-ar-qr]");
  const back = document.querySelector("[data-ar-back]");

  if (title) title.textContent = `Xin vui lòng quét mã QR dưới đây để xem AR của ${product.name}.`;
  if (steps) steps.hidden = false;
  if (frame) frame.hidden = false;
  if (qrImage) {
    qrImage.src = resolveAssetUrl(arPreview.url);
    qrImage.alt = `Mã QR AR ${product.name}`;
  }
  if (back) back.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
};

const fetchProductAr = async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    renderUnsupported();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
    const result = await response.json();

    if (!response.ok || !result.success || !result.data) {
      renderUnsupported();
      return;
    }

    const arPreview = getArPreviewImage(result.data);
    if (!arPreview) {
      renderUnsupported();
      return;
    }

    renderProductAr(result.data, arPreview);
  } catch {
    renderUnsupported();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  fetchProductAr();
});
