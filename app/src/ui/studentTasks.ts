/**
 * «Мои задания» (ученик): список заданий, назначенных учителем,
 * с прогрессом и переходом к задаче в панели задач.
 */

import { addAuthChangeListener, isAuthenticated } from "../authClient";
import { getAppLang } from "../localization";
import type { TaskId } from "../tasks";

interface StudentTask {
  id: string;
  class_id: string;
  task_id: TaskId | string;
  assigned_at: string;
  status: string;
  due_date?: string | null;
  completed_at?: string | null;
  class?: { id: string; name: string } | null;
  progress?: { solved: boolean; stars: number; updatedAt: string } | null;
}

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

async function fetchStudentTasks(): Promise<StudentTask[]> {
  const res = await fetch("/api/student/tasks", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as {
    tasks?: StudentTask[];
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data.tasks || [];
}

/**
 * Рендерит список заданий в переданный контейнер.
 * onOpenTask(taskId) — коллбек для перехода к задаче (например, setActiveTask).
 */
export async function renderStudentTasks(
  container: HTMLElement,
  onOpenTask?: (taskId: string) => void,
): Promise<void> {
  container.innerHTML = `<p class="classes-empty">${esc(t("Загрузка…", "Loading…"))}</p>`;
  let tasks: StudentTask[];
  try {
    tasks = await fetchStudentTasks();
  } catch (e) {
    container.innerHTML = `<p class="classes-error">${esc((e as Error).message)}</p>`;
    return;
  }

  if (!tasks.length) {
    container.innerHTML = `<p class="classes-empty">${esc(
      t(
        "Учитель пока не назначил вам заданий.",
        "Your teacher has not assigned you any tasks yet.",
      ),
    )}</p>`;
    return;
  }

  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  container.innerHTML = `
    <table class="classes-table">
      <thead><tr>
        <th>${esc(t("Задача", "Task"))}</th>
        <th>${esc(t("Класс", "Class"))}</th>
        <th>${esc(t("Статус", "Status"))}</th>
        <th>${esc(t("Срок", "Due"))}</th>
        <th>${esc(t("Прогресс", "Progress"))}</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${tasks
          .map(
            (task) => `
          <tr>
            <td>${esc(task.task_id)}</td>
            <td>${esc(task.class?.name || "")}</td>
            <td>${
              task.status === "completed"
                ? `✅ ${esc(t("выполнено", "done"))}`
                : `⏳ ${esc(task.status)}`
            }</td>
            <td>${esc(fmtDate(task.due_date))}</td>
            <td>${
              task.progress?.solved
                ? `${esc(String(task.progress.stars))} ★`
                : "—"
            }</td>
            <td>
              <button class="btn small primary" data-open-task="${esc(task.task_id)}">${esc(t("Открыть", "Open"))}</button>
            </td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;

  container
    .querySelectorAll<HTMLButtonElement>("[data-open-task]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const taskId = btn.dataset.openTask || "";
        if (taskId && onOpenTask) onOpenTask(taskId);
      });
    });
}

/** Полный экран «Мои задания»: контейнер + обновление по кнопке. */
export function initStudentTasksUI(): void {
  const openBtn = byId<HTMLButtonElement>("studentTasksBtn");
  const modal = byId<HTMLDivElement>("studentTasksModal");
  const closeBtn = byId("closeStudentTasksModal");
  const body = byId("studentTasksBody");
  if (!openBtn || !modal || !body) return;

  const open = () => {
    modal.style.display = "block";
    // setActiveTask импортируется динамически, чтобы избежать циклических зависимостей
    import("../tasks")
      .then(({ setActiveTask }) => {
        void renderStudentTasks(body, (taskId) => {
          try {
            setActiveTask(taskId as TaskId);
          } catch {}
          modal.style.display = "none";
          // Показываем панель задач с назначенной задачей:
          // открываем сайдбар и выходим из режима выбора сложности
          const sidebar = document.getElementById("taskSidebar");
          if (sidebar) {
            sidebar.classList.remove("mode-select");
            if (!sidebar.classList.contains("open")) {
              sidebar.classList.add("open");
            }
            const pageContainer = document.getElementById("pageContainer");
            if (pageContainer && !document.body.classList.contains("mobile")) {
              pageContainer.classList.add("sidebar-open");
            }
          }
        });
      })
      .catch(() => {
        void renderStudentTasks(body);
      });
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Видимость: только авторизованным (шапка + мобильное меню)
  const mobileBtn = byId<HTMLButtonElement>("mobileStudentTasksBtn");
  const sync = () => {
    openBtn.style.display = isAuthenticated() ? "inline-flex" : "none";
    if (mobileBtn) mobileBtn.style.display = isAuthenticated() ? "" : "none";
  };
  addAuthChangeListener(() => sync());
  sync();
}
