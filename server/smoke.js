// Smoke-тест API сервера: регистрация → профиль → workspace → блоки → прогресс → статистика.
// Запуск: node server/smoke.js (сам поднимает сервер на тестовом порту и в tmp-каталоге)
"use strict";

process.env.DATA_DIR = require("fs").mkdtempSync(
  require("path").join(require("os").tmpdir(), "bc-smoke-"),
);
process.env.PORT = "4599";
process.env.HOST = "127.0.0.1";

const assert = require("assert");

async function main() {
  // Динамический импорт — env уже установлен
  const app = require("./index");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  const addr = server.address();
  const base = `http://127.0.0.1:${addr.port}`;

  let cookie = "";
  async function req(method, url, body) {
    const res = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, json };
  }

  const email = `user${Date.now()}@test.dev`;
  const password = "secret123";

  // 1. Неавторизованный доступ
  let r = await req("GET", "/api/auth/me");
  assert.strictEqual(r.status, 401, "me без сессии → 401");
  r = await req("GET", "/api/workspace");
  assert.strictEqual(r.status, 401, "workspace без сессии → 401");

  // 2. Регистрация
  r = await req("POST", "/api/auth/register", { email, password });
  assert.strictEqual(r.status, 201, "register → 201");
  assert.ok(r.json.user && r.json.user.id, "register вернул user");

  // 3. Повторная регистрация → 409
  r = await req("POST", "/api/auth/register", { email, password });
  assert.strictEqual(r.status, 409, "дубликат → 409");

  // 4. Короткий пароль → 400
  r = await req("POST", "/api/auth/register", {
    email: `x${Date.now()}@t.dev`,
    password: "123",
  });
  assert.strictEqual(r.status, 400, "короткий пароль → 400");

  // 5. me
  r = await req("GET", "/api/auth/me");
  assert.strictEqual(r.status, 200, "me после регистрации → 200");
  assert.strictEqual(r.json.user.email, email.toLowerCase());

  // 6. Профиль: обновление имени
  r = await req("PATCH", "/api/profile", { name: "Тестер" });
  assert.strictEqual(r.status, 200, "patch profile → 200");
  assert.strictEqual(r.json.user.name, "Тестер");
  r = await req("GET", "/api/profile");
  assert.ok(r.json.stats, "profile GET вернул stats");

  // 7. Workspace: сохранение и загрузка
  r = await req("GET", "/api/workspace");
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.json.data, null, "workspace пуст изначально");

  const wsData = { blocks: { languageVersion: 0, blocks: [] } };
  r = await req("POST", "/api/workspace", { data: wsData });
  assert.strictEqual(r.status, 200, "save workspace → 200");
  r = await req("GET", "/api/workspace");
  assert.deepStrictEqual(r.json.data, wsData, "workspace загрузился");

  // 8. Блоки: upsert, list, delete
  const def = { type: "my_block_x", message0: "%1", args0: [] };
  r = await req("PUT", "/api/blocks/my_block_x", { definition: def });
  assert.strictEqual(r.status, 200, "upsert block → 200");
  r = await req("GET", "/api/blocks");
  assert.strictEqual(r.json.blocks.length, 1, "1 блок в списке");
  assert.deepStrictEqual(r.json.blocks[0].definition, def);
  r = await req("DELETE", "/api/blocks/my_block_x");
  assert.strictEqual(r.status, 200, "delete block → 200");
  r = await req("GET", "/api/blocks");
  assert.strictEqual(r.json.blocks.length, 0, "0 блоков после удаления");

  // 9. Прогресс
  r = await req("POST", "/api/progress/hello_world", { solved: true, stars: 3 });
  assert.strictEqual(r.status, 200, "set progress → 200");
  r = await req("POST", "/api/progress/add_2_7", { solved: true, stars: 2 });
  assert.strictEqual(r.status, 200);
  r = await req("GET", "/api/progress");
  assert.strictEqual(r.json.progress.hello_world.stars, 3);
  assert.strictEqual(r.json.progress.add_2_7.solved, true);
  assert.strictEqual(r.json.progress.hello_world.solved, true);

  // 10. Статистика
  r = await req("GET", "/api/profile");
  assert.strictEqual(r.json.stats.tasksSolved, 2, "stats.tasksSolved = 2");
  assert.strictEqual(r.json.stats.stars, 5, "stats.stars = 5");
  assert.strictEqual(r.json.stats.customBlocks, 0, "stats.customBlocks = 0");

  // 11. Logout
  r = await req("POST", "/api/auth/logout");
  assert.strictEqual(r.status, 200);
  cookie = "";
  r = await req("GET", "/api/auth/me");
  assert.strictEqual(r.status, 401, "me после logout → 401");

  // 12. Логин с правильным/неверным паролем
  r = await req("POST", "/api/auth/login", { email, password: "wrongpass" });
  assert.strictEqual(r.status, 401, "неверный пароль → 401");
  r = await req("POST", "/api/auth/login", { email, password });
  assert.strictEqual(r.status, 200, "логин → 200");

  // 13. Данные сохранились между сессиями
  r = await req("GET", "/api/workspace");
  assert.deepStrictEqual(r.json.data, wsData, "workspace сохранился между сессиями");
  r = await req("GET", "/api/profile");
  assert.strictEqual(r.json.user.name, "Тестер", "имя сохранилось");

  server.close();
  console.log("SMOKE_OK: все проверки пройдены");
  process.exit(0);
}

main().catch((e) => {
  console.error("SMOKE_FAIL:", e && (e.message || e));
  process.exit(1);
});
