import type * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import type { SupportedLanguage } from "./codeExecution";
import { getAppLang, getAceUIStrings } from "./localization";

// Ace imports and configuration
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-beautify";
import "ace-builds/src-noconflict/ext-keybinding_menu";
import "ace-builds/src-noconflict/keybinding-vim";
import "ace-builds/src-noconflict/keybinding-emacs";

(ace as any).config.set("basePath", "/ace");
(ace as any).config.set("modePath", "/ace");
(ace as any).config.set("themePath", "/ace");
(ace as any).config.set("workerPath", "/ace");

let aceEditor: any | null = null;

const ACE_SETTINGS_KEY = "ace_editor_settings";

interface AceSettings {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  wrap?: boolean;
  showInvisibles?: boolean;
  highlightActiveLine?: boolean;
  showPrintMargin?: boolean;
  showGutter?: boolean;
  useSoftTabs?: boolean;
  showFoldWidgets?: boolean;
  keybinding?: string;
}

function loadAceSettings(): AceSettings {
  try {
    const stored = localStorage.getItem(ACE_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAceSettings(settings: Partial<AceSettings>) {
  try {
    const existing = loadAceSettings();
    const updated = { ...existing, ...settings };
    localStorage.setItem(ACE_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // ignore errors
  }
}

export function getAceEditor() {
  return aceEditor;
}

export function setupAceEditor(getSelectedLanguage: () => SupportedLanguage) {
  const editorEl = document.getElementById("editor") as HTMLDivElement | null;
  if (!editorEl) return;

  aceEditor = ace.edit(editorEl, {
    mode: "ace/mode/javascript",
    theme: "ace/theme/chrome",
    wrap: true,
    showPrintMargin: false,
    useWorker: true,
    tabSize: 2,
  });

  (ace as any).require("ace/ext/language_tools");
  if (aceEditor) {
    aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      fontSize: 13,
      showGutter: true,
      highlightActiveLine: true,
    });
    aceEditor.setShowFoldWidgets(true);
    aceEditor.setShowInvisibles(false);
  }

  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    aceEditor?.setTheme("ace/theme/monokai");
    const themeSelect = document.getElementById(
      "aceThemeSelect"
    ) as HTMLSelectElement | null;
    if (themeSelect) themeSelect.value = "ace/theme/monokai";
  }

  // Hook up toolbar controls
  const themeSelect = document.getElementById(
    "aceThemeSelect"
  ) as HTMLSelectElement | null;
  const fontSizeInput = document.getElementById(
    "aceFontSize"
  ) as HTMLInputElement | null;
  const tabSizeInput = document.getElementById(
    "aceTabSize"
  ) as HTMLInputElement | null;
  const wrapCheckbox = document.getElementById(
    "aceWrap"
  ) as HTMLInputElement | null;
  const invisiblesCheckbox = document.getElementById(
    "aceInvisibles"
  ) as HTMLInputElement | null;
  const activeLineCheckbox = document.getElementById(
    "aceActiveLine"
  ) as HTMLInputElement | null;
  const printMarginCheckbox = document.getElementById(
    "acePrintMargin"
  ) as HTMLInputElement | null;
  const gutterCheckbox = document.getElementById(
    "aceGutter"
  ) as HTMLInputElement | null;
  const softTabsCheckbox = document.getElementById(
    "aceSoftTabs"
  ) as HTMLInputElement | null;
  const foldWidgetsCheckbox = document.getElementById(
    "aceFoldWidgets"
  ) as HTMLInputElement | null;
  const keybindingSelect = document.getElementById(
    "aceKeybinding"
  ) as HTMLSelectElement | null;

  const copyBtn = document.getElementById(
    "copyCodeBtn"
  ) as HTMLButtonElement | null;
  const downloadBtn = document.getElementById(
    "downloadCodeBtn"
  ) as HTMLButtonElement | null;

  const searchBtn = document.getElementById(
    "aceSearchBtn"
  ) as HTMLButtonElement | null;
  const replaceBtn = document.getElementById(
    "aceReplaceBtn"
  ) as HTMLButtonElement | null;
  const gotoBtn = document.getElementById(
    "aceGotoBtn"
  ) as HTMLButtonElement | null;
  const formatBtn = document.getElementById(
    "aceFormatBtn"
  ) as HTMLButtonElement | null;
  const shortcutsBtn = document.getElementById(
    "aceShortcutsBtn"
  ) as HTMLButtonElement | null;

  const settingsToggle = document.getElementById(
    "aceSettingsToggle"
  ) as HTMLButtonElement | null;
  const settingsPanel = document.getElementById(
    "aceSettingsPanel"
  ) as HTMLDivElement | null;
  const aceSaveBtn = document.getElementById(
    "aceSaveSettings"
  ) as HTMLButtonElement | null;

  const statusBar = document.getElementById(
    "editorStatusbar"
  ) as HTMLDivElement | null;

  // Apply saved Ace settings on init (deferred)
  setTimeout(() => {
    try {
      const saved = loadAceSettings();
      if (aceEditor) {
        if (saved.theme) {
          aceEditor.setTheme(saved.theme);
          if (themeSelect) themeSelect.value = saved.theme;
        }
        if (typeof saved.fontSize === "number") {
          aceEditor.setFontSize(saved.fontSize);
          if (fontSizeInput) fontSizeInput.value = String(saved.fontSize);
        }
        if (typeof saved.tabSize === "number") {
          aceEditor.session.setTabSize(saved.tabSize);
          if (tabSizeInput) tabSizeInput.value = String(saved.tabSize);
        }
        if (typeof saved.wrap === "boolean") {
          aceEditor.session.setUseWrapMode(saved.wrap);
          if (wrapCheckbox) wrapCheckbox.checked = saved.wrap;
        }
        if (typeof saved.showInvisibles === "boolean") {
          aceEditor.setShowInvisibles(saved.showInvisibles);
          if (invisiblesCheckbox)
            invisiblesCheckbox.checked = saved.showInvisibles;
        }
        if (typeof saved.highlightActiveLine === "boolean") {
          aceEditor.setHighlightActiveLine(saved.highlightActiveLine);
          if (activeLineCheckbox)
            activeLineCheckbox.checked = saved.highlightActiveLine;
        }
        if (typeof saved.showPrintMargin === "boolean") {
          aceEditor.setShowPrintMargin(saved.showPrintMargin);
          if (printMarginCheckbox)
            printMarginCheckbox.checked = saved.showPrintMargin;
        }
        if (typeof saved.showGutter === "boolean") {
          aceEditor.setOption("showGutter", saved.showGutter);
          if (gutterCheckbox) gutterCheckbox.checked = saved.showGutter;
        }
        if (typeof saved.useSoftTabs === "boolean") {
          aceEditor.session.setUseSoftTabs(saved.useSoftTabs);
          if (softTabsCheckbox) softTabsCheckbox.checked = saved.useSoftTabs;
        }
        if (typeof saved.showFoldWidgets === "boolean") {
          aceEditor.setShowFoldWidgets(saved.showFoldWidgets);
          if (foldWidgetsCheckbox)
            foldWidgetsCheckbox.checked = saved.showFoldWidgets;
        }
        if (saved.keybinding) {
          if (saved.keybinding === "vim")
            aceEditor.setKeyboardHandler("ace/keyboard/vim");
          else if (saved.keybinding === "emacs")
            aceEditor.setKeyboardHandler("ace/keyboard/emacs");
          else aceEditor.setKeyboardHandler(null as any);
          if (keybindingSelect) keybindingSelect.value = saved.keybinding;
        }
      }
    } catch {}
  }, 0);

  if (themeSelect)
    themeSelect.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setTheme(themeSelect.value);
      saveAceSettings({ theme: themeSelect.value });
    });
  if (fontSizeInput)
    fontSizeInput.addEventListener("input", () => {
      if (!aceEditor) return;
      const v = Math.max(
        10,
        Math.min(24, parseInt(fontSizeInput.value || "13", 10))
      );
      aceEditor.setFontSize(v);
      saveAceSettings({ fontSize: v });
    });
  if (tabSizeInput)
    tabSizeInput.addEventListener("input", () => {
      if (!aceEditor) return;
      const v = Math.max(
        2,
        Math.min(8, parseInt(tabSizeInput.value || "2", 10))
      );
      aceEditor.session.setTabSize(v);
      saveAceSettings({ tabSize: v });
    });
  if (wrapCheckbox)
    wrapCheckbox.addEventListener("input", () => {
      if (!aceEditor) return;
      aceEditor.session.setUseWrapMode(!!wrapCheckbox.checked);
      saveAceSettings({ wrap: !!wrapCheckbox.checked });
    });
  if (invisiblesCheckbox)
    invisiblesCheckbox.addEventListener("input", () => {
      if (!aceEditor) return;
      aceEditor.setShowInvisibles(!!invisiblesCheckbox.checked);
      saveAceSettings({ showInvisibles: !!invisiblesCheckbox.checked });
    });
  if (activeLineCheckbox)
    activeLineCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setHighlightActiveLine(!!activeLineCheckbox.checked);
      saveAceSettings({ highlightActiveLine: !!activeLineCheckbox.checked });
    });
  if (printMarginCheckbox)
    printMarginCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setShowPrintMargin(!!printMarginCheckbox.checked);
      saveAceSettings({ showPrintMargin: !!printMarginCheckbox.checked });
    });
  if (gutterCheckbox)
    gutterCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setOption("showGutter", !!gutterCheckbox.checked);
      saveAceSettings({ showGutter: !!gutterCheckbox.checked });
    });
  if (softTabsCheckbox)
    softTabsCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.session.setUseSoftTabs(!!softTabsCheckbox.checked);
      saveAceSettings({ useSoftTabs: !!softTabsCheckbox.checked });
    });
  if (foldWidgetsCheckbox)
    foldWidgetsCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setShowFoldWidgets(!!foldWidgetsCheckbox.checked);
      saveAceSettings({ showFoldWidgets: !!foldWidgetsCheckbox.checked });
    });
  if (keybindingSelect)
    keybindingSelect.addEventListener("change", () => {
      if (!aceEditor) return;
      const val = keybindingSelect.value;
      if (val === "vim") aceEditor.setKeyboardHandler("ace/keyboard/vim");
      else if (val === "emacs")
        aceEditor.setKeyboardHandler("ace/keyboard/emacs");
      else aceEditor.setKeyboardHandler(null as any);
      saveAceSettings({ keybinding: val });
    });

  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      try {
        await navigator.clipboard.writeText(text);
        const { copySuccess } = getAceUIStrings(getAppLang());
        copyBtn.textContent = copySuccess;
        setTimeout(() => {
          copyBtn.textContent = "⧉";
        }, 1200);
      } catch {}
    });
  if (downloadBtn)
    downloadBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      const lang = getSelectedLanguage();
      const ext = lang === "python" ? "py" : lang === "lua" ? "lua" : "js";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `code.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

  if (searchBtn)
    searchBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("find");
    });
  if (replaceBtn)
    replaceBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("replace");
    });
  if (gotoBtn)
    gotoBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("gotoline");
    });
  if (formatBtn)
    formatBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      try {
        const beautify = (ace as any).require("ace/ext/beautify");
        beautify.beautify(aceEditor.session);
      } catch (e) {
        // silently ignore
      }
    });
  if (shortcutsBtn)
    shortcutsBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      try {
        const kb = (ace as any).require("ace/ext/keybinding_menu");
        if (kb && typeof kb.init === "function") {
          kb.init(aceEditor);
        }
        aceEditor.execCommand("showKeyboardShortcuts");
      } catch {}
    });

  if (aceSaveBtn)
    aceSaveBtn.addEventListener("click", () => {
      const next: Partial<AceSettings> = {};
      if (themeSelect && themeSelect.value) {
        next.theme = themeSelect.value;
        if (aceEditor) aceEditor.setTheme(themeSelect.value);
      }
      if (fontSizeInput && fontSizeInput.value) {
        const v = Math.max(10, Math.min(24, parseInt(fontSizeInput.value, 10)));
        next.fontSize = v;
        if (aceEditor) aceEditor.setFontSize(v);
      }
      if (tabSizeInput && tabSizeInput.value) {
        const v = Math.max(2, Math.min(8, parseInt(tabSizeInput.value, 10)));
        next.tabSize = v;
        if (aceEditor) aceEditor.session.setTabSize(v);
      }
      if (wrapCheckbox) {
        next.wrap = !!wrapCheckbox.checked;
        if (aceEditor) aceEditor.session.setUseWrapMode(!!wrapCheckbox.checked);
      }
      if (invisiblesCheckbox) {
        next.showInvisibles = !!invisiblesCheckbox.checked;
        if (aceEditor) aceEditor.setShowInvisibles(!!invisiblesCheckbox.checked);
      }
      if (activeLineCheckbox) {
        next.highlightActiveLine = !!activeLineCheckbox.checked;
        if (aceEditor)
          aceEditor.setHighlightActiveLine(!!activeLineCheckbox.checked);
      }
      if (printMarginCheckbox) {
        next.showPrintMargin = !!printMarginCheckbox.checked;
        if (aceEditor)
          aceEditor.setShowPrintMargin(!!printMarginCheckbox.checked);
      }
      if (gutterCheckbox) {
        next.showGutter = !!gutterCheckbox.checked;
        if (aceEditor) aceEditor.setOption("showGutter", !!gutterCheckbox.checked);
      }
      if (softTabsCheckbox) {
        next.useSoftTabs = !!softTabsCheckbox.checked;
        if (aceEditor) aceEditor.session.setUseSoftTabs(!!softTabsCheckbox.checked);
      }
      if (foldWidgetsCheckbox) {
        next.showFoldWidgets = !!foldWidgetsCheckbox.checked;
        if (aceEditor) aceEditor.setShowFoldWidgets(!!foldWidgetsCheckbox.checked);
      }
      if (keybindingSelect && keybindingSelect.value) {
        const val = keybindingSelect.value;
        next.keybinding = val;
        if (aceEditor) {
          if (val === "vim") aceEditor.setKeyboardHandler("ace/keyboard/vim");
          else if (val === "emacs") aceEditor.setKeyboardHandler("ace/keyboard/emacs");
          else aceEditor.setKeyboardHandler(null as any);
        }
      }
      saveAceSettings(next);

      if (settingsPanel && settingsToggle && settingsPanel.classList.contains("open")) {
        settingsPanel.classList.remove("open");
        settingsToggle.setAttribute("aria-expanded", "false");
        settingsToggle.focus();
      }

      const prev = aceSaveBtn.textContent;
      const ui = getAceUIStrings(getAppLang());
      aceSaveBtn.textContent = ui.saved;
      setTimeout(() => {
        aceSaveBtn.textContent = ui.save;
      }, 1200);
    });

  // Settings panel toggle and accessibility
  if (settingsToggle && settingsPanel) {
    const isOpen = () => settingsPanel.classList.contains("open");
    const openPanel = () => {
      settingsPanel.classList.add("open");
      settingsToggle.setAttribute("aria-expanded", "true");
      const firstFocusable = settingsPanel.querySelector(
        'input, select, button, [href], [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
      if (firstFocusable) firstFocusable.focus();
    };
    const closePanel = () => {
      settingsPanel.classList.remove("open");
      settingsToggle.setAttribute("aria-expanded", "false");
    };

    settingsToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (settingsPanel.contains(target) || settingsToggle.contains(target))
        return;
      closePanel();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        e.stopPropagation();
        closePanel();
        settingsToggle.focus();
      }
    });
  }

  // Statusbar updates
  function updateStatusBar() {
    if (!aceEditor || !statusBar) return;
    const pos = aceEditor.getCursorPosition();
    const row = pos.row + 1;
    const col = pos.column + 1;
    const total = aceEditor.session.getLength();
    const mode = aceEditor.session.getMode()?.$id?.split("/").pop() || "";
    const { statusLine } = getAceUIStrings(getAppLang());
    statusBar.textContent = statusLine(mode, row, col, total);
  }
  if (statusBar && aceEditor) {
    aceEditor.session.on("change", updateStatusBar);
    aceEditor.selection.on("changeCursor", updateStatusBar);
    updateStatusBar();
  }
}

export function updateAceEditorFromWorkspace(
  ws: Blockly.WorkspaceSvg | null,
  selectedLanguage: SupportedLanguage
) {
  if (!aceEditor || !ws) return;
  try {
    let code = "";
    switch (selectedLanguage) {
      case "python":
        code = pythonGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/python");
        break;
      case "lua":
        code = luaGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/lua");
        break;
      case "javascript":
      default:
        code = javascriptGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/javascript");
        break;
    }
    aceEditor.setValue(code || "", -1);
  } catch (e) {
    // ignore for now
  }
}

export function refreshAceUILanguage() {
  // Ensure the Ace settings save button text is localized to the current language
  const aceSaveBtn = document.getElementById("aceSaveSettings") as HTMLButtonElement | null;
  const ui = getAceUIStrings(getAppLang());
  if (aceSaveBtn) {
    aceSaveBtn.textContent = ui.save;
  }
  // Update statusbar text with the current language
  const statusBar = document.getElementById("editorStatusbar") as HTMLDivElement | null;
  if (aceEditor && statusBar) {
    try {
      const pos = aceEditor.getCursorPosition();
      const row = pos.row + 1;
      const col = pos.column + 1;
      const total = aceEditor.session.getLength();
      const mode = aceEditor.session.getMode()?.$id?.split("/").pop() || "";
      const { statusLine } = getAceUIStrings(getAppLang());
      statusBar.textContent = statusLine(mode, row, col, total);
    } catch {}
  }
}