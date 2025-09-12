import * as Blockly from "blockly";
import { initAuth, addAuthChangeListener } from "./authClient";
import { switchStoragePreference } from "./appBootstrap";

// Инициализирует авторизацию и переключение хранилища в зависимости от статуса пользователя
export async function setupAuthBootstrap(ws: Blockly.Workspace) {
  // Первичная проверка статуса
  await initAuth();
  // Слушаем изменения авторизации
  addAuthChangeListener(async (user) => {
    try {
      if (user) {
        await switchStoragePreference("server", ws);
      } else {
        await switchStoragePreference("local", ws);
      }
    } catch (e) {
      console.warn("Failed to switch storage on auth change", e);
    }
  });
}