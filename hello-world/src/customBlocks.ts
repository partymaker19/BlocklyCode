/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { luaGenerator } from 'blockly/lua';
import {Order} from 'blockly/javascript';
import {Order as PythonOrder} from 'blockly/python';
import {Order as LuaOrder} from 'blockly/lua';

export interface CustomBlock {
  definition: any;
  generator?: string;
  generatorLanguage?: 'javascript' | 'python' | 'lua'; // Новое поле для языка генератора
  id: string;
  name: string;
  created: number;
}

const CUSTOM_BLOCKS_KEY = 'custom_blocks';

/**
 * Получить все пользовательские блоки из localStorage
 */
export function getCustomBlocks(): CustomBlock[] {
  try {
    const stored = localStorage.getItem(CUSTOM_BLOCKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom blocks:', error);
    return [];
  }
}

/**
 * Сохранить пользовательские блоки в localStorage
 */
function saveCustomBlocks(blocks: CustomBlock[]) {
  try {
    localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(blocks));
  } catch (error) {
    console.error('Error saving custom blocks:', error);
  }
}

/**
 * Добавить новый пользовательский блок
 */
export function addCustomBlock(definition: any, generator?: string, generatorLanguage?: 'javascript' | 'python' | 'lua'): boolean {
  try {
    // Валидация определения блока
    if (!definition || typeof definition !== 'object') {
      throw new Error('Invalid block definition');
    }
    
    if (!definition.type || typeof definition.type !== 'string') {
      throw new Error('Block must have a valid type');
    }

    // Проверить, что блок уже не существует
    const existingBlocks = getCustomBlocks();
    const existsIndex = existingBlocks.findIndex(b => b.definition.type === definition.type);
    
    const newBlock: CustomBlock = {
      definition,
      generator,
      generatorLanguage: generatorLanguage || 'javascript', // По умолчанию JavaScript
      id: definition.type,
      name: definition.type,
      created: Date.now()
    };

    if (existsIndex >= 0) {
      // Обновляем существующий блок
      existingBlocks[existsIndex] = newBlock;
    } else {
      // Добавляем новый блок
      existingBlocks.push(newBlock);
    }

    saveCustomBlocks(existingBlocks);
    return true;
  } catch (error) {
    console.error('Error adding custom block:', error);
    return false;
  }
}

/**
 * Удалить пользовательский блок
 */
export function removeCustomBlock(blockType: string): boolean {
  try {
    const blocks = getCustomBlocks();
    const filtered = blocks.filter(b => b.definition.type !== blockType);
    
    if (filtered.length !== blocks.length) {
      saveCustomBlocks(filtered);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing custom block:', error);
    return false;
  }
}

/**
 * Зарегистрировать все пользовательские блоки в Blockly
 */
export function registerCustomBlocks() {
  const customBlocks = getCustomBlocks();
  
  if (customBlocks.length === 0) {
    return;
  }

  // Создаем объект с определениями блоков
  const blockDefinitions: { [key: string]: any } = {};
  
  customBlocks.forEach(block => {
    // Добавляем init функцию, которая инициализирует блок из JSON-определения
    const definition = {
      ...block.definition,
      init: function(this: Blockly.Block) {
        // Полная инициализация из JSON, чтобы корректно отрисовывались поля/входы/сообщения
        this.jsonInit(block.definition);
      }
    };
    
    blockDefinitions[block.definition.type] = definition;
    
    // Регистрируем генератор, если он есть
    if (block.generator) {
      try {
        console.log(`Registering generator for block ${block.definition.type} (${block.generatorLanguage || 'javascript'}):`, block.generator);
        
        // Очищаем код генератора от TypeScript конструкций и экранируем шаблоны
        let cleanGenerator = stripTypeScriptFromJs(block.generator || '');
        
        // Определяем целевой генератор и Order в зависимости от языка
        let targetGenerator: any;
        let targetOrder: any;
        
        switch (block.generatorLanguage) {
          case 'python':
            targetGenerator = pythonGenerator;
            targetOrder = PythonOrder;
            break;
          case 'lua':
            targetGenerator = luaGenerator;
            targetOrder = LuaOrder;
            break;
          case 'javascript':
          default:
            targetGenerator = javascriptGenerator;
            targetOrder = Order;
            break;
        }
        
        // Создаем функцию генератора через Function constructor с лучшей обработкой ошибок
        (targetGenerator.forBlock as any)[block.definition.type] = function(blockInstance: any) {
          console.log(`Executing generator for block ${blockInstance.type} (${block.generatorLanguage || 'javascript'})`);
          try {
            // Создаем тело функции генератора без использования шаблонных литералов,
            // чтобы не ломать пользовательский код с бэктиками и ${}
            const body =
              'try {\n' +
              cleanGenerator +
              '\n} catch (error) {\n' +
              "  const msg = (error && error.message) ? error.message : String(error);\n" +
              "  console.error('Error in user generator:', error);\n" +
              "  return '// Error in generator: ' + msg + '\\n';\n" +
              '}';
            
            // Создаем функцию генератора, предоставляя доступ к генераторам через глобальные объекты
            // Это позволяет пользовательскому коду использовать `pythonGenerator`, `luaGenerator` и `javascriptGenerator`
            const generatorFunction = new Function(
              'block', 
              'Order', 
              'javascriptGenerator', 
              'pythonGenerator', 
              'luaGenerator',
              body
            );
            const result = generatorFunction(
              blockInstance, 
              targetOrder, 
              javascriptGenerator, 
              pythonGenerator, 
              luaGenerator
            );
            console.log(`Generator result for ${blockInstance.type}:`, result);
            return result || `// Custom block: ${blockInstance.type}\n`;
          } catch (error) {
            const msg = (error && (error as any).message) ? (error as any).message : String(error);
            console.error(`Runtime error in generator for ${blockInstance.type}:`, error);
            return `// Runtime error in generator: ${msg}\n`;
          }
        };
        console.log(`Successfully registered generator for ${block.definition.type}`);
      } catch (error) {
        console.error(`Error registering generator for block ${block.definition.type}:`, error);
        // Создаем простой генератор по умолчанию для всех трех языков
        const fallbackGenerator = function(block: any) {
          return `// Custom block: ${block.type}\n`;
        };
        (javascriptGenerator.forBlock as any)[block.definition.type] = fallbackGenerator;
        (pythonGenerator.forBlock as any)[block.definition.type] = fallbackGenerator;
        (luaGenerator.forBlock as any)[block.definition.type] = fallbackGenerator;
      }
    } else {
      // Встроенные генераторы для некоторых типов блоков
      if (block.definition.type === 'return_value') {
        // Генератор для блока return - теперь использует настоящий return, совместимый с IIFE
        const returnGenerator = function(block: any) {
          // JavaScript
          if (block.generatorLanguage === 'javascript') {
            const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null';
            return `return ${value};\n`;
          }
          // Python  
          else if (block.generatorLanguage === 'python') {
            const value = pythonGenerator.valueToCode(block, 'VALUE', PythonOrder.NONE) || 'None';
            return `return ${value}\n`;
          }
          // Lua
          else if (block.generatorLanguage === 'lua') {
            const value = luaGenerator.valueToCode(block, 'VALUE', LuaOrder.NONE) || 'nil';
            return `return ${value}\n`;
          }
          return `// Custom block: ${block.type}\n`;
        };
        (javascriptGenerator.forBlock as any)[block.definition.type] = returnGenerator;
        (pythonGenerator.forBlock as any)[block.definition.type] = returnGenerator;
        (luaGenerator.forBlock as any)[block.definition.type] = returnGenerator;
      } else {
        // Генератор по умолчанию для остальных блоков
        const defaultGenerator = function(block: any) {
          return `// Custom block: ${block.type}\n`;
        };
        (javascriptGenerator.forBlock as any)[block.definition.type] = defaultGenerator;
        (pythonGenerator.forBlock as any)[block.definition.type] = defaultGenerator;
        (luaGenerator.forBlock as any)[block.definition.type] = defaultGenerator;
      }
    }
  });

  // Регистрируем блоки в Blockly
  Blockly.common.defineBlocks(blockDefinitions);
}

/**
 * Получить содержимое категории "Мои блоки" для toolbox
 */
export function getCustomBlocksToolboxCategory() {
  const customBlocks = getCustomBlocks();
  
  if (customBlocks.length === 0) {
    return null;
  }

  return {
    kind: 'category',
    name: 'My Blocks', // Будет переведено в toolbox
    colour: '#9C27B0',
    contents: customBlocks.map(block => ({
      kind: 'block',
      type: block.definition.type
    }))
  };
}

/**
 * Импортировать блок из JSON строки
 */
export function importBlockFromJson(
  jsonString: string,
  generatorCode?: string,
  generatorLanguage?: 'javascript' | 'python' | 'lua'
): { success: boolean; error?: string; blockType?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    let definition: any;
    let inlineGenerator: string | undefined;

    if (parsed && parsed.definition) {
      definition = parsed.definition;
      inlineGenerator = parsed.generator;
      if (!generatorCode && inlineGenerator) {
        generatorCode = inlineGenerator;
      }
      if (!generatorLanguage && parsed.generatorLanguage) {
        generatorLanguage = parsed.generatorLanguage;
      }
    } else {
      definition = parsed;
    }

    // Базовая валидация определения
    if (!definition || typeof definition !== 'object') {
      return { success: false, error: 'Некорректный JSON определения блока' };
    }
    if (!definition.type) {
      return { success: false, error: 'В определении блока отсутствует поле "type"' };
    }
    if (!('message0' in definition) && !('message1' in definition)) {
      return { success: false, error: 'В определении блока отсутствует поле message0/message1' };
    }

    // Очистка TS-конструкций для JS генератора
    if (generatorLanguage === 'javascript' && typeof generatorCode === 'string') {
      generatorCode = stripTypeScriptFromJs(generatorCode);
    }

    const success = addCustomBlock(definition, generatorCode ?? inlineGenerator, generatorLanguage);
    if (!success) {
      return { success: false, error: 'Блок с таким типом уже существует или не удалось сохранить' };
    }

    return { success: true, blockType: definition.type };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

/**
 * Экспортировать все пользовательские блоки в JSON
 */
export function exportCustomBlocks(): string {
  const blocks = getCustomBlocks();
  return JSON.stringify(blocks, null, 2);
}

/**
 * Импортировать блоки из экспортированного JSON
 */
export function importCustomBlocks(jsonString: string): { success: boolean; imported: number; errors: string[] } {
  try {
    const importedBlocks: CustomBlock[] = JSON.parse(jsonString.trim());
    
    if (!Array.isArray(importedBlocks)) {
      return { success: false, imported: 0, errors: ['Invalid format: expected array of blocks'] };
    }

    let imported = 0;
    const errors: string[] = [];

    importedBlocks.forEach((block, index) => {
      try {
        if (addCustomBlock(block.definition, block.generator, block.generatorLanguage)) {
          imported++;
        } else {
          errors.push(`Block ${index + 1}: Failed to import`);
        }
      } catch (error) {
        const msg = (error && (error as any).message) ? (error as any).message : String(error);
        errors.push(`Block ${index + 1}: ${msg}`);
      }
    });

    return { success: imported > 0, imported, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, imported: 0, errors: [`Invalid JSON: ${msg}`] };
  }
}

// Helper to strip TypeScript constructs from user-supplied JS generator code
function stripTypeScriptFromJs(code: string): string {
  let out = code ?? '';
  out = out.replace(/\s+as\s+[\w\.\[\]<>\|]+/g, '');
  out = out.replace(/:\s*[\w\.\[\]<>\|\s,?]+/g, '');
  out = out.replace(/<[^>]+>/g, '');
  return out;
}