/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { luaGenerator } from 'blockly/lua';

export type SupportedLanguage = 'javascript' | 'python' | 'lua';

/**
 * Generates code from a Blockly workspace based on the selected language
 */
export function generateCode(
  workspace: Blockly.WorkspaceSvg, 
  language: SupportedLanguage
): string {
  try {
    switch (language) {
      case 'python':
        return pythonGenerator.workspaceToCode(workspace);
      case 'lua':
        return luaGenerator.workspaceToCode(workspace);
      case 'javascript':
      default:
        return javascriptGenerator.workspaceToCode(workspace);
    }
  } catch (error) {
    console.error('Code generation error:', error);
    throw error;
  }
}

/**
 * Executes generated JavaScript code and handles output
 */
export function executeJavaScriptCode(
  code: string, 
  outputElement: HTMLElement | null
): void {
  if (!code.trim()) return;
  
  if (outputElement) {
    outputElement.innerHTML = '';
  }
  
  try {
    // Создаем IIFE для изоляции кода
    const executableCode = `(function() {\n${code}\n})();`;
    eval(executableCode);
  } catch (error) {
    console.error('Runtime error:', error);
    if (outputElement) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка выполнения: ${(error as any).message || error}`;
      outputElement.appendChild(errorEl);
    }
  }
}

/**
 * Displays information message for non-executable languages
 */
export function showNonExecutableMessage(
  language: SupportedLanguage,
  outputElement: HTMLElement | null,
  hasCode: boolean
): void {
  if (!hasCode || !outputElement) return;
  
  const infoEl = document.createElement('p');
  infoEl.style.color = '#666';
  infoEl.style.fontStyle = 'italic';
  
  const langName = language === 'python' ? 'Python' : 'Lua';
  infoEl.textContent = `Код на ${langName} сгенерирован. Для выполнения используйте соответствующий интерпретатор.`;
  
  outputElement.appendChild(infoEl);
}

/**
 * Main function to run code generation and execution
 */
export function runCode(
  workspace: Blockly.WorkspaceSvg | null,
  language: SupportedLanguage,
  codeDisplayElement: ChildNode | null,
  outputElement: HTMLElement | null
): void {
  if (!workspace) return;
  
  try {
    const code = generateCode(workspace, language);
    
    // Update code display
    if (codeDisplayElement && codeDisplayElement.parentNode) {
      codeDisplayElement.textContent = code;
    }
    
    // Clear output area
    if (outputElement) {
      outputElement.innerHTML = '';
    }
    
    // Execute or show info based on language
    if (language === 'javascript') {
      executeJavaScriptCode(code, outputElement);
    } else {
      showNonExecutableMessage(language, outputElement, code.trim().length > 0);
    }
  } catch (error) {
    console.error('Code execution error:', error);
    if (outputElement) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка генерации кода: ${(error as any).message || error}`;
      outputElement.appendChild(errorEl);
    }
  }
}