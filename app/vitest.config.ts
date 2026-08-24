import { defineConfig } from "vitest/config";

/**
 * Конфигурация тестов (vitest).
 * Окружение jsdom — Blockly нужен document/window даже в headless-режиме
 * (Blockly.Xml создаёт DOM-узлы блоков). Файл setup.ts регистрирует
 * стандартные и кастомные блоки до запуска тестов.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
