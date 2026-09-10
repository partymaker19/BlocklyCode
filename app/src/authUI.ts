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
  if (userEmail) {
    // Показываем имя, если есть; иначе — короткую форму email (до @),
    // полный email — в тултипе. Хедер остаётся компактным.
    const label = user?.name?.trim() || user?.email?.split("@")[0] || user?.id || "";
    userEmail.textContent = label;
    userEmail.title = user?.email || "";
  }
}

/**
 * Спрашивает у сервера, какие OAuth-провайдеры реально настроены,
 * и скрывает кнопки недоступных (чтобы не уводить на 501).
 * До ответа сервера кнопки скрыты все.
 */
async function syncOAuthProviders(): Promise<void> {
  const container = document.querySelector<HTMLElement>(".provider-list");
  if (!container) return;
  let providers: Record<string, boolean> = {};
  try {
    const res = await fetch("/api/auth/providers", { credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as {
      providers?: Record<string, boolean>;
    };
    providers = data.providers || {};
  } catch {
    // API недоступен (оффлайн) — прячем все соц-кнопки, email работает
  }
  const btns = container.querySelectorAll<HTMLAnchorElement>(
    ".auth-provider-btn",
  );
  for (const btn of btns) {
    const p = btn.dataset.provider || "";
    btn.style.display = providers[p] ? "" : "none";
  }
  // Если ни один провайдер не настроен — прячем весь блок с соц-кнопками
  const anyEnabled = Object.values(providers).some(Boolean);
  container.style.display = anyEnabled ? "" : "none";
  // И разделитель «или по email»
  const sep = document.querySelector<HTMLElement>(".email-separator");
  if (sep) sep.style.display = anyEnabled ? "" : "none";
}

function openAuthModal() {
  const modal = byId<HTMLDivElement>("authModal");
  const content = modal?.querySelector<HTMLElement>(".modal-content");
  if (!modal) return;
  modal.style.display = "block";
  void syncOAuthProviders();
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
  const nameInput = byId<HTMLInputElement>("authName");
  const modal = byId<HTMLDivElement>("authModal");

  // Открыть/закрыть
  openBtn?.addEventListener("click", () => openAuthModal());
  closeBtn?.addEventListener("click", () => closeAuthModal());
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeAuthModal();
  });

  // Действия (вход/регистрация/выход)
  const EMAIL_RE = /^\S+@\S+\.\S+$/;

  const showAuthError = (message: string) => {
    const el = byId<HTMLDivElement>("authError");
    if (el) {
      el.textContent = message;
      el.style.display = "block";
    } else {
      alert(message);
    }
  };
  const clearAuthError = () => {
    const el = byId<HTMLDivElement>("authError");
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
  };

  loginBtn?.addEventListener("click", async () => {
    clearAuthError();
    const email = emailInput?.value?.trim() || "";
    const password = passInput?.value || "";
    if (!EMAIL_RE.test(email)) {
      showAuthError("Введите корректный email (например: user@mail.com)");
      return;
    }
    if (!password) {
      showAuthError("Введите пароль");
      return;
    }
    try {
      await loginWithEmail(email, password);
      closeAuthModal();
      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      if (passInput) passInput.value = "";
    } catch (e) {
      showAuthError(
        "Не удалось войти: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  });

  registerBtn?.addEventListener("click", async () => {
    clearAuthError();
    const email = emailInput?.value?.trim() || "";
    const password = passInput?.value || "";
    const name = nameInput?.value?.trim() || "";
    if (!EMAIL_RE.test(email)) {
      showAuthError("Введите корректный email (например: user@mail.com)");
      return;
    }
    if (password.length < 6) {
      showAuthError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (name.length > 30) {
      showAuthError("Имя не может быть длиннее 30 символов");
      return;
    }
    try {
      await registerWithEmail(email, password, name);
      closeAuthModal();
      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      if (passInput) passInput.value = "";
    } catch (e) {
      showAuthError(
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
