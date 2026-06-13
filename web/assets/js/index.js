const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

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
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
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
  return url.replace(/^\/+/, "");
};

const setupFaq = () => {
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      if (!item) return;
      item.classList.toggle("is-open");
    });
  });
};

const setupSlider = () => {
  const track = document.querySelector(".discover-track");
  const prev = document.querySelector("[data-slide-prev]");
  const next = document.querySelector("[data-slide-next]");
  if (!track || !prev || !next) return;
  const scrollByCard = (direction) => {
    const card = track.querySelector("a");
    const amount = card ? card.getBoundingClientRect().width + 24 : 260;
    track.scrollBy({ left: amount * direction, behavior: "smooth" });
  };
  prev.addEventListener("click", () => scrollByCard(-1));
  next.addEventListener("click", () => scrollByCard(1));
};

const renderFeatured = (products) => {
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid) return;

  const list = products.filter((product) => product.isFeatured).slice(0, 3);
  const featured = list.length ? list : products.slice(0, 3);

  grid.innerHTML = featured
    .map((product, index) => {
      const detailHref = `pages/product-detail.html?id=${encodeURIComponent(product.id)}`;
      return `
        <article class="featured-card${index === 1 ? " is-main" : ""} reveal">
          <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
          <a href="${detailHref}" class="featured-info">Thêm thông tin <span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>
        </article>
      `;
    })
    .join("");
};

const renderDiscover = (products) => {
  const track = document.querySelector("[data-discover-track]");
  if (!track) return;

  track.innerHTML = products
    .slice(0, 4)
    .map((product) => {
      const detailHref = `pages/product-detail.html?id=${encodeURIComponent(product.id)}`;
      return `
        <a href="${detailHref}">
          <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
        </a>
      `;
    })
    .join("");
};

const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không tải được sản phẩm");
    }

    renderFeatured(result.data);
    renderDiscover(result.data);
    setupReveal();
  } catch {
    const featured = document.querySelector("[data-featured-grid]");
    const discover = document.querySelector("[data-discover-track]");
    if (featured) featured.innerHTML = "";
    if (discover) discover.innerHTML = "";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupFaq();
  setupSlider();
  fetchProducts();
});
