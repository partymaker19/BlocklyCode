/**
 * Генерация промокодов Pro: node scripts/promo.js <CODE> [--days N] [--plan pro]
 *
 * Примеры:
 *   npm run promo SCH2026            # код SCH2026, Pro, без срока действия кода
 *   npm run promo MARCH --days 30    # код MARCH, Pro, истекает через 30 дней
 *
 * Код нормализуется к верхнему регистру. Промокод одноразовый:
 * активирует Pro на 30 дней с момента использования.
 */
"use strict";

const path = require("path");
const store = require("../server/store");

function usage() {
  console.log("Usage: npm run promo <CODE> [--days N] [--plan pro|free]");
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const positional = [];
  let days = null;
  let plan = "pro";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--days") {
      const v = parseInt(args[++i], 10);
      if (!Number.isFinite(v) || v <= 0) usage();
      days = v;
    } else if (args[i] === "--plan") {
      plan = String(args[++i] || "");
      if (!store.PLANS[plan]) usage();
    } else {
      positional.push(args[i]);
    }
  }

  const code = (positional[0] || "").trim().toUpperCase();
  if (!code) usage();

  const existing = store.getPromoCode(code);
  if (existing) {
    console.log(
      `Промокод ${code} уже существует (plan=${existing.plan}, ` +
        `used_by=${existing.used_by || "—"}) — перезаписываю.`,
    );
  }

  const promo = store.createPromoCode({ code, plan, expiresInDays: days });
  console.log("Создан промокод:");
  console.log(JSON.stringify(promo, null, 2));
  console.log(
    `\nИспользование: ученик/учитель вводит код в «Классы → Подписка».` +
      `\nАктивирует тариф ${promo.plan} на 30 дней с момента ввода.`,
  );
  process.exit(0);
}

main();
