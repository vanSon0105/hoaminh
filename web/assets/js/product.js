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

const setupFilters = () => {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.filter;
      document.querySelectorAll(`[data-filter="${group}"]`).forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
};

const setupFavorites = () => {
  const toast = document.querySelector("[data-toast]");
  let timer;
  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-on");
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-regular", !button.classList.contains("is-on"));
        icon.classList.toggle("fa-solid", button.classList.contains("is-on"));
      }
      if (!toast) return;
      toast.textContent = button.classList.contains("is-on") ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích";
      toast.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
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

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupFilters();
  setupFavorites();
  setupLoadMore();
});
