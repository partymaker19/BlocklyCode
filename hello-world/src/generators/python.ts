/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Order as PythonOrder} from 'blockly/python';
import * as Blockly from 'blockly/core';

type BlockGenerator = (block: Blockly.Block, generator: Blockly.CodeGenerator) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Export all the code generators for our custom blocks for Python,
// but don't register them with Blockly yet.
// This file has no side effects!

forBlock['add_text'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const text = generator.valueToCode(block, 'TEXT', PythonOrder.NONE) || "''";
  const code = `print(${text})\n`;
  return code;
};

// Генератор для блока angle_demo (Python)
forBlock['angle_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue('ANGLE');
  const angle = angleStr ? Number(angleStr) : 0;
  const code = `print('Angle: ' + str(${angle}))\n`;
  return code;
};

// Генератор для блока-выражения angle_value (Python)
forBlock['angle_value'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue('ANGLE');
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), PythonOrder.ATOMIC];
};

// ===== Словарные блоки (Python) =====
forBlock['dict_create'] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  return ['{}', PythonOrder.ATOMIC];
};

forBlock['dict_set'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const dict = generator.valueToCode(block, 'DICT', PythonOrder.NONE) || '{}';
  const key = generator.valueToCode(block, 'KEY', PythonOrder.NONE) || "''";
  const value = generator.valueToCode(block, 'VALUE', PythonOrder.NONE) || 'None';
  const code = `${dict}[${key}] = ${value}\n`;
  return code;
};

forBlock['dict_get'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const dict = generator.valueToCode(block, 'DICT', PythonOrder.NONE) || '{}';
  const key = generator.valueToCode(block, 'KEY', PythonOrder.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, PythonOrder.ATOMIC];
};

forBlock['dict_has_key'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const key = generator.valueToCode(block, 'KEY', PythonOrder.NONE) || "''";
  const dict = generator.valueToCode(block, 'DICT', PythonOrder.NONE) || '{}';
  const code = `${key} in ${dict}`;
  return [code, PythonOrder.RELATIONAL];
};

// Генератор для блока bitmap_demo (Python)
forBlock['bitmap_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const bitmapData = String(block.getFieldValue('FIELDNAME') || '');
  const code = `print('Bitmap data: ' + ${JSON.stringify(bitmapData)})\n`;
  return code;
};

// Генератор для блока grid_dropdown_demo (Python)
forBlock['grid_dropdown_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const value = String(block.getFieldValue('FIELDNAME') || '');
  const label = (Blockly as any).Msg?.GRID_SELECTED || 'Grid selected:';
  const code = `print(${JSON.stringify(label + ' ')} + ${JSON.stringify(value)})\n`;
  return code;
};

// Генератор для блока py_input (Python)
forBlock['py_input'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Поле подсказки удалено, возвращаем просто input()
  // Значение может использоваться как строка или число.
  // Для числовых контекстов пользователь может конвертировать значение самостоятельно,
  // либо использовать его напрямую как строку.
  return ['input()', PythonOrder.ATOMIC];
};

// Генератор для блока py_input_number (Python)
forBlock['py_input_number'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Преобразуем ввод в число (float для универсальности)
  return ['float(input())', PythonOrder.ATOMIC];
};