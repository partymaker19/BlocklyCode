/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order as LuaOrder } from "blockly/lua";
import * as Blockly from "blockly/core";

type BlockGenerator = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Export all the code generators for our custom blocks for Lua,
// but don't register them with Blockly yet.
// This file has no side effects!

forBlock["add_text"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const text = generator.valueToCode(block, "TEXT", LuaOrder.NONE) || "''";
  const color = generator.valueToCode(block, "COLOR", LuaOrder.NONE) || "";
  if (color && (color as string).trim && (color as string).trim().length > 0) {
    return `print_colored(${text}, ${color})\n`;
  }
  return `print(${text})\n`;
};

// Генератор для блока angle_demo (Lua)
forBlock["angle_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  const code = `print('Angle: ' .. tostring(${angle}))\n`;
  return code;
};

// Генератор для блока-выражения angle_value (Lua)
forBlock["angle_value"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), LuaOrder.ATOMIC];
};

// Генератор для блока bitmap_demo (Lua)
forBlock["bitmap_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const bitmapData = String(block.getFieldValue("FIELDNAME") || "");
  const code = `print('Bitmap data: ' .. ${JSON.stringify(bitmapData)})\n`;
  return code;
};

// Генератор для блока date_value (Lua)
forBlock["date_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const value = String(block.getFieldValue("DATE") ?? "");
  return [JSON.stringify(value), LuaOrder.ATOMIC];
};

// Генератор для блока slider_value (Lua)
forBlock["slider_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = Number(block.getFieldValue("SLIDER") ?? 0);
  return [String(v), LuaOrder.ATOMIC];
};

forBlock["hsv_colour_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = String(block.getFieldValue("COLOUR") ?? "#000000");
  return [JSON.stringify(v), LuaOrder.ATOMIC];
};

// Генератор для блока py_input (Lua)
forBlock["py_input"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Возвращаем выражение input(), определённое в рантайме Lua
  return ["input()", LuaOrder.ATOMIC];
};

// Генератор для блока py_input_number (Lua)
forBlock["py_input_number"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Преобразуем ввод в число
  return ["tonumber(input())", LuaOrder.ATOMIC];
};
// ===== Словарные блоки (Lua - таблицы) =====
forBlock["dict_create"] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  return ["{}", LuaOrder.ATOMIC];
};

forBlock["dict_set"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const value = generator.valueToCode(block, "VALUE", LuaOrder.NONE) || "nil";
  const code = `${dict}[${key}] = ${value}\n`;
  return code;
};

forBlock["dict_get"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, LuaOrder.ATOMIC];
};

forBlock["dict_has_key"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const code = `${dict}[${key}] ~= nil`;
  return [code, LuaOrder.RELATIONAL];
};
