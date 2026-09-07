/**
 * Интеграционные тесты API (supertest): реальные HTTP-запросы к Express-приложению
 * на эфемерном порту, с временной DATA_DIR (BC_TEST=1 отключает listen).
 *
 * Покрывают: авторизацию, профиль, прогресс, классы, лимиты тарифов,
 * автозавершение назначений, фидбэк.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Временный каталог данных — до require приложения
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "bc-api-test-"));
process.env.DATA_DIR = DATA_DIR;
process.env.BC_TEST = "1";

const app = (await import("../index.js")).default;
const store = (await import("../store.js")).default;

let server;
beforeAll(async () => {
  server = app.listen(0); // эфемерный порт
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  // Чистим временную БД
  try {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  } catch {}
});

// ---------- helpers ----------
function agent() {
  // supertest умеет в cookie-джар через session-объект
  const jar = {};
  return {
    jar,
    async call(method, url, body) {
      const cookieHeader = Object.entries(jar)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      const req = request(server)[method](url);
      if (cookieHeader) req.set("Cookie", cookieHeader);
      if (body !== undefined) req.send(body);
      const res = await req;
      const setCookie = res.headers["set-cookie"];
      if (Array.isArray(setCookie)) {
        for (const c of setCookie) {
          const m = /^([^=]+)=([^;]*)/.exec(c);
          if (m && !/Expires=Thu, 01 Jan 1970/.test(c)) jar[m[1]] = m[2];
        }
      }
      return res;
    },
    get(url) {
      return this.call("get", url);
    },
    post(url, body) {
      return this.call("post", url, body);
    },
    put(url, body) {
      return this.call("put", url, body);
    },
    del(url) {
      return this.call("delete", url);
    },
  };
}

function randomEmail() {
  return `t${Date.now()}${Math.floor(Math.random() * 1000)}@test.local`;
}

async function registerUser(email = randomEmail(), password = "secret123") {
  const a = agent();
  const res = await a.post("/api/auth/register", { email, password });
  expect(res.status).toBe(201);
  return { a, email, userId: res.body.user.id };
}

// ---------- auth ----------
describe("Auth API", () => {
  it("регистрирует и стартует сессию", async () => {
    const { a, email } = await registerUser();
    const me = await a.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it("отклоняет повторную регистрацию того же email (409)", async () => {
    const email = randomEmail();
    await registerUser(email);
    const a2 = agent();
    const res = await a2.post("/api/auth/register", {
      email,
      password: "secret123",
    });
    expect(res.status).toBe(409);
  });

  it("отклоняет короткий пароль (400)", async () => {
    const a = agent();
    const res = await a.post("/api/auth/register", {
      email: randomEmail(),
      password: "123",
    });
    expect(res.status).toBe(400);
  });

  it("логинит по email+пароль, неверный пароль → 401", async () => {
    const email = randomEmail();
    await registerUser(email, "secret123");
    const ok = await agent().post("/api/auth/login", {
      email,
      password: "secret123",
    });
    expect(ok.status).toBe(200);
    const bad = await agent().post("/api/auth/login", {
      email,
      password: "wrong-password",
    });
    expect(bad.status).toBe(401);
  });

  it("logout инвалидирует сессию", async () => {
    const { a } = await registerUser();
    expect((await a.post("/api/auth/logout", {})).status).toBe(200);
    const me = await a.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("неавторизованным /api/auth/me → 401", async () => {
    const res = await request(server).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("providers: без env все провайдеры выключены", async () => {
    const res = await request(server).get("/api/auth/providers");
    expect(res.status).toBe(200);
    expect(Object.values(res.body.providers).some(Boolean)).toBe(false);
  });

  it("неработающий провайдер → 501", async () => {
    const res = await request(server).get("/api/auth/google");
    expect(res.status).toBe(501);
  });
});

// ---------- progress ----------
describe("Progress API", () => {
  it("требует авторизацию", async () => {
    const res = await request(server).get("/api/progress");
    expect(res.status).toBe(401);
  });

  it("сохраняет прогресс и возвращает его", async () => {
    const { a } = await registerUser();
    const post = await a.post("/api/progress/hello_world", {
      solved: true,
      stars: 3,
    });
    expect(post.status).toBe(200);
    const get = await a.get("/api/progress");
    expect(get.status).toBe(200);
    expect(get.body.progress.hello_world).toEqual(
      expect.objectContaining({ solved: true, stars: 3 }),
    );
  });

  it("без solved не помечает назначения выполненными", async () => {
    const { a } = await registerUser();
    await a.post("/api/progress/hello_world", { solved: false, stars: 0 });
    const get = await a.get("/api/progress");
    expect(get.body.progress.hello_world.solved).toBe(false);
  });
});

// ---------- classes + billing ----------
describe("Classes & billing", () => {
  it("Free-тариф: 1 класс можно, 2-й — 402", async () => {
    const { a } = await registerUser();
    const first = await a.post("/api/classes", { name: "Class A" });
    expect(first.status).toBe(201);
    const second = await a.post("/api/classes", { name: "Class B" });
    expect(second.status).toBe(402);
    expect(second.body.code).toBe("PLAN_LIMIT_CLASSES");
  });

  it("промокод активирует Pro и снимает лимит классов (уникальный код)", async () => {
    // Каждый тест — свой промокод: коды одноразовые
    const code = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
    const { a } = await registerUser();
    const up = await a.post("/api/billing/upgrade", { promoCode: code });
    expect(up.status).toBe(200);
    expect(up.body.plan.id).toBe("pro");
    await a.post("/api/classes", { name: "A" });
    const second = await a.post("/api/classes", { name: "B" });
    expect(second.status).toBe(201);
  });

  it("промокод одноразовый: второй пользователь получает 400", async () => {
    const code = `ONCE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
    const first = await registerUser();
    const up1 = await first.a.post("/api/billing/upgrade", { promoCode: code });
    expect(up1.status).toBe(200);
    const second = await registerUser();
    const up2 = await second.a.post("/api/billing/upgrade", { promoCode: code });
    expect(up2.status).toBe(400);
  });

  it("чужой класс недоступен (403)", async () => {
    const owner = await registerUser();
    const cls = await owner.a.post("/api/classes", { name: "Owner class" });
    const other = await registerUser();
    const res = await other.a.get(`/api/classes/${cls.body.class.id}`);
    expect(res.status).toBe(403);
  });

  it("полный цикл: ученик, назначение, решение → автозавершение", async () => {
    const teacher = await registerUser();
    // Уникальный промокод для свободных назначений (free: 3/мес)
    const code = `LOOP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
    const up = await teacher.a.post("/api/billing/upgrade", { promoCode: code });
    expect(up.status).toBe(200);

    const cls = await teacher.a.post("/api/classes", { name: "Loop class" });
    expect(cls.status).toBe(201);
    const classId = cls.body.class.id;

    const student = await registerUser();
    const add = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: student.email,
    });
    expect(add.status).toBe(201);
    const assign = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    expect(assign.status).toBe(201);

    // Ученик решает задание
    await student.a.post("/api/progress/hello_world", {
      solved: true,
      stars: 2,
    });

    // Назначение автоматически становится completed
    const tasks = await student.a.get("/api/student/tasks");
    const t = tasks.body.tasks.find((x) => x.task_id === "hello_world");
    expect(t.status).toBe("completed");

    // Учитель видит прогресс ученика
    const prog = await teacher.a.get(
      `/api/classes/${classId}/students/${student.userId}/progress`,
    );
    expect(prog.status).toBe(200);
    expect(prog.body.stats.tasksSolved).toBe(1);
    expect(prog.body.assignments[0].status).toBe("completed");
  });

  it("тариф и расход лимитов", async () => {
    const { a } = await registerUser();
    const plan = await a.get("/api/billing/plan");
    expect(plan.status).toBe(200);
    expect(plan.body.plan.id).toBe("free");
    expect(plan.body.plan.maxClasses).toBe(1);
    expect(plan.body.usage.classes).toBe(0);
  });
});

// ---------- feedback ----------
describe("Feedback API", () => {
  it("принимает сообщение без авторизации (201)", async () => {
    const res = await request(server)
      .post("/api/feedback")
      .send({ type: "bug", message: "Test feedback message" });
    expect(res.status).toBe(201);
  });

  it("пустое сообщение → 400", async () => {
    const res = await request(server)
      .post("/api/feedback")
      .send({ type: "bug", message: "   " });
    expect(res.status).toBe(400);
  });

  it("кривой email → 400", async () => {
    const res = await request(server)
      .post("/api/feedback")
      .send({ type: "bug", message: "x", email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("types отдаёт список типов", async () => {
    const res = await request(server).get("/api/feedback/types");
    expect(res.status).toBe(200);
    expect(res.body.types).toContain("bug");
  });
});
