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

// Генератор для блока bitmap_demo (Python)
forBlock['bitmap_demo'] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const bitmapData = String(block.getFieldValue('FIELDNAME') || '');
  const code = `print('Bitmap data: ' + ${JSON.stringify(bitmapData)})\n`;
  return code;
};