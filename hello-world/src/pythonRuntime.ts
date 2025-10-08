import type { SupportedLanguage } from './codeExecution';

// Lazy-loaded Pyodide instance
type JsBridgeFn = (s: unknown) => void;
type Pyodide = {
  runPythonAsync: (code: string) => Promise<void>;
  globals: { set: (name: string, value: JsBridgeFn) => void };
};
let _pyodidePromise: Promise<Pyodide> | null = null;

// Configure CDN for Pyodide assets. You may adjust version if needed.
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const exists = document.querySelector(`script[src="${src}"]`);
    if (exists) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<Pyodide>;
  }
}

export async function ensurePyodide(): Promise<Pyodide> {
  if (_pyodidePromise) return _pyodidePromise;
  try {
    await loadScriptOnce(PYODIDE_CDN + 'pyodide.js');
    const loadPyodideFn = window.loadPyodide;
    if (!loadPyodideFn) throw new Error('Global loadPyodide is not available after loading pyodide.js');
    _pyodidePromise = loadPyodideFn({ indexURL: PYODIDE_CDN });
    return _pyodidePromise;
  } catch (e: unknown) {
    console.error('Failed to load Pyodide:', e);
    throw e;
  }
}

function appendLine(el: HTMLElement, text: string, color?: string) {
  const p = document.createElement('p');
  if (color) p.style.color = color;
  p.textContent = text;
  el.appendChild(p);
}

export async function runPython(code: string, outputElement: HTMLElement | null): Promise<void> {
  if (!code.trim() || !outputElement) return;
  try {
    appendLine(outputElement, 'Loading Pyodide...', '#666');
    const pyodide = await ensurePyodide();

    // Bridge JS function for capturing stdout/stderr
    pyodide.globals.set('print_to_dom', (s: unknown) => {
      // Normalize to string and handle newlines
      const str = String(s ?? '');
      const parts = str.split(/\n/);
      for (const line of parts) {
        if (line.length === 0) continue;
        appendLine(outputElement, line);
      }
    });

    // Redirect Python stdout and stderr to the JS bridge
    await pyodide.runPythonAsync(`
import sys
class _JsWriter:
    def write(self, s):
        try:
            print_to_dom(str(s))
        except Exception as _e:
            pass
    def flush(self):
        pass
sys.stdout = _JsWriter()
sys.stderr = _JsWriter()
`);

    // Clear the temporary "loading" line to avoid clutter if no output is produced by user code
    // (Optional) Could keep it; here we remove last child if it's the loading message
    const last = outputElement.lastElementChild as HTMLElement | null;
    if (last && /Loading Pyodide/.test(last.textContent || '')) {
      outputElement.removeChild(last);
    }

    await pyodide.runPythonAsync(code);
  } catch (err: unknown) {
    if (outputElement) {
      const msg = err instanceof Error ? err.message : String(err);
      appendLine(outputElement, `Ошибка Python: ${msg}`, 'red');
    }
  }
}