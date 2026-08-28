// Хэширование паролей через встроенный crypto.scrypt (без внешних зависимостей)
"use strict";

const crypto = require("crypto");

const KEYLEN = 64;

function hashPassword(password, salt) {
  const useSalt =
    salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(String(password), useSalt, KEYLEN)
    .toString("hex");
  return { hash, salt: useSalt };
}

function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { hashPassword, verifyPassword };
