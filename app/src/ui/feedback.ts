/**
 * Обратная связь: модалка для сообщения о баге / пожелания / вопроса.
 * Отправка на POST /api/feedback (доступно без авторизации).
 */

import { getAppLang } from "../localization";
import { isAuthenticated, getCurrentUser } from "../authClient";

type FeedbackType = "bug" | "idea" | "question" | "other";

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

async function sendFeedback(payload: {
  type: FeedbackType;
  message: string;
  email: string;
  page: string;
}): Promise<{ ok: boolean; delivered: boolean }> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    delivered?: boolean;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return { ok: !!data.ok, delivered: !!data.delivered };
}

function typeOptionsHtml(): string {
  return `
    <option value="bug">${esc(t("🐞 Баг — что-то сломалось", "🐞 Bug — something is broken"))}</option>
    <option value="idea">${esc(t("💡 Пожелание — идея для улучшения", "💡 Idea — a suggestion"))}</option>
    <option value="question">${esc(t("❓ Вопрос о работе приложения", "❓ Question about the app"))}</option>
    <option value="other">${esc(t("✉️ Другое", "✉️ Other"))}</option>`;
}

function openFeedbackModal(): void {
  const modal = byId<HTMLDivElement>("feedbackModal");
  const body = byId("feedbackBody");
  if (!modal || !body) return;

  // Email по умолчанию — из аккаунта, если авторизован
  const user = getCurrentUser();
  const userEmail = isAuthenticated() && user?.email ? user.email : "";

  body.innerHTML = `
    <div class="feedback-form">
      <label class="feedback-label" for="feedbackType">${esc(t("Тип сообщения", "Message type"))}</label>
      <select id="feedbackType" class="feedback-select">${typeOptionsHtml()}</select>

      <label class="feedback-label" for="feedbackEmail">${esc(t("Email для ответа (необязательно)", "Email for reply (optional)"))}</label>
      <input id="feedbackEmail" type="email" class="feedback-input" placeholder="you@example.com" value="${esc(userEmail)}" />

      <label class="feedback-label" for="feedbackMessage">${esc(t("Сообщение", "Message"))}</label>
      <textarea id="feedbackMessage" class="feedback-textarea" rows="6"
        placeholder="${esc(t("Опишите баг или поделитесь идеей…", "Describe the bug or share your idea…"))}"></textarea>

      <div id="feedbackStatus" class="feedback-status" style="display:none"></div>

      <div class="feedback-actions">
        <button id="feedbackCancelBtn" class="btn small">${esc(t("Отмена", "Cancel"))}</button>
        <button id="feedbackSendBtn" class="btn primary">${esc(t("Отправить", "Send"))}</button>
      </div>
    </div>`;

  modal.style.display = "block";

  const close = () => {
    modal.style.display = "none";
  };
  byId("feedbackCancelBtn")?.addEventListener("click", close);

  byId("feedbackSendBtn")?.addEventListener("click", async () => {
    const type = (byId<HTMLSelectElement>("feedbackType")?.value || "bug") as FeedbackType;
    const email = byId<HTMLInputElement>("feedbackEmail")?.value.trim() || "";
    const message = byId<HTMLTextAreaElement>("feedbackMessage")?.value.trim() || "";
    const status = byId("feedbackStatus");
    const sendBtn = byId<HTMLButtonElement>("feedbackSendBtn");

    if (!message) {
      if (status) {
        status.style.display = "block";
        status.className = "feedback-status error";
        status.textContent = t("Введите текст сообщения.", "Please enter a message.");
      }
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = t("Отправка…", "Sending…");
    }
    try {
      await sendFeedback({
        type,
        message,
        email,
        page: window.location.pathname || "/",
      });
      close();
      alert(
        t(
          "Спасибо! Сообщение отправлено — мы прочитаем его и ответим при необходимости.",
          "Thank you! Your message has been sent — we will read it and reply if needed.",
        ),
      );
    } catch (e) {
      if (status) {
        status.style.display = "block";
        status.className = "feedback-status error";
        status.textContent = (e as Error).message;
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = t("Отправить", "Send");
      }
    }
  });
}

export function initFeedbackUI(): void {
  const openBtn = byId<HTMLButtonElement>("feedbackBtn");
  const closeBtn = byId("closeFeedbackModal");
  const modal = byId<HTMLDivElement>("feedbackModal");
  if (!openBtn) return;

  openBtn.addEventListener("click", openFeedbackModal);
  closeBtn?.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}
