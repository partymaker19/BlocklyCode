// Русские строковые словари интерфейса.
// Каждый экспорт типизирован как typeof соответствующего объекта из en.ts —
// при несовпадении ключей сборка упадёт с ошибкой типов.
import type {
  aceSettings as AceSettingsEn,
  helpUi as HelpUiEn,
  importUi as ImportUiEn,
  supportUi as SupportUiEn,
  toolbox as ToolboxEn,
  tooltips as TooltipsEn,
} from "./en";

export const toolbox: typeof ToolboxEn = {
  Logic: "Логика",
  Loops: "Циклы",
  Math: "Математика",
  Text: "Текст",
  Lists: "Списки",
  Variables: "Переменные",
  Functions: "Функции",
  Custom: "Кастомные блоки",
  MyBlocks: "Мои блоки",
  ImportBlocks: "Импорт блоков",
  ImportModalTitle: "Импорт пользовательских блоков",
  JsonLabel: "JSON определение блока:",
  ImportInfo:
    'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки".',
  Cancel: "Отмена",
  Import: "Импортировать",
  Search: "Поиск",
};

export const importUi: typeof ImportUiEn = {
  ImportBlocks: "Создать блок",
  ImportModalTitle: "Создание пользовательского блока",
  JsonLabel: "JSON определение блока:",
  GeneratorLabel: "Генератор кода (опционально):",
  ImportInfo:
    'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки". Дополнительно можно указать генератор кода ниже.',
  Cancel: "Отмена",
  Import: "Создать",
  PresetsLabel: "Быстрые пресеты блоков:",
  PresetLet: "let переменная",
  PresetConst: "константа",
  PresetReturn: "return значение",
  PresetNotice: "Выберите пресет, чтобы начать быстрее",
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
  GeneratorValid: "✓ Генератор корректен",
  GeneratorErrorPrefix: "Ошибка:",
  FixJsGenerator:
    "Исправьте ошибки в генераторе JavaScript перед созданием",
  ImportedBlock: "Импортирован блок:",
  ImportErrorPrefix: "Ошибка импорта:",
};

export const tooltips: typeof TooltipsEn = {
  appLang: "Язык приложения",
  appTheme: "Тема приложения",
  genLang: "Язык генерации кода",
  annotate: "Аннотация",
  search: "Поиск (Ctrl+F)",
  replace: "Замена (Ctrl+H)",
  goto: "Перейти к строке (Ctrl+L)",
  format: "Форматировать код",
  copy: "Копировать код",
  download: "Скачать файл",
  shortcuts: "Сочетания клавиш",
  settings: "Настройки",
  settingsPanel: "Настройки редактора",
  keybinding: "Режим клавиш",
  aceTheme: "Ace Theme",
  editorRegion: "Сгенерированный код",
  close: "Закрыть",
  annotTools: "Инструменты аннотаций",
  brush: "Кисть",
  line: "Линия",
  arrow: "Стрелка",
  rect: "Прямоугольник",
  color: "Цвет",
  size: "Толщина",
  undo: "Отменить",
  redo: "Повторить",
  clear: "Очистить",
  run: "Запустить код",
  braces: "Подсветка фигурных скобок",
  debugStep: "Шаг отладки (по одному блоку)",
  debugSlow: "Замедленный запуск с подсветкой блоков",
  debugContinue: "Продолжить без остановок",
  debugStop: "Остановить отладку",
};

export const aceSettings: typeof AceSettingsEn = {
  theme: "Тема",
  themeLight: "Светлая",
  themeMonokai: "Монокаи",
  fontSize: "Шрифт",
  tabSize: "Табуляция",
  wrap: "Перенос строк",
  invisibles: "Непечатаемые",
  activeLine: "Подсветка строки",
  printMargin: "Поле печати",
  gutter: "Нумерация строк",
  softTabs: "Пробелы вместо табов",
  foldWidgets: "Сворачивание кода",
  keybinding: "Клавиши",
  keybindingDefault: "По умолчанию",
};

export const helpUi: typeof HelpUiEn = {
  modalTitle: "Руководство по созданию блоков",
  buttonText: "Справка",
  buttonLabel: "Справка",
  title: "Руководство по созданию блоков",
  closeLabel: "Закрыть",
};

export const supportUi: typeof SupportUiEn = {
  buttonText: "Поддержка",
  buttonLabel: "Поддержка проекта",
  modalTitle: "Поддержка проекта",
  intro1:
    "Если вам понравилось приложение, вы можете поддержать дальнейшую разработку и оплату хостинга.",
  intro2:
    "Спасибо за любую сумму — это помогает развивать функциональность и покрывать расходы.",
  cardLabel: "Номер карты",
  copy: "Копировать",
  copied: "Скопировано",
  close: "Закрыть",
};
