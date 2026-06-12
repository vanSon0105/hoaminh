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

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupReveal();
  setupFaq();
  setupSlider();
});
