// Sandbox Web Worker: безопасное выполнение кода для JS/Python/Lua с выводом и сообщениями
import type { WorkerInMsg, WorkerOutMsg } from "./types/messages";

// Ограничиваем количество строк, отправляемых в главный поток, чтобы снизить нагрузку
const MAX_POST_LINES = 300;
let _postedLines = 0;
function post(msg: WorkerOutMsg) {
  try {
    if (msg.type === 'stdout' || msg.type === 'stderr') {
      if (_postedLines >= MAX_POST_LINES) {
        // Один раз сообщим, что вывод сокращён
        if (_postedLines === MAX_POST_LINES) {
          (self as any).postMessage({ type: 'status', text: 'Вывод сокращён: достигнут лимит строк' });
          _postedLines++;
        }
        return;
      }
      _postedLines++;
    }
    (self as any).postMessage(msg);
  } catch {
    // ignore
  }
}

// Глобальный дедлайн для ожиданий ввода/выполнения
let _deadlineEpochMs: number = 0;

// Синхронный ввод с использованием SharedArrayBuffer и Atomics.wait в воркере
function syncInput(prompt: string): string {
  try {
    const headerBytes = 8; // 2 * Int32: [status, length]
    const capacity = 4096; // максимум символов ввода
    const sab = new SharedArrayBuffer(headerBytes + capacity);
    const ctrl = new Int32Array(sab, 0, 2);
    const data = new Uint8Array(sab, headerBytes);
    // Сообщаем главному потоку о необходимости ввода
    post({ type: 'input_request', prompt, buffer: sab });

    // Ждём ответа пользователя либо таймаута
    const remainingMs = Math.max(0, (_deadlineEpochMs || 0) - Date.now());
    const result = (Atomics as any).wait(ctrl, 0, 0, remainingMs);
    if (result !== 'ok') {
      if (result === 'timed-out') {
        throw new Error('Ввод прерван по таймауту');
      }
      throw new Error('Ввод отменён');
    }
    const len = ctrl[1] | 0;
    const dec = new TextDecoder();
    const text = dec.decode(data.slice(0, Math.max(0, Math.min(len, data.length))));
    return text;
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : String(e);
    throw new Error(msg || 'Ошибка ввода');
  }
}

// JS исполнение в изолированном контексте
function runJS(code: string, timeoutMs?: number) {
  const print = (s: unknown) => post({ type: 'stdout', text: String(s ?? '') });
  const printColored = (s: unknown, color: unknown) => {
    try {
      post({ type: 'stdout_color', text: String(s ?? ''), color: String(color ?? '') });
    } catch {
      post({ type: 'stdout', text: String(s ?? '') });
    }
  };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  try {
    // Устанавливаем общий дедлайн для операций ввода
    _deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    console.log = (...args: unknown[]) => {
      try { originalLog.apply(console, args); } catch {}
      post({ type: 'stdout', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    console.warn = (...args: unknown[]) => {
      try { originalWarn.apply(console, args); } catch {}
      post({ type: 'stderr', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    console.error = (...args: unknown[]) => {
      try { originalError.apply(console, args); } catch {}
      post({ type: 'stderr', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    // Подставляем window/self/globalThis внутрь исполняемого кода, чтобы избежать ошибок в воркере
    // Передаём ссылку на syncInput внутрь обёртки, чтобы избежать "syncInput is not defined"
    const wrapper = `(function(print, printColored, consoleObj, selfRef, windowRef, globalRef, syncInputRef){\ntry{var window=windowRef;var self=selfRef;var globalThis=globalRef;}catch(e){}\n// Определяем синхронный ввод для JS-кода\nvar input = function(prompt){ try { return syncInputRef(String(prompt ?? '')); } catch (e) { throw e; } };\n${code}\n})`;
    const fn = (0, eval)(wrapper) as (
      print: (s: unknown) => void,
      printColored: (s: unknown, color: unknown) => void,
      consoleObj: Console,
      selfRef: unknown,
      windowRef: unknown,
      globalRef: unknown,
      syncInputRef: (p: string) => string
    ) => void;
    fn(print, printColored, console, self as unknown, self as unknown, self as unknown, syncInput);
    post({ type: 'done' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    post({ type: 'error', message: msg });
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

// Python через Pyodide внутри воркера
async function runPython(code: string, timeoutMs?: number) {
  try {
    post({ type: 'status', text: 'Загрузка Pyodide...' });
    (self as any).importScripts('https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js');
    const loadPyodide = (self as any).loadPyodide;
    const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/' });

    pyodide.globals.set('print_to_dom', (s: any) => {
      const str = String(s ?? '');
      const parts = str.split(/\n/);
      for (const line of parts) {
        if (!line) continue;
        post({ type: 'stdout', text: line });
      }
    });

    // Цветной вывод для Python
    pyodide.globals.set('print_to_dom_color', (s: any, color: any) => {
      try {
        const text = String(s ?? '');
        const clr = String(color ?? '');
        post({ type: 'stdout_color', text, color: clr });
      } catch (e) {
        post({ type: 'stdout', text: String(s ?? '') });
      }
    });

    _deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
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

# Устанавливаем трассировщик, который прерывает выполнение по истечении времени
import time
_deadline_ms = ${_deadlineEpochMs}
def _trace(frame, event, arg):
    if time.time() * 1000 > _deadline_ms:
        raise TimeoutError('Превышен лимит времени')
    return _trace
sys.settrace(_trace)
`);

    // Убираем статус
    post({ type: 'status', text: '' });

    // Переопределяем input -> синхронный ввод через SharedArrayBuffer
    pyodide.globals.set('input', (prompt: any) => syncInput(String(prompt ?? '')));

    try {
      // Обёртка: добавляем удобную функцию print_colored
      await pyodide.runPythonAsync('def print_colored(s, c):\n    print_to_dom_color(str(s), str(c))');
      await pyodide.runPythonAsync(code);
    } finally {
      await pyodide.runPythonAsync('import sys; sys.settrace(None)');
    }
    post({ type: 'done' });
  } catch (e: any) {
    post({ type: 'error', message: String(e?.message || e) });
  }
}

// Lua через Fengari внутри воркера
async function runLua(code: string, timeoutMs?: number) {
  try {
    // Загружаем Fengari локально, скопированный в сборку вебпака
    const origin = (self as any).location?.origin || '';
    const localUrl = origin ? origin + '/libs/fengari-web.js' : '/libs/fengari-web.js';
    // Полифиллы для окружения: некоторые сборки fengari-web ожидают window/globalThis
    const g: any = self as any;
    try {
      if (!g.window) g.window = g;
      if (!g.globalThis) g.globalThis = g;
    } catch {}
    g.importScripts(localUrl);
    const fengari = (self as any).fengari;
    if (!fengari) throw new Error('Fengari недоступен');
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari as any;
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    // Устанавливаем хук дебаггера для прерывания по времени
    const deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    // Сохраняем дедлайн для syncInput
    _deadlineEpochMs = deadlineEpochMs;
    const hook = (L2: any, ar: any) => {
      if (Date.now() > deadlineEpochMs) {
        // Вызов ошибки внутри VM
        lauxlib.luaL_error(L2, to_luastring('Превышен лимит времени'));
      }
    };
    // Проверяем чаще, чтобы быстрее ловить бесконечные циклы
    // Включаем маски по счётчику и по линиям/вызовам для лучшей реакции
    const mask = (lua.LUA_MASKCOUNT | lua.LUA_MASKLINE | lua.LUA_MASKCALL);
    lua.lua_sethook(L, hook as any, mask, 1000);

    // Переопределяем print -> постим в главный поток
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      const parts: string[] = [];
      for (let i = 1; i <= n; i++) {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, i));
        lua.lua_pop(L2, 1);
        parts.push(s);
      }
      post({ type: 'stdout', text: parts.join('\t') });
      return 0;
    });
    lua.lua_setglobal(L, to_luastring('print'));

    // Цветной вывод: print_colored(text, color)
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      let txt = '';
      let clr = '';
      if (n >= 1) {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, 1));
        lua.lua_pop(L2, 1);
        txt = s ?? '';
      }
      if (n >= 2) {
        const c = to_jsstring(lauxlib.luaL_tolstring(L2, 2));
        lua.lua_pop(L2, 1);
        clr = c ?? '';
      }
      try {
        post({ type: 'stdout_color', text: String(txt), color: String(clr) });
      } catch {
        post({ type: 'stdout', text: String(txt) });
      }
      return 0;
    });
    lua.lua_setglobal(L, to_luastring('print_colored'));

    // Определяем глобальную функцию input(prompt) -> string, использующую syncInput
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      let promptStr = '';
      if (n >= 1) {
        try {
          const s = to_jsstring(lauxlib.luaL_tolstring(L2, 1));
          lua.lua_pop(L2, 1);
          promptStr = s ?? '';
        } catch { promptStr = ''; }
      }
      try {
        const inputText = syncInput(String(promptStr));
        lua.lua_pushstring(L2, to_luastring(String(inputText)));
        return 1;
      } catch (e: any) {
        const msg = String(e?.message || e);
        // Возвращаем nil и сообщение как ошибка через stderr
        post({ type: 'stderr', text: msg });
        lua.lua_pushnil(L2);
        return 1;
      }
    });
    lua.lua_setglobal(L, to_luastring('input'));

    const status = lauxlib.luaL_loadstring(L, to_luastring(code));
    if (status === lua.LUA_OK) {
      const callStatus = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0);
      if (callStatus !== lua.LUA_OK) {
        const err = to_jsstring(lua.lua_tostring(L, -1));
        lua.lua_pop(L, 1);
        post({ type: 'error', message: err });
        return;
      }
      post({ type: 'done' });
    } else {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      lua.lua_pop(L, 1);
      post({ type: 'error', message: err });
    }
  } catch (e: any) {
    post({ type: 'error', message: String(e?.message || e) });
  }
}

self.onmessage = (ev: MessageEvent<WorkerInMsg>) => {
  const msg = ev.data as WorkerInMsg;
  // Обрабатываем объединённый тип: запуск кода или ответ ввода
  if ('language' in msg) {
    const { language, code, timeoutMs } = msg;
  _postedLines = 0; // сбрасываем лимит на каждую новую задачу
  if (!code || !code.trim()) {
    post({ type: 'done' });
    return;
  }
  try {
    if (language === 'javascript' || language === 'typescript') {
      runJS(code, timeoutMs);
    } else if (language === 'python') {
      runPython(code, timeoutMs);
    } else if (language === 'lua') {
      runLua(code, timeoutMs);
    } else {
      post({ type: 'error', message: `Неизвестный язык: ${language}` });
    }
  } catch (e: any) {
    post({ type: 'error', message: String(e?.message || e) });
  }
  } else {
    // Тип input_response обрабатывается рантаймами, здесь ничего не делаем
    return;
  }
};