const SESSION_TOKEN_KEY = "hoaminh-token";

const isPagesRoute = () => window.location.pathname.includes("/pages/");

const getSessionPath = (pageName) => {
  return isPagesRoute() ? pageName : `pages/${pageName}`;
};

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim().toLowerCase();

const setupAccountLinks = () => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const accountHref = getSessionPath("account.html");
  const loginHref = getSessionPath("login.html");
  const targetHref = token ? accountHref : loginHref;
  const targetLabel = token ? "Tài khoản" : "Đăng nhập";

  document.querySelectorAll(".icon-link").forEach((link) => {
    if (!link.querySelector(".fa-circle-user")) return;
    link.href = targetHref;
    link.setAttribute("aria-label", targetLabel);
  });
};

const setupCheckoutLinks = () => {
  if (!localStorage.getItem(SESSION_TOKEN_KEY)) return;

  document.querySelectorAll('a[href$="checkout.html"]').forEach((link) => {
    if (!normalizeText(link.textContent).startsWith("thanh")) return;
    link.href = getSessionPath("delivery.html");
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupAccountLinks();
  setupCheckoutLinks();
});
