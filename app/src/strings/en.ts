// Английские строковые словари интерфейса.
// Каждое имя экспорта соответствует функции локализации в localization.ts.
// Ключи должны совпадать с keys в ru.ts — это проверяется на уровне типов
// (в ru.ts экспорты типизированы как typeof соответствующих объектов отсюда).

export const toolbox = {
  Logic: "Logic",
  Loops: "Loops",
  Math: "Math",
  Text: "Text",
  Lists: "Lists",
  Variables: "Variables",
  Functions: "Functions",
  Custom: "Custom blocks",
  MyBlocks: "My Blocks",
  ImportBlocks: "Import blocks",
  ImportModalTitle: "Import custom blocks",
  JsonLabel: "Block definition (JSON):",
  ImportInfo:
    'Paste the block JSON definition below. The block will be added to "My Blocks" category.',
  Cancel: "Cancel",
  Import: "Import",
  Search: "Search",
};

export const importUi = {
  ImportBlocks: "Create block",
  ImportModalTitle: "Create custom block",
  JsonLabel: "Block definition (JSON):",
  GeneratorLabel: "Code generator (optional):",
  ImportInfo:
    'Paste the block JSON definition below. The block will be added to "My Blocks" category. You may also provide a custom code generator below.',
  Cancel: "Cancel",
  Import: "Create",
  PresetsLabel: "Quick block presets:",
  PresetLet: "let variable",
  PresetConst: "constant",
  PresetReturn: "return value",
  PresetNotice: "Choose a preset to start faster",
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
  GeneratorValid: "✓ Generator is valid",
  GeneratorErrorPrefix: "Error:",
  FixJsGenerator:
    "Please fix errors in the JavaScript generator before creating",
  ImportedBlock: "Imported block:",
  ImportErrorPrefix: "Import error:",
};

export const tooltips = {
  appLang: "Application language",
  appTheme: "Application theme",
  genLang: "Code generation language",
  annotate: "Annotation",
  search: "Search (Ctrl+F)",
  replace: "Replace (Ctrl+H)",
  goto: "Go to line (Ctrl+L)",
  format: "Format code",
  copy: "Copy code",
  download: "Download file",
  shortcuts: "Keyboard shortcuts",
  settings: "Settings",
  settingsPanel: "Editor settings",
  keybinding: "Keybinding mode",
  aceTheme: "Ace Theme",
  editorRegion: "Generated code",
  close: "Close",
  annotTools: "Annotation tools",
  brush: "Brush",
  line: "Line",
  arrow: "Arrow",
  rect: "Rectangle",
  color: "Color",
  size: "Thickness",
  undo: "Undo",
  redo: "Redo",
  clear: "Clear",
  run: "Run code",
  braces: "Highlight curly braces",
};

export const aceSettings = {
  theme: "Theme",
  themeLight: "Light",
  themeMonokai: "Monokai",
  fontSize: "Font size",
  tabSize: "Tab size",
  wrap: "Word wrap",
  invisibles: "Invisible characters",
  activeLine: "Highlight active line",
  printMargin: "Print margin",
  gutter: "Line numbers",
  softTabs: "Soft tabs",
  foldWidgets: "Code folding",
  keybinding: "Keybinding",
  keybindingDefault: "Default",
};

export const helpUi = {
  modalTitle: "Guide to Creating Custom Blocks",
  buttonText: "Help",
  buttonLabel: "Help",
  title: "Guide to Creating Custom Blocks",
  closeLabel: "Close",
};

export const supportUi = {
  buttonText: "Support",
  buttonLabel: "Support the project",
  modalTitle: "Support the project",
  intro1:
    "If you enjoy the app, you can support ongoing development and hosting costs.",
  intro2: "Any amount helps improve features and cover costs.",
  cardLabel: "Card number",
  copy: "Copy",
  copied: "Copied",
  close: "Close",
};
