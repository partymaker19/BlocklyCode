import {
  addAuthChangeListener,
  loginWithEmail,
  registerWithEmail,
  logout,
  getCurrentUser,
} from "./authClient";

// UI для авторизации: модалка логина/регистрации и отображение статуса пользователя
function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function updateAuthUI() {
  const openBtn = byId<HTMLButtonElement>("openAuthModalBtn");
  const userInfo = byId<HTMLDivElement>("userInfo");
  const userEmail = byId<HTMLSpanElement>("userEmail");
  const user = getCurrentUser();
  const authed = !!user?.id;
  if (openBtn) openBtn.style.display = authed ? "none" : "inline-flex";
  if (userInfo) userInfo.style.display = authed ? "inline-flex" : "none";
  if (userEmail)
    userEmail.textContent = user?.email || user?.name || user?.id || "";
}

function openAuthModal() {
  const modal = byId<HTMLDivElement>("authModal");
  const content = modal?.querySelector<HTMLElement>(".modal-content");
  if (!modal) return;
  modal.style.display = "block";
  if (content) {
    content.style.left = "50%";
    content.style.top = "50%";
    content.style.transform = "translate(-50%, -50%)";
  }
}

function closeAuthModal() {
  const modal = byId<HTMLDivElement>("authModal");
  if (modal) modal.style.display = "none";
}

export function initAuthUI() {
  // Кнопки и поля ввода
  const openBtn = byId<HTMLButtonElement>("openAuthModalBtn");
  const closeBtn = byId<HTMLSpanElement>("closeAuthModal");
  const loginBtn = byId<HTMLButtonElement>("authLoginBtn");
  const registerBtn = byId<HTMLButtonElement>("authRegisterBtn");
  const logoutBtn = byId<HTMLButtonElement>("logoutBtn");
  const emailInput = byId<HTMLInputElement>("authEmail");
  const passInput = byId<HTMLInputElement>("authPassword");
  const modal = byId<HTMLDivElement>("authModal");

  // Открыть/закрыть
  openBtn?.addEventListener("click", () => openAuthModal());
  closeBtn?.addEventListener("click", () => closeAuthModal());
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeAuthModal();
  });

  // Действия (вход/регистрация/выход)
  loginBtn?.addEventListener("click", async () => {
    const email = emailInput?.value?.trim() || "";
    const password = passInput?.value || "";
    try {
      await loginWithEmail(email, password);
      closeAuthModal();
      if (emailInput) emailInput.value = "";
      if (passInput) passInput.value = "";
    } catch (e) {
      alert(
        "Не удалось войти: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  });

  registerBtn?.addEventListener("click", async () => {
    const email = emailInput?.value?.trim() || "";
    const password = passInput?.value || "";
    try {
      await registerWithEmail(email, password);
      closeAuthModal();
      if (emailInput) emailInput.value = "";
      if (passInput) passInput.value = "";
    } catch (e) {
      alert(
        "Не удалось зарегистрироваться: " +
          (e instanceof Error ? e.message : String(e)),
      );
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      await logout();
    } catch {}
  });

  // Реакция на изменения авторизации
  addAuthChangeListener(() => updateAuthUI());
  updateAuthUI();
}
