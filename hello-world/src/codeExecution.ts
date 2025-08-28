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
function generateCode(
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
function executeJavaScriptCode(
  code: string, 
  outputElement: HTMLElement | null
): void {
  if (!code.trim()) return;

  if (outputElement) {
    outputElement.innerHTML = '';
  }

  const appendLine = (text: string, color?: string) => {
    if (!outputElement) return;
    const p = document.createElement('p');
    if (color) p.style.color = color;
    p.textContent = text;
    outputElement.appendChild(p);
  };

  // Preserve original console methods to restore later
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  try {
    if (outputElement) {
      console.log = (...args: any[]) => {
        try { originalLog.apply(console, args); } catch {}
        appendLine(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
      };
      console.warn = (...args: any[]) => {
        try { originalWarn.apply(console, args); } catch {}
        appendLine(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '), '#b58900');
      };
      console.error = (...args: any[]) => {
        try { originalError.apply(console, args); } catch {}
        appendLine(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '), 'red');
      };
    }

    // Provide a print function to match Python/Lua UX
    const jsPrint = (s: any) => appendLine(String(s ?? ''));

    // Wrap code so it can access the print function
    const wrapper = `(function(print){\n${code}\n})`;
    const fn = eval(wrapper) as (print: (s: any) => void) => void;
    fn(jsPrint);
  } catch (error) {
    console.error('Runtime error:', error);
    if (outputElement) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка выполнения: ${(error as any).message || error}`;
      outputElement.appendChild(errorEl);
    }
  } finally {
    // Restore console methods
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

/**
 * Displays information message for non-executable languages
 */
function showNonExecutableMessage(
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
export async function runCode(
  workspace: Blockly.WorkspaceSvg | null,
  language: SupportedLanguage,
  codeDisplayElement: ChildNode | null,
  outputElement: HTMLElement | null
): Promise<void> {
  if (!workspace) return;
  
  try {
    const code = generateCode(workspace, language);
    
    if (codeDisplayElement && codeDisplayElement.parentNode) {
      codeDisplayElement.textContent = code;
    }
    
    if (outputElement) {
      outputElement.innerHTML = '';
    }

    if (language === 'javascript') {
      executeJavaScriptCode(code, outputElement);
    } else if (language === 'python') {
      const py = await ensurePythonRuntime();
      await py.runPython(code, outputElement);
    } else if (language === 'lua') {
      const lua = await ensureLuaRuntime();
      await lua.runLua(code, outputElement);
    }
  } catch (error) {
    console.error('Code execution error:', error);
    if (outputElement) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка генерации/выполнения: ${(error as any).message || error}`;
      outputElement.appendChild(errorEl);
    }
  }
}

// Execute raw source code by language (used by Ace Run button)
export async function runCodeString(
  language: SupportedLanguage,
  sourceCode: string,
  outputElement: HTMLElement | null
): Promise<void> {
  try {
    if (outputElement) outputElement.innerHTML = '';
    const code = sourceCode || '';
    if (!code.trim()) return;

    if (language === 'javascript') {
      executeJavaScriptCode(code, outputElement);
    } else if (language === 'python') {
      const py = await ensurePythonRuntime();
      await py.runPython(code, outputElement);
    } else if (language === 'lua') {
      const lua = await ensureLuaRuntime();
      await lua.runLua(code, outputElement);
    }
  } catch (error) {
    console.error('Code execution error:', error);
    if (outputElement) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка выполнения: ${(error as any).message || error}`;
      outputElement.appendChild(errorEl);
    }
  }
}

// Lazy imports for runtimes
let _pyRuntime: null | (typeof import('./pythonRuntime')) = null;
let _luaRuntime: null | (typeof import('./luaRuntime')) = null;

async function ensurePythonRuntime() {
  if (_pyRuntime) return _pyRuntime;
  _pyRuntime = await import('./pythonRuntime');
  return _pyRuntime;
}

async function ensureLuaRuntime() {
  if (_luaRuntime) return _luaRuntime;
  _luaRuntime = await import('./luaRuntime');
  return _luaRuntime;
}

/**
 * Clears the output area
 */
export function clearOutput(outputElement: HTMLElement | null): void {
  if (outputElement) {
    outputElement.innerHTML = '';
  }
}