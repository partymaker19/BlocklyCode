/**
 * Localization utilities for the app (Blockly locale + UI texts + toolbox names)
 */
import * as Blockly from 'blockly';
import * as EnLocale from 'blockly/msg/en';
import * as RuLocale from 'blockly/msg/ru';
import {toolbox as originalToolbox} from './toolbox';
import { getCustomBlocksToolboxCategory } from './customBlocks';

export type AppLang = 'ru' | 'en';
export const APP_LANG_KEY = 'app_language';

export function getAppLang(): AppLang {
  return (localStorage.getItem(APP_LANG_KEY) as AppLang) || 'ru';
}

function updateHeaderText(lang: AppLang) {
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

export function setAppLang(lang: AppLang) {
  Blockly.setLocale(lang === 'ru' ? (RuLocale as any) : (EnLocale as any));
  if (lang === 'ru') {
    (Blockly as any).Msg.ADD_TEXT = 'Добавить текст %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Установить угол %1 градусов';
    (Blockly as any).Msg.ANGLE_VALUE = 'Угол %1 градусов';
    (Blockly as any).Msg.DEGREES = 'градусов';
    (Blockly as any).Msg.BITMAP_DEMO = 'Битмап: %1';
  } else {
    (Blockly as any).Msg.ADD_TEXT = 'Add text %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Set angle to %1 degrees';
    (Blockly as any).Msg.ANGLE_VALUE = 'Angle %1 degrees';
    (Blockly as any).Msg.DEGREES = 'degrees';
    (Blockly as any).Msg.BITMAP_DEMO = 'Bitmap: %1';
  }
  localStorage.setItem(APP_LANG_KEY, lang);
  updateHeaderText(lang);
}

export function localizedToolbox(lang: AppLang) {
  const t = {
    en: { Logic: 'Logic', Loops: 'Loops', Math: 'Math', Text: 'Text', Lists: 'Lists', Variables: 'Variables', Functions: 'Functions', Custom: 'Custom blocks', MyBlocks: 'My Blocks', ImportBlocks: 'Import blocks', ImportModalTitle: 'Import custom blocks', JsonLabel: 'Block definition (JSON):', ImportInfo: 'Paste the block JSON definition below. The block will be added to "My Blocks" category.', Cancel: 'Cancel', Import: 'Import' },
    ru: { Logic: 'Логика', Loops: 'Циклы', Math: 'Математика', Text: 'Текст', Lists: 'Списки', Variables: 'Переменные', Functions: 'Функции', Custom: 'Кастомные блоки', MyBlocks: 'Мои блоки', ImportBlocks: 'Импорт блоков', ImportModalTitle: 'Импорт пользовательских блоков', JsonLabel: 'JSON определение блока:', ImportInfo: 'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки".', Cancel: 'Отмена', Import: 'Импортировать' },
  }[lang as AppLang];
  const tb = JSON.parse(JSON.stringify(originalToolbox));
  for (const cat of tb.contents) {
    if (cat.kind === 'category' && t[cat.name as keyof typeof t]) {
      cat.name = t[cat.name as keyof typeof t];
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

export function localizeImportUI(lang: AppLang) {
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
      GeneratorValid: '✓ Generator is valid'
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
      GeneratorValid: '✓ Генератор корректен'
    },
  }[lang as AppLang];

  const importBtnText = document.getElementById('importBtnText');
  const modalTitle = document.getElementById('modalTitle');
  const jsonLabel = document.getElementById('jsonLabel');
  const generatorLabel = document.getElementById('generatorLabel');
  const importInfo = document.getElementById('importInfo');
  const presetsLabelEl = document.getElementById('presetsLabel');
  const presetLetBtn = document.getElementById('presetLet') as HTMLButtonElement | null;
  const presetConstBtn = document.getElementById('presetConst') as HTMLButtonElement | null;
  const blockJsonTextarea = document.getElementById('blockJson') as HTMLTextAreaElement | null;

  if (importBtnText) importBtnText.textContent = t.ImportBlocks;
  if (modalTitle) modalTitle.textContent = t.ImportModalTitle;
  if (jsonLabel) jsonLabel.textContent = t.JsonLabel;
  if (generatorLabel) generatorLabel.textContent = t.GeneratorLabel;
  if (importInfo) importInfo.textContent = t.ImportInfo;
  if (blockJsonTextarea) blockJsonTextarea.placeholder = t.JsonPlaceholder;
  
  const cancelBtn = document.getElementById('cancelImport');
  const confirmBtn = document.getElementById('confirmImport');
  if (cancelBtn) (cancelBtn as HTMLButtonElement).textContent = t.Cancel;
  if (confirmBtn) (confirmBtn as HTMLButtonElement).textContent = t.Import;
  if (presetsLabelEl) presetsLabelEl.textContent = t.PresetsLabel;
  if (presetLetBtn) presetLetBtn.textContent = t.PresetLet;
  if (presetConstBtn) presetConstBtn.textContent = t.PresetConst;

  // Store localized strings for use in other functions
  (window as any)._currentLocalizedStrings = t;
}