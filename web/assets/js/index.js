const API_BASE =
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
    ? "http://localhost:4000/api"
    : "/api";

const DISCOVER_AUTOPLAY_MS = 3600;

let discoverAutoplayTimer;

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
  const dots = document.querySelector("[data-slider-dots]");
  if (!track || !prev || !next) return;

  window.clearInterval(discoverAutoplayTimer);

  const getStep = () => {
    const card = track.querySelector("a");
    if (!card) return 0;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const getVisibleCount = () => {
    const step = getStep();
    return step ? Math.max(1, Math.round(track.clientWidth / step)) : 1;
  };

  const getPageCount = () => Math.max(1, Math.ceil(track.children.length / getVisibleCount()));

  const getCurrentPage = () => {
    const step = getStep();
    const visibleCount = getVisibleCount();
    const pageWidth = step * visibleCount;
    return pageWidth ? Math.round(track.scrollLeft / pageWidth) : 0;
  };

  const updateControls = () => {
    const pageCount = getPageCount();
    const canScroll = track.scrollWidth > track.clientWidth + 2;
    prev.disabled = !canScroll;
    next.disabled = !canScroll;

    if (dots) {
      dots.innerHTML = Array.from({ length: pageCount }, (_, index) => `<span class="slider-dot${index === 0 ? " is-active" : ""}"></span>`).join("");
    }
  };

  const updateDots = () => {
    if (!dots) return;
    const activeIndex = Math.min(getCurrentPage(), getPageCount() - 1);
    dots.querySelectorAll(".slider-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const scrollToPage = (pageIndex) => {
    const step = getStep();
    const visibleCount = getVisibleCount();
    track.scrollTo({ left: step * visibleCount * pageIndex, behavior: "smooth" });
  };

  const scrollByPage = (direction) => {
    const pageCount = getPageCount();
    const nextPage = (getCurrentPage() + direction + pageCount) % pageCount;
    scrollToPage(nextPage);
    window.setTimeout(updateDots, 420);
  };

  const restartAutoplay = () => {
    window.clearInterval(discoverAutoplayTimer);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || getPageCount() <= 1) return;
    discoverAutoplayTimer = window.setInterval(() => scrollByPage(1), DISCOVER_AUTOPLAY_MS);
  };

  const handleManualSlide = (direction) => {
    scrollByPage(direction);
    restartAutoplay();
  };

  prev.addEventListener("click", () => handleManualSlide(-1));
  next.addEventListener("click", () => handleManualSlide(1));
  track.addEventListener("scroll", () => window.requestAnimationFrame(updateDots), { passive: true });
  track.addEventListener("mouseenter", () => window.clearInterval(discoverAutoplayTimer));
  track.addEventListener("mouseleave", restartAutoplay);
  track.addEventListener("focusin", () => window.clearInterval(discoverAutoplayTimer));
  track.addEventListener("focusout", restartAutoplay);
  window.addEventListener("resize", () => {
    updateControls();
    scrollToPage(Math.min(getCurrentPage(), getPageCount() - 1));
    updateDots();
    restartAutoplay();
  });

  updateControls();
  updateDots();
  restartAutoplay();
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

  const discoverProducts = products.filter((product) => product.isActive !== false && product.imageUrl);

  track.innerHTML = discoverProducts
    .map((product) => {
      const detailHref = `pages/product-detail.html?id=${encodeURIComponent(product.id)}`;
      return `
        <a href="${detailHref}">
          <img src="${resolveAssetUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
        </a>
      `;
    })
    .join("");

  setupSlider();
};

const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE}/products?active=true`);
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
  fetchProducts();
});
