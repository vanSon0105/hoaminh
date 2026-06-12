const SESSION_TOKEN_KEY = "hoaminh-token";

const isPagesRoute = () => window.location.pathname.includes("/pages/");

const getSessionPath = (pageName) => {
  return isPagesRoute() ? pageName : `pages/${pageName}`;
};

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

document.addEventListener("DOMContentLoaded", setupAccountLinks);
