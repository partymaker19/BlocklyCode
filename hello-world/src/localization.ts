/**
 * Localization utilities for the app (Blockly locale + UI texts + toolbox names)
 */
import * as Blockly from 'blockly';
import * as BlocklyCore from 'blockly/core';
import * as EnLocale from 'blockly/msg/en';
import * as RuLocale from 'blockly/msg/ru';
import {toolbox as originalToolbox} from './toolbox';
import { getCustomBlocksToolboxCategory } from './customBlocks';

export type AppLang = 'ru' | 'en';
export const APP_LANG_KEY = 'app_language';

let currentAppLang: AppLang = 'ru';

export function getAppLang(): AppLang {
  return currentAppLang;
}

function updateHeaderText(lang: AppLang): void {
  const subtitle = document.querySelector('.header-subtitle');
  const ruLabel = document.getElementById('lang-ru');
  const enLabel = document.getElementById('lang-en');
  if (subtitle) {
    (subtitle as HTMLElement).textContent = lang === 'ru'
      ? 'Создавайте программы с помощью блоков'
      : 'Create programs using blocks';
  }
  if (ruLabel && enLabel) {
    ruLabel.className = lang === 'ru' ? 'lang-label active' : 'lang-label';
    enLabel.className = lang === 'en' ? 'lang-label active' : 'lang-label';
  }
}

export function setAppLang(lang: AppLang): void {
  currentAppLang = lang;
  Blockly.setLocale(lang === 'ru' ? (RuLocale as any) : (EnLocale as any));
  if (lang === 'ru') {
    (Blockly as any).Msg.ADD_TEXT = 'Добавить текст %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Установить угол %1 градусов';
    (Blockly as any).Msg.ANGLE_VALUE = 'Угол %1 градусов';
    (Blockly as any).Msg.DEGREES = 'градусов';
    (Blockly as any).Msg.BITMAP_DEMO = 'Битмап: %1';
    (Blockly as any).Msg.PY_INPUT = 'Ввод текста';
    (Blockly as any).Msg.PY_INPUT_NUMBER = 'Ввод числа';
    // Search plugin localization
    (Blockly as any).Msg.SEARCH_PLACEHOLDER = 'Поиск блоков';
    (Blockly as any).Msg.SEARCH_TYPE_TO_SEARCH = 'Введите текст для поиска блоков';
    (Blockly as any).Msg.SEARCH_NO_MATCHING = 'Блоки не найдены';
  } else {
    (Blockly as any).Msg.ADD_TEXT = 'Add text %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Set angle to %1 degrees';
    (Blockly as any).Msg.ANGLE_VALUE = 'Angle %1 degrees';
    (Blockly as any).Msg.DEGREES = 'degrees';
    (Blockly as any).Msg.BITMAP_DEMO = 'Bitmap: %1';
    (Blockly as any).Msg.PY_INPUT = 'Text input';
    (Blockly as any).Msg.PY_INPUT_NUMBER = 'Number input';
    // Search plugin localization
    (Blockly as any).Msg.SEARCH_PLACEHOLDER = 'Search blocks';
    (Blockly as any).Msg.SEARCH_TYPE_TO_SEARCH = 'Type to search for blocks';
    (Blockly as any).Msg.SEARCH_NO_MATCHING = 'No matching blocks found';
  }
  updateHeaderText(lang);
}

export function localizedToolbox(lang: AppLang): BlocklyCore.utils.toolbox.ToolboxInfo {
  const t = {
    en: { Logic: 'Logic', Loops: 'Loops', Math: 'Math', Text: 'Text', Lists: 'Lists', Variables: 'Variables', Functions: 'Functions', Custom: 'Custom blocks', MyBlocks: 'My Blocks', ImportBlocks: 'Import blocks', ImportModalTitle: 'Import custom blocks', JsonLabel: 'Block definition (JSON):', ImportInfo: 'Paste the block JSON definition below. The block will be added to "My Blocks" category.', Cancel: 'Cancel', Import: 'Import', Search: 'Search' },
    ru: { Logic: 'Логика', Loops: 'Циклы', Math: 'Математика', Text: 'Текст', Lists: 'Списки', Variables: 'Переменные', Functions: 'Функции', Custom: 'Кастомные блоки', MyBlocks: 'Мои блоки', ImportBlocks: 'Импорт блоков', ImportModalTitle: 'Импорт пользовательских блоков', JsonLabel: 'JSON определение блока:', ImportInfo: 'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки".', Cancel: 'Отмена', Import: 'Импортировать', Search: 'Поиск' },
  }[lang as AppLang];
  const tb = JSON.parse(JSON.stringify(originalToolbox)) as BlocklyCore.utils.toolbox.ToolboxInfo;
  for (const item of tb.contents) {
    if (item.kind === 'category') {
      const cat = item as BlocklyCore.utils.toolbox.StaticCategoryInfo;
      if (t[cat.name as keyof typeof t]) {
        cat.name = t[cat.name as keyof typeof t];
      }
    }
    // Localize the search category name (custom toolbox item)
    if ((item as any).kind === 'search') {
      (item as any).name = t.Search;
    }
  }
  const customCat = getCustomBlocksToolboxCategory();
  if (customCat) {
    customCat.name = t.MyBlocks;
    tb.contents.push({ kind: 'sep' });
    tb.contents.push(customCat);
  }
  return tb;
}

export function localizeImportUI(lang: AppLang): void {
  const t = {
    en: { 
      ImportBlocks: 'Create block', 
      ImportModalTitle: 'Create custom block', 
      JsonLabel: 'Block definition (JSON):', 
      GeneratorLabel: 'Code generator (optional):', 
      ImportInfo: 'Paste the block JSON definition below. The block will be added to "My Blocks" category. You may also provide a custom code generator below.', 
      Cancel: 'Cancel', 
      Import: 'Create', 
      PresetsLabel: 'Quick block presets:', 
      PresetLet: 'let variable', 
      PresetConst: 'constant',
      PresetReturn: 'return value',
      PresetNotice: 'Choose a preset to start faster',
      JsonPlaceholder: `Example:
{
  "type": "my_custom_block",
  "message0": "My block %1",
  "args0": [
    {
      "type": "input_value",
      "name": "INPUT"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "My custom block",
  "helpUrl": ""
}`,
      GeneratorValid: '✓ Generator is valid',
      GeneratorErrorPrefix: 'Error:',
      FixJsGenerator: 'Please fix errors in the JavaScript generator before creating',
      ImportedBlock: 'Imported block:',
      ImportErrorPrefix: 'Import error:'
    },
    ru: { 
      ImportBlocks: 'Создать блок', 
      ImportModalTitle: 'Создание пользовательского блока', 
      JsonLabel: 'JSON определение блока:', 
      GeneratorLabel: 'Генератор кода (опционально):', 
      ImportInfo: 'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки". Дополнительно можно указать генератор кода ниже.', 
      Cancel: 'Отмена', 
      Import: 'Создать', 
      PresetsLabel: 'Быстрые пресеты блоков:', 
      PresetLet: 'let переменная', 
      PresetConst: 'константа',
      PresetReturn: 'return значение',
      PresetNotice: 'Выберите пресет, чтобы начать быстрее',
      JsonPlaceholder: `Пример:
{
  "type": "my_custom_block",
  "message0": "Мой блок %1",
  "args0": [
    {
      "type": "input_value",
      "name": "INPUT"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "Мой кастомный блок",
  "helpUrl": ""
}`,
      GeneratorValid: '✓ Генератор корректен',
      GeneratorErrorPrefix: 'Ошибка:',
      FixJsGenerator: 'Исправьте ошибки в генераторе JavaScript перед созданием',
      ImportedBlock: 'Импортирован блок:',
      ImportErrorPrefix: 'Ошибка импорта:'
    },
  }[lang as AppLang];

  const importBtnText = document.getElementById('importBtnText');
  const modalTitle = document.getElementById('modalTitle');
  const jsonLabel = document.getElementById('jsonLabel');
  const generatorLabel = document.getElementById('generatorLabel');
  const importInfo = document.getElementById('importInfo');
  const presetsLabelEl = document.getElementById('presetsLabel');
  const presetNoticeEl = document.getElementById('presetNotice');
  const presetLetBtn = document.getElementById('presetLet') as HTMLButtonElement | null;
  const presetConstBtn = document.getElementById('presetConst') as HTMLButtonElement | null;
  const presetReturnBtn = document.getElementById('presetReturn') as HTMLButtonElement | null;
  const blockJsonTextarea = document.getElementById('blockJson') as HTMLTextAreaElement | null;

  if (importBtnText) importBtnText.textContent = t.ImportBlocks;
  if (modalTitle) modalTitle.textContent = t.ImportModalTitle;
  if (jsonLabel) jsonLabel.textContent = t.JsonLabel;
  if (generatorLabel) generatorLabel.textContent = t.GeneratorLabel;
  if (importInfo) importInfo.textContent = t.ImportInfo;
  if (blockJsonTextarea) blockJsonTextarea.placeholder = t.JsonPlaceholder;
  if (presetsLabelEl) presetsLabelEl.textContent = t.PresetsLabel;
  if (presetNoticeEl) presetNoticeEl.textContent = t.PresetNotice;
  if (presetLetBtn) presetLetBtn.textContent = t.PresetLet;
  if (presetConstBtn) presetConstBtn.textContent = t.PresetConst;
  if (presetReturnBtn) presetReturnBtn.textContent = t.PresetReturn;

  const cancelBtn = document.getElementById('cancelImport');
  const confirmBtn = document.getElementById('confirmImport');
  if (cancelBtn) (cancelBtn as HTMLButtonElement).textContent = t.Cancel;
  if (confirmBtn) (confirmBtn as HTMLButtonElement).textContent = t.Import;

  // Store localized strings for use in other functions
  (window as any)._currentLocalizedStrings = t as any;
  // Extend with task-related strings
  const taskStrings = lang === 'ru' ? {
    TaskPerfect: 'Отлично! Решение оптимально.',
    TaskPassed: 'Решение верное.',
    NextTask: 'Следующая задача',
    PrevTask: 'Предыдущая задача',
    TaskSolutions: 'Решение задач',
    CheckSolution: 'Проверить решение',
    StarsCriteria: 'Критерии звёзд:',
    StarsOptimal: 'оптимально (минимум блоков)',
    StarsGood: 'хорошо',
    StarsCorrect: 'решение верное',
    RunFirst: 'Сначала запустите код',
  } : {
    TaskPerfect: 'Great! Optimal solution.',
    TaskPassed: 'Solution is correct.',
    NextTask: 'Next task',
    PrevTask: 'Previous task',
    TaskSolutions: 'Task Solutions',
    CheckSolution: 'Check solution',
    StarsCriteria: 'Stars criteria:',
    StarsOptimal: 'optimal (minimum blocks)',
    StarsGood: 'good',
    StarsCorrect: 'solution correct',
    RunFirst: 'Run the code first',
  };
  (window as any)._currentLocalizedStrings = { ...(window as any)._currentLocalizedStrings, ...taskStrings };
}

// Added: localize tooltips and aria-labels across the app
export function localizeTooltips(lang: AppLang): void {
  const setAttrs = (
    el: Element | null,
    attrs: Record<string, string | undefined>
  ) => {
    if (!el) return;
    Object.entries(attrs).forEach(([k, v]) => {
      if (typeof v === 'string') el.setAttribute(k, v);
    });
  };

  const t = {
    en: {
      appLang: 'Application language',
      appTheme: 'Application theme',
      genLang: 'Code generation language',
      annotate: 'Annotation',
      search: 'Search (Ctrl+F)',
      replace: 'Replace (Ctrl+H)',
      goto: 'Go to line (Ctrl+L)',
      format: 'Format code',
      copy: 'Copy code',
      download: 'Download file',
      shortcuts: 'Keyboard shortcuts',
      settings: 'Settings',
      settingsPanel: 'Editor settings',
      keybinding: 'Keybinding mode',
      aceTheme: 'Ace Theme',
      editorRegion: 'Generated code',
      close: 'Close',
      annotTools: 'Annotation tools',
      brush: 'Brush',
      line: 'Line',
      arrow: 'Arrow',
      rect: 'Rectangle',
      color: 'Color',
      size: 'Thickness',
      undo: 'Undo',
      redo: 'Redo',
      clear: 'Clear',
      run: 'Run code',
      braces: 'Highlight curly braces',
    },
    ru: {
      appLang: 'Язык приложения',
      appTheme: 'Тема приложения',
      genLang: 'Язык генерации кода',
      annotate: 'Аннотация',
      search: 'Поиск (Ctrl+F)',
      replace: 'Замена (Ctrl+H)',
      goto: 'Перейти к строке (Ctrl+L)',
      format: 'Форматировать код',
      copy: 'Копировать код',
      download: 'Скачать файл',
      shortcuts: 'Сочетания клавиш',
      settings: 'Настройки',
      settingsPanel: 'Настройки редактора',
      keybinding: 'Режим клавиш',
      aceTheme: 'Ace Theme',
      editorRegion: 'Сгенерированный код',
      close: 'Закрыть',
      annotTools: 'Инструменты аннотаций',
      brush: 'Кисть',
      line: 'Линия',
      arrow: 'Стрелка',
      rect: 'Прямоугольник',
      color: 'Цвет',
      size: 'Толщина',
      undo: 'Отменить',
      redo: 'Повторить',
      clear: 'Очистить',
      run: 'Запустить код',
      braces: 'Подсветка фигурных скобок',
    },
  }[lang];

  // Header tooltips
  setAttrs(document.querySelector('.language-switch'), { title: t.appLang });
  setAttrs(document.querySelector('.theme-switch'), { title: t.appTheme });
  setAttrs(document.querySelector('.gen-lang-dropdown'), { title: t.genLang });

  // Ace toolbar buttons
  const byId = (id: string) => document.getElementById(id);
  const setBtn = (id: string, text: string) => {
    const el = byId(id);
    setAttrs(el, { title: text, 'aria-label': text });
  };

  setBtn('aceSearchBtn', t.search);
  setBtn('aceReplaceBtn', t.replace);
  setBtn('aceGotoBtn', t.goto);
  setBtn('aceFormatBtn', t.format);
  setBtn('aceBracesBtn', t.braces);
  setBtn('copyCodeBtn', t.copy);
  setBtn('downloadCodeBtn', t.download);
  setBtn('aceShortcutsBtn', t.shortcuts);
  setBtn('aceSettingsToggle', t.settings);
  setBtn('aceRunBtn', t.run);
  // Header Save/Load XML buttons
  setBtn('saveXmlBtn', lang === 'ru' ? 'Сохранить (XML)' : 'Save (XML)');
  setBtn('loadXmlBtn', lang === 'ru' ? 'Загрузить (XML)' : 'Load (XML)');

  setAttrs(byId('aceSettingsPanel'), { 'aria-label': t.settingsPanel });
  setAttrs(byId('aceKeybinding'), { 'aria-label': t.keybinding });
  setAttrs(byId('aceThemeSelect'), { 'aria-label': t.aceTheme });
  setAttrs(byId('editor'), { 'aria-label': t.editorRegion });
  setAttrs(byId('closeModal'), { 'aria-label': t.close });

  // Annotation toolbar
  setAttrs(byId('annotToolbar'), { 'aria-label': t.annotTools });
  setAttrs(byId('annotateToggleBtn'), { title: t.annotate });
  setAttrs(byId('annotBrush'), { title: t.brush });
  setAttrs(byId('annotLine'), { title: t.line });
  setAttrs(byId('annotArrow'), { title: t.arrow });
  setAttrs(byId('annotRect'), { title: t.rect });
  setAttrs(byId('annotColor'), { title: t.color });
  setAttrs(byId('annotSize'), { title: t.size });
  setAttrs(byId('annotUndo'), { title: t.undo });
  setAttrs(byId('annotRedo'), { title: t.redo });
  setAttrs(byId('annotClear'), { title: t.clear });
}

// Added: localize labels and options inside Ace Settings panel
export function localizeAceSettingsPanel(lang: AppLang): void {
  const t = {
    en: {
      theme: 'Theme',
      themeLight: 'Light',
      themeMonokai: 'Monokai',
      fontSize: 'Font size',
      tabSize: 'Tab size',
      wrap: 'Word wrap',
      invisibles: 'Invisible characters',
      activeLine: 'Highlight active line',
      printMargin: 'Print margin',
      gutter: 'Line numbers',
      softTabs: 'Soft tabs',
      foldWidgets: 'Code folding',
      keybinding: 'Keybinding',
      keybindingDefault: 'Default',
    },
    ru: {
      theme: 'Тема',
      themeLight: 'Светлая',
      themeMonokai: 'Монокаи',
      fontSize: 'Шрифт',
      tabSize: 'Табуляция',
      wrap: 'Перенос строк',
      invisibles: 'Непечатаемые',
      activeLine: 'Подсветка строки',
      printMargin: 'Поле печати',
      gutter: 'Нумерация строк',
      softTabs: 'Пробелы вместо табов',
      foldWidgets: 'Сворачивание кода',
      keybinding: 'Клавиши',
      keybindingDefault: 'По умолчанию',
    },
  }[lang];

  const setText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('aceThemeLabel', t.theme);
  setText('aceFontSizeLabel', t.fontSize);
  setText('aceTabSizeLabel', t.tabSize);
  setText('aceWrapLabel', t.wrap);
  setText('aceInvisiblesLabel', t.invisibles);
  setText('aceActiveLineLabel', t.activeLine);
  setText('acePrintMarginLabel', t.printMargin);
  setText('aceGutterLabel', t.gutter);
  setText('aceSoftTabsLabel', t.softTabs);
  setText('aceFoldWidgetsLabel', t.foldWidgets);
  setText('aceKeybindingLabel', t.keybinding);

  // Update keybinding "default" option text
  const kb = document.getElementById('aceKeybinding') as HTMLSelectElement | null;
  if (kb) {
    const opt = Array.from(kb.options).find(o => o.value === 'default');
    if (opt) opt.textContent = t.keybindingDefault;
  }

  // Update theme select option names for Light and Monokai
  const themeSel = document.getElementById('aceThemeSelect') as HTMLSelectElement | null;
  if (themeSel) {
    const light = Array.from(themeSel.options).find(o => o.value === 'ace/theme/chrome');
    if (light) light.textContent = t.themeLight;
    const monokai = Array.from(themeSel.options).find(o => o.value === 'ace/theme/monokai');
    if (monokai) monokai.textContent = t.themeMonokai;
  }
}

// Added: strings for Ace runtime UI (statusbar, toasts)
export type AceUIStrings = {
  copySuccess: string;
  save: string;
  saved: string;
  statusLine: (mode: string, row: number, col: number, total: number) => string;
};

export function getAceUIStrings(lang: AppLang): AceUIStrings {
  if (lang === 'en') {
    return {
      copySuccess: 'Copied',
      save: 'Save',
      saved: 'Saved',
      statusLine: (mode: string, row: number, col: number, total: number) =>
        `${mode}  |  Line ${row}, Column ${col}  |  Total: ${total}`,
    };
  }
  return {
    copySuccess: 'Скопировано',
    save: 'Сохранить',
    saved: 'Сохранено',
    statusLine: (mode: string, row: number, col: number, total: number) =>
      `${mode}  |  Строка ${row}, Столбец ${col}  |  Всего: ${total}`,
  };
}

// Localize Help UI: button text/labels and modal title
export function localizeHelpUI(lang: AppLang): void {
  const t = {
    en: {
      modalTitle: 'Guide to Creating Custom Blocks',
      buttonText: 'Help',
      buttonLabel: 'Help',
      title: 'Guide to Creating Custom Blocks',
      closeLabel: 'Close',
    },
    ru: {
      modalTitle: 'Руководство по созданию блоков',
      buttonText: 'Справка',
      buttonLabel: 'Справка',
      title: 'Руководство по созданию блоков',
      closeLabel: 'Закрыть',
    },
  }[lang];

  const helpBtn = document.getElementById('blockHelpBtn');
  const helpBtnText = document.getElementById('blockHelpBtnText');
  const modalTitleEl = document.querySelector('#helpModal .modal-header h2');
  const closeBtn = document.getElementById('closeHelpModal');

  if (helpBtn) {
    helpBtn.setAttribute('title', t.title);
    helpBtn.setAttribute('aria-label', t.buttonLabel);
  }
  if (helpBtnText) {
    (helpBtnText as HTMLElement).textContent = t.buttonText;
  }
  if (modalTitleEl) {
    (modalTitleEl as HTMLElement).textContent = t.modalTitle;
  }
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', t.closeLabel);
  }
}

export function localizeSupportUI(lang: AppLang): void {
  const t = {
    en: {
      buttonText: 'Support',
      buttonLabel: 'Support the project',
      modalTitle: 'Support the project',
      intro1: 'If you enjoy the app, you can support ongoing development and hosting costs.',
      intro2: 'Any amount helps improve features and cover costs.',
      cardLabel: 'Card number',
      copy: 'Copy',
      copied: 'Copied',
      close: 'Close',
    },
    ru: {
      buttonText: 'Поддержка',
      buttonLabel: 'Поддержка проекта',
      modalTitle: 'Поддержка проекта',
      intro1: 'Если вам понравилось приложение, вы можете поддержать дальнейшую разработку и оплату хостинга.',
      intro2: 'Спасибо за любую сумму — это помогает развивать функциональность и покрывать расходы.',
      cardLabel: 'Номер карты',
      copy: 'Копировать',
      copied: 'Скопировано',
      close: 'Закрыть',
    },
  }[lang];

  const btn = document.getElementById('supportBtn');
  const btnText = document.getElementById('supportBtnText');
  const titleEl = document.getElementById('supportModalTitle');
  const intro1El = document.getElementById('supportIntro1');
  const intro2El = document.getElementById('supportIntro2');
  const cardLabelEl = document.getElementById('supportCardLabel');
  const copyBtn = document.getElementById('copyCardBtn');
  const copiedEl = document.getElementById('copyCardStatus');
  const closeBtn = document.getElementById('closeSupportBtn');
  const closeIcon = document.getElementById('closeSupportModal');

  if (btn) {
    btn.setAttribute('title', t.buttonLabel);
    btn.setAttribute('aria-label', t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `💙 ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (intro1El) (intro1El as HTMLElement).textContent = t.intro1;
  if (intro2El) (intro2El as HTMLElement).textContent = t.intro2;
  if (cardLabelEl) (cardLabelEl as HTMLElement).textContent = t.cardLabel;
  if (copyBtn) (copyBtn as HTMLElement).textContent = t.copy;
  if (copiedEl) (copiedEl as HTMLElement).textContent = t.copied;
  if (closeBtn) (closeBtn as HTMLElement).textContent = t.close;
  if (closeIcon) closeIcon.setAttribute('aria-label', t.close);
}