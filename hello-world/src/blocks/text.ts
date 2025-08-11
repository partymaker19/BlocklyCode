/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {FieldAngle} from '@blockly/field-angle';
import '@blockly/field-bitmap';

// Create a custom block called 'add_text' that adds
// text to the output div on the sample app.
// This is just an example and you should replace this with your
// own custom blocks.
const addText = {
  type: 'add_text',
  // Используем ключ локализации
  message0: '%{BKY_ADD_TEXT}',
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
    
    // Оставляем логику без дополнительных надписей, JSON уже задает поля
  }
};

// Блок для демонстрации поля угла
const angleDemo = {
  type: 'angle_demo',
  message0: '%{BKY_ANGLE_DEMO}',
  args0: [
    {
      type: 'field_angle',
      name: 'ANGLE',
      angle: 90,
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 20,
  tooltip: 'Demonstrates angle field usage',
  helpUrl: '',
  
  init: function(this: Blockly.Block) {
    this.setColour(20);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Demonstrates angle field usage');
    this.setHelpUrl('');
    // JSON уже формирует содержимое блока через message0/args0
  }
};

// Блок-выражение: угол как число градусов
const angleValue = {
  type: 'angle_value',
  message0: '%{BKY_ANGLE_VALUE}',
  args0: [
    {
      type: 'field_angle',
      name: 'ANGLE',
      angle: 90,
    },
  ],
  output: 'Number',
  colour: 20,
  tooltip: 'Angle value in degrees',
  helpUrl: '',

  init: function(this: Blockly.Block) {
    this.setColour(20);
    this.setOutput(true, 'Number');
    this.setTooltip('Angle value in degrees');
    this.setHelpUrl('');
    // JSON уже формирует содержимое блока через message0/args0
  }
};

// Блок с плагином field_bitmap
const bitmapDemo = {
  type: 'bitmap_demo',
  message0: '%{BKY_BITMAP_DEMO}',
  args0: [
    {
      type: 'field_bitmap',
      name: 'FIELDNAME',
      width: 8,
      height: 8,
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 260,
  tooltip: 'Bitmap editor field',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(260);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Bitmap editor field');
  }
};

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  addText,
  angleDemo,
  angleValue,
  bitmapDemo,
]);
