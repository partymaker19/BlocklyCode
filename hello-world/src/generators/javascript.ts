/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Order} from 'blockly/javascript';
import * as Blockly from 'blockly/core';

type BlockGenerator = (block: Blockly.Block, generator: Blockly.CodeGenerator) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!

forBlock['add_text'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = `console.log(${text});\n`;
  return code;
};

// Генератор для блока angle_demo
forBlock['angle_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue('ANGLE');
  const angle = angleStr ? Number(angleStr) : 0;
  const addText = generator.provideFunction_(
    'addText',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}(text) {

  // Add text to the output area.
  const outputDiv = document.getElementById('output');
  const textEl = document.createElement('p');
  textEl.innerText = text;
  outputDiv.appendChild(textEl);
}`,
  );
  const code = `console.log('Angle:', String(${angle}));\n`;
  return code;
};

// ===== Словарные блоки (JS) =====
forBlock['dict_create'] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  return ['({})', Order.ATOMIC];
};

forBlock['dict_set'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const dict = generator.valueToCode(block, 'DICT', Order.NONE) || '{}';
  const key = generator.valueToCode(block, 'KEY', Order.NONE) || "''";
  const value = generator.valueToCode(block, 'VALUE', Order.NONE) || 'null';
  const code = `${dict}[${key}] = ${value};\n`;
  return code;
};

forBlock['dict_get'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const dict = generator.valueToCode(block, 'DICT', Order.NONE) || '{}';
  const key = generator.valueToCode(block, 'KEY', Order.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, Order.MEMBER];
};

forBlock['dict_has_key'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const key = generator.valueToCode(block, 'KEY', Order.NONE) || "''";
  const dict = generator.valueToCode(block, 'DICT', Order.NONE) || '{}';
  const code = `Object.prototype.hasOwnProperty.call(${dict}, ${key})`;
  return [code, Order.FUNCTION_CALL];
};

// Переопределение генератора для блока изменения переменной (math_change)
// Это гарантирует, что тело циклов с этим блоком генерирует корректный JS код.
forBlock['math_change'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Имя переменной из поля VAR
  const varName = (generator as any).nameDB_.getName(
    (block as any).getFieldValue('VAR'),
    (Blockly as any).Names?.NameType?.VARIABLE || 'VARIABLE'
  );
  // Значение изменения (DELTA)
  const delta = generator.valueToCode(block, 'DELTA', Order.ADDITION) || '0';
  const code = `${varName} += ${delta};\n`;
  return code;
};

// Генератор для блока-выражения angle_value
forBlock['angle_value'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue('ANGLE');
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), Order.ATOMIC];
};

// Генератор для блока bitmap_demo
forBlock['bitmap_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const bitmapData = String(block.getFieldValue('FIELDNAME') || '');
  const addText = generator.provideFunction_(
    'addText',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}(text) {

  // Add text to the output area.
  const outputDiv = document.getElementById('output');
  const textEl = document.createElement('p');
  textEl.innerText = text;
  outputDiv.appendChild(textEl);
}`,
  );
  const code = `console.log('Bitmap data:', ${JSON.stringify(bitmapData)});\n`;
  return code;
};

// Генератор для блока grid_dropdown_demo (JavaScript)
forBlock['grid_dropdown_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const value = String(block.getFieldValue('FIELDNAME') || '');
  const code = `console.log('Grid selected:', ${JSON.stringify(value)});
`;
  return code;
};

// Генератор для блока py_input (JavaScript)
forBlock['py_input'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Возвращаем выражение input(), определённое в рантайме воркера
  return ['input()', Order.ATOMIC];
};

// Генератор для блока py_input_number (JavaScript)
forBlock['py_input_number'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Преобразуем ввод в число
  return ['Number(input())', Order.ATOMIC];
};
