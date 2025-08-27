// Fengari-based Lua runtime integration

declare global {
  interface Window {
    fengari?: any;
  }
}

let _fengariLoaded: Promise<any> | null = null;

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

async function ensureFengari() {
  if (_fengariLoaded) return _fengariLoaded;
  // Use fengari-web UMD build for browsers
  const FENGARI_CDN = 'https://unpkg.com/fengari-web/dist/fengari-web.js';
  _fengariLoaded = (async () => {
    await loadScriptOnce(FENGARI_CDN);
    const f = (window as any).fengari;
    if (!f) throw new Error('Global fengari is not available after loading fengari-web.js');
    return f;
  })();
  return _fengariLoaded;
}

function appendLine(el: HTMLElement, text: string, color?: string) {
  const p = document.createElement('p');
  if (color) p.style.color = color;
  p.textContent = text;
  el.appendChild(p);
}

export async function runLua(code: string, outputElement: HTMLElement | null): Promise<void> {
  if (!code.trim() || !outputElement) return;
  try {
    const fengari = await ensureFengari();
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari as any;

    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    // Define JS print -> Lua global 'print' that writes to DOM
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      const parts: string[] = [];
      for (let i = 1; i <= n; i++) {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, i));
        lua.lua_pop(L2, 1); // pop the string copy
        parts.push(s);
      }
      appendLine(outputElement, parts.join('\t'));
      return 0;
    });
    lua.lua_setglobal(L, to_luastring('print'));

    // Load and run code
    const status = lauxlib.luaL_loadstring(L, to_luastring(code));
    if (status === lua.LUA_OK) {
      const callStatus = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0);
      if (callStatus !== lua.LUA_OK) {
        const err = to_jsstring(lua.lua_tostring(L, -1));
        lua.lua_pop(L, 1);
        appendLine(outputElement, `Ошибка Lua: ${err}`, 'red');
      }
    } else {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      lua.lua_pop(L, 1);
      appendLine(outputElement, `Ошибка Lua: ${err}`, 'red');
    }
  } catch (err: any) {
    appendLine(outputElement, `Ошибка Lua: ${err?.message || String(err)}`, 'red');
  }
}