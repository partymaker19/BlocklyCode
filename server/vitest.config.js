import { defineConfig } from "vitest/config";

// Конфиг тестов API-сервера (server/tests).
// BC_TEST=1 отключает listen в index.js — supertest сам поднимает приложение.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
    env: {
      BC_TEST: "1",
    },
  },
});
