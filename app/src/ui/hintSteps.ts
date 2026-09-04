/**
 * Пошаговые подсказки: hint-строки задач имеют формат
 * «Пошаговое решение:\n1. Шаг…\n2. Шаг…». Модуль разбирает строку в
 * отдельные шаги и показывает их по одному — «попробуй → следующий шаг»,
 * вместо раскрытия всего решения сразу.
 */

import { getAppLang } from "../localization";

/**
 * Разбирает hint-строку на шаги. Возвращает null, если строка не
 * распознаётся как пронумерованный список (тогда caller показывает
 * текст как раньше).
 */
export function parseHintSteps(hint: string): string[] | null {
  const lines = hint
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const stepRe = /^\d+[.)]\s+(.+)$/;
  const steps: string[] = [];
  let sawNumbered = false;
  for (const line of lines) {
    const m = stepRe.exec(line);
    if (m) {
      sawNumbered = true;
      steps.push(m[1].trim());
    } else if (!sawNumbered) {
      // Заголовок («Пошаговое решение:») перед первым шагом — пропускаем
      continue;
    } else {
      // Продолжение предыдущего шага без номера — приклеиваем
      if (steps.length) steps[steps.length - 1] += ` ${line}`;
      else return null;
    }
  }
  // Одиночный шаг нет смысла дробить — показываем как обычный текст
  return sawNumbered && steps.length > 1 ? steps : null;
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

/**
 * Рендерит пошаговую подсказку в контейнер `<details>` задачи.
 * Показывает шаги по одному; когда шаги кончились — кнопку
 * «Показать решение целиком» (последний шаг часто содержит признак
 * завершения, но полный текст полезен для сверки).
 */
export function renderHintSteps(container: HTMLElement, hint: string): void {
  const steps = parseHintSteps(hint);
  container.innerHTML = "";
  if (!steps) {
    // Fallback: старое поведение — весь текст подсказки сразу
    const div = document.createElement("div");
    div.className = "task-hint";
    div.textContent = hint;
    container.appendChild(div);
    return;
  }

  let index = 0;

  const stateEl = document.createElement("div");
  stateEl.className = "hint-steps";
  const controlsEl = document.createElement("div");
  controlsEl.className = "hint-steps-controls";

  const renderStep = () => {
    stateEl.innerHTML = "";
    if (index === 0) {
      const intro = document.createElement("div");
      intro.className = "hint-steps-intro";
      intro.textContent = t(
        `Решение разбито на ${steps.length} шага(ов). Открывайте по одному — попробуйте каждый самостоятельно.`,
        `The solution is split into ${steps.length} steps. Reveal one at a time and try each on your own.`,
      );
      stateEl.appendChild(intro);
    } else {
      const ol = document.createElement("ol");
      ol.className = "hint-steps-list";
      for (let i = 0; i < index; i++) {
        const li = document.createElement("li");
        li.textContent = steps[i];
        ol.appendChild(li);
      }
      stateEl.appendChild(ol);
    }

    controlsEl.innerHTML = "";
    if (index < steps.length) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn small primary hint-next-btn";
      btn.textContent =
        index === 0
          ? t("Показать шаг 1", `Show step 1`)
          : t(`Шаг ${index + 1} из ${steps.length}`, `Step ${index + 1} of ${steps.length}`);
      btn.addEventListener("click", () => {
        index++;
        renderStep();
      });
      controlsEl.appendChild(btn);
    } else {
      const done = document.createElement("span");
      done.className = "hint-steps-done";
      done.textContent = t(
        "Это все шаги. Если не выходит — перечитайте с начала.",
        "That's all the steps. If stuck — re-read from the start.",
      );
      controlsEl.appendChild(done);
    }
  };

  renderStep();
  container.appendChild(stateEl);
  container.appendChild(controlsEl);
}

/** Готовит `<details>` подсказки под пошаговый режим (вызывается из tasks.ts). */
export function mountHintSteps(hintDetails: HTMLDetailsElement, hint: string): void {
  const target = hintDetails.querySelector<HTMLElement>(".hint-steps-mount");
  if (target) {
    renderHintSteps(target, hint);
  } else {
    const mount = document.createElement("div");
    mount.className = "hint-steps-mount";
    hintDetails.appendChild(mount);
    renderHintSteps(mount, hint);
  }
}
