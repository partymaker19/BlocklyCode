// @ts-check
// ESLint 9 (flat config). Стиль кода не навязываем жёстко: tsc проверяет типы,
// Prettier — форматирование. Здесь — только корректность и очевидные ошибки.
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "testsprite_tests/**",
      "build/**",
      // CJS-конфиги сборки: require() и Function-типы там легитимны
      "webpack.config.js",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Кодовая база активно использует any в валидаторах Blockly —
      // запрещать сразу нельзя, это отдельная большая работа.
      "@typescript-eslint/no-explicit-any": "off",
      // Неиспользуемые переменные — предупреждение, не ошибка сборки CI.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `catch {}` используется намеренно (Blockly кидает разнообразные ошибки)
      "no-empty": "off",
      // Проверяется компилятором TypeScript, в ESLint не нужно
      "no-undef": "off",
    },
  },
);
