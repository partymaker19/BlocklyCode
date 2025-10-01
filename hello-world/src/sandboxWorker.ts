// Sandbox Web Worker: безопасное выполнение кода для JS/Python/Lua с выводом и сообщениями

// Типы сообщений воркера
type InMsg = {
  language: 'javascript' | 'python' | 'lua' | 'typescript';
  code: string;
  timeoutMs?: number;
};

type OutMsg =
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'status'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

function post(msg: OutMsg) {
  (self as any).postMessage(msg);
}

// JS исполнение в изолированном контексте
function runJS(code: string) {
  const print = (s: any) => post({ type: 'stdout', text: String(s ?? '') });
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  try {
    console.log = (...args: any[]) => {
      try { originalLog.apply(console, args); } catch {}
      post({ type: 'stdout', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    console.warn = (...args: any[]) => {
      try { originalWarn.apply(console, args); } catch {}
      post({ type: 'stderr', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    console.error = (...args: any[]) => {
      try { originalError.apply(console, args); } catch {}
      post({ type: 'stderr', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
    };
    // Подставляем window/self/globalThis внутрь исполняемого кода, чтобы избежать ошибок в воркере
    const wrapper = `(function(print, consoleObj, selfRef, windowRef, globalRef){\ntry{var window=windowRef;var self=selfRef;var globalThis=globalRef;}catch(e){}\n${code}\n})`;
    const fn = (0, eval)(wrapper) as (
      print: (s: any) => void,
      consoleObj: any,
      selfRef: any,
      windowRef: any,
      globalRef: any
    ) => void;
    fn(print, console, self as any, self as any, self as any);
    post({ type: 'done' });
  } catch (e: any) {
    post({ type: 'error', message: String(e?.message || e) });
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
    (self as any).importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
    const loadPyodide = (self as any).loadPyodide;
    const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });

    pyodide.globals.set('print_to_dom', (s: any) => {
      const str = String(s ?? '');
      const parts = str.split(/\n/);
      for (const line of parts) {
        if (!line) continue;
        post({ type: 'stdout', text: line });
      }
    });

    const deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
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
_deadline_ms = ${deadlineEpochMs}
def _trace(frame, event, arg):
    if time.time() * 1000 > _deadline_ms:
        raise TimeoutError('Превышен лимит времени')
    return _trace
sys.settrace(_trace)
`);

    // Убираем статус
    post({ type: 'status', text: '' });

    try {
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
    const hook = (L2: any, ar: any) => {
      if (Date.now() > deadlineEpochMs) {
        // Вызов ошибки внутри VM
        lauxlib.luaL_error(L2, to_luastring('Превышен лимит времени'));
      }
    };
    // Проверяем примерно каждые 10k инструкций, чтобы не создавать большой оверхед
    lua.lua_sethook(L, hook as any, lua.LUA_MASKCOUNT, 10000);

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

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const { language, code, timeoutMs } = ev.data || ({} as any);
  if (!code || !code.trim()) {
    post({ type: 'done' });
    return;
  }
  try {
    if (language === 'javascript' || language === 'typescript') {
      runJS(code);
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
};