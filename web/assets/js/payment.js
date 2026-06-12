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
    { threshold: 0.16 }
  );
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
};

const setupTabs = () => {
  document.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-method]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupTabs();
});
