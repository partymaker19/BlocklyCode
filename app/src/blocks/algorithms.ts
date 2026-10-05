/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Простые блоки для словаря (хеш-таблицы) — помогут в задачах подсчёта частот.
// Метки берутся из Blockly.Msg (ключи заполняет setAppLang), поэтому блоки
// переведены и в RU, и в EN.

const dictCreate = {
  type: 'dict_create',
  message0: '%{BKY_DICT_CREATE}',
  output: ['Object'],
  colour: 290,
  tooltip: '',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, 'Object');
    this.setTooltip(
      (Blockly as any).Msg.DICT_CREATE_TOOLTIP || 'Create an empty dictionary',
    );
    this.setHelpUrl('');
  }
};

const dictSet = {
  type: 'dict_set',
  message0: '%{BKY_DICT_SET}',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'VALUE', check: ['Number', 'String'] },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 290,
  tooltip: '',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(
      (Blockly as any).Msg.DICT_SET_TOOLTIP || 'Store a value under a key',
    );
    this.setHelpUrl('');
  }
};

const dictGet = {
  type: 'dict_get',
  message0: '%{BKY_DICT_GET}',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
  ],
  output: ['Number', 'String'],
  colour: 290,
  tooltip: '',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, ['Number', 'String']);
    this.setTooltip(
      (Blockly as any).Msg.DICT_GET_TOOLTIP || 'Read the value stored under a key',
    );
    this.setHelpUrl('');
  }
};

const dictHasKey = {
  type: 'dict_has_key',
  message0: '%{BKY_DICT_HAS_KEY}',
  args0: [
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'DICT', check: ['Object'] },
  ],
  output: 'Boolean',
  colour: 290,
  tooltip: '',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, 'Boolean');
    this.setTooltip(
      (Blockly as any).Msg.DICT_HAS_KEY_TOOLTIP || 'Check whether the key exists',
    );
    this.setHelpUrl('');
  }
};

// Экспорт определений без побочных эффектов
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  dictCreate,
  dictSet,
  dictGet,
  dictHasKey,
]);
