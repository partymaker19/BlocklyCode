/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Create a custom block called 'add_text' that adds
// text to the output div on the sample app.
// This is just an example and you should replace this with your
// own custom blocks.
const addText = {
  type: 'add_text',
  // Используем Blockly.Msg для локализации, или fallback
  message0: 'Add text %1',
  args0: [
    {
      type: 'input_value',
      name: 'TEXT',
      check: 'String',
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 160,
  tooltip: '',
  helpUrl: '',
  
  // Инициализация блока - здесь мы можем динамически менять текст
  init: function(this: Blockly.Block) {
    this.setColour(160);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Add text to the output area');
    this.setHelpUrl('');
    
    // Динамически применяем локализацию текста
    const message = ((Blockly as any).Msg && (Blockly as any).Msg.ADD_TEXT) || 'Add text %1';
    this.appendValueInput('TEXT')
      .setCheck('String')
      .appendField(message.replace('%1', ''));
  }
};

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  addText,
]);
