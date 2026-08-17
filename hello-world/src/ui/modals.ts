/**
 * Управление модальными окнами: drag & drop, открытие/закрытие.
 */

// Отслеживаем уже инициализированные drag-заголовки, чтобы не навешивать обработчики дважды
const modalDragHandles = new WeakSet<HTMLElement>();

/**
 * Делает модальное окно перетаскиваемым за заголовок.
 * @param content  Контейнер модалки (position: fixed)
 * @param header  Заголовок, за который тянем
 * @param ignoreCloseSelector  Селектор кнопки закрытия, чтобы не начинать drag по ней
 * @param minTop  Минимальный отступ сверху при drag
 */
export function makeModalDraggable(
  content: HTMLElement,
  header: HTMLElement,
  ignoreCloseSelector: string,
  minTop = 10,
): void {
  if (modalDragHandles.has(header)) return;
  modalDragHandles.add(header);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let cachedWidth = 0;
  let cachedHeight = 0;
  let dragScheduled = false;
  let pendingLeft = 0;
  let pendingTop = 0;

  function onMouseDown(ev: MouseEvent) {
    if (ev.button !== 0) return;
    const target = ev.target as HTMLElement | null;
    if (target && ignoreCloseSelector && target.closest(ignoreCloseSelector))
      return;
    ev.preventDefault();
    isDragging = true;

    const rect = content.getBoundingClientRect();
    content.style.left = rect.left + "px";
    content.style.top = rect.top + "px";
    content.style.transform = "none";
    content.style.animation = "none";

    cachedWidth = rect.width;
    cachedHeight = rect.height;

    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(ev: MouseEvent) {
    if (!isDragging) return;
    pendingLeft = ev.clientX - offsetX;
    pendingTop = ev.clientY - offsetY;
    if (dragScheduled) return;
    dragScheduled = true;
    requestAnimationFrame(() => {
      dragScheduled = false;
      let nextLeft = pendingLeft;
      let nextTop = pendingTop;
      const maxLeft = window.innerWidth - cachedWidth;
      const maxTop = window.innerHeight - cachedHeight;
      if (nextLeft < 0) nextLeft = 0;
      else if (nextLeft > maxLeft) nextLeft = maxLeft;
      if (nextTop < minTop) nextTop = minTop;
      else if (nextTop > maxTop) nextTop = maxTop;
      content.style.left = `${nextLeft}px`;
      content.style.top = `${nextTop}px`;
    });
  }

  function onMouseUp() {
    isDragging = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  header.addEventListener("mousedown", onMouseDown);
}

/**
 * Универсальная функция открытия модального окна (центрирование + drag).
 * @param modal  Блок модального окна (style.display = "block")
 * @param content  Контейнер содержимого модалки
 * @param header  Заголовок для drag
 * @param closeSelector  Селектор кнопки закрытия внутри header
 */
export function openModal(
  modal: HTMLElement,
  content: HTMLElement | null,
  header: HTMLElement | null,
  closeSelector: string,
): void {
  modal.style.display = "block";
  if (content) {
    content.style.left = "50%";
    content.style.top = "50%";
    content.style.transform = "translate(-50%, -50%)";
    content.style.animation = "";
  }
  if (content && header) {
    makeModalDraggable(content, header, closeSelector);
  }
}

/**
 * Закрывает модальное окно и очищает текстовые поля.
 */
export function closeModal(
  modal: HTMLElement,
  ...fieldsToClear: (HTMLInputElement | HTMLTextAreaElement | null)[]
): void {
  modal.style.display = "none";
  for (const field of fieldsToClear) {
    if (field) field.value = "";
  }
}

/**
 * Инициализирует модальное окно импорта блока.
 */
export function initImportModal(options: {
  importModal: HTMLElement;
  modalContent: HTMLElement | null;
  modalHeader: HTMLElement | null;
  blockJsonTextarea: HTMLTextAreaElement | null;
  blockGeneratorTextarea: HTMLTextAreaElement | null;
  confirmImportBtn: HTMLButtonElement | null;
  cancelImportBtn: HTMLButtonElement | null;
  closeModalBtn: HTMLElement | null;
  onConfirm: () => void;
}): { open: () => void; close: () => void } {
  const {
    importModal,
    modalContent,
    modalHeader,
    blockJsonTextarea,
    blockGeneratorTextarea,
    confirmImportBtn,
    cancelImportBtn,
    closeModalBtn,
    onConfirm,
  } = options;

  const open = () => {
    openModal(importModal, modalContent, modalHeader, "#closeModal");
  };

  const close = () => {
    closeModal(importModal, blockJsonTextarea, blockGeneratorTextarea);
  };

  if (closeModalBtn) closeModalBtn.addEventListener("click", close);
  if (cancelImportBtn) cancelImportBtn.addEventListener("click", close);
  if (confirmImportBtn) confirmImportBtn.addEventListener("click", onConfirm);

  // Закрытие по клику на backdrop
  importModal.addEventListener("click", (e) => {
    if (e.target === importModal) close();
  });

  return { open, close };
}

/**
 * Инициализирует модальное окно справки.
 */
export function initHelpModal(options: {
  helpModal: HTMLElement;
  blockHelpBtn: HTMLElement | null;
  closeHelpModal: HTMLElement | null;
  content: HTMLElement | null;
}): void {
  const { helpModal, blockHelpBtn, closeHelpModal, content } = options;

  if (blockHelpBtn) {
    blockHelpBtn.addEventListener("click", () => {
      openModal(
        helpModal,
        content?.querySelector(".modal-content") || content,
        content?.querySelector(".modal-header") || null,
        "#closeHelpModal",
      );
    });
  }

  if (closeHelpModal) {
    closeHelpModal.addEventListener("click", () => closeModal(helpModal));
  }

  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) closeModal(helpModal);
  });
}

/**
 * Инициализирует модальное окно поддержки/доната.
 */
export function initSupportModal(options: {
  supportModal: HTMLElement;
  supportBtn: HTMLElement | null;
  closeSupportModal: HTMLElement | null;
  closeSupportBtn: HTMLElement | null;
  copyCardBtn: HTMLElement | null;
  supportCardNumberEl: HTMLElement | null;
}): void {
  const {
    supportModal,
    supportBtn,
    closeSupportModal,
    closeSupportBtn,
    copyCardBtn,
    supportCardNumberEl,
  } = options;

  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      supportModal.style.display = "block";
    });
  }

  const close = () => closeModal(supportModal);

  if (closeSupportModal) closeSupportModal.addEventListener("click", close);
  if (closeSupportBtn) closeSupportBtn.addEventListener("click", close);
  supportModal.addEventListener("click", (e) => {
    if (e.target === supportModal) close();
  });

  if (copyCardBtn && supportCardNumberEl) {
    copyCardBtn.addEventListener("click", async () => {
      const text =
        supportCardNumberEl.getAttribute("data-card") ||
        supportCardNumberEl.textContent?.trim() ||
        "";
      try {
        await navigator.clipboard.writeText(text);
        // Можно показать всплывающую подсказку "Скопировано!"
        copyCardBtn.textContent = "✓";
        setTimeout(() => {
          copyCardBtn.textContent = "📋";
        }, 2000);
      } catch {
        // Фолбэк для старых браузеров
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    });
  }
}
