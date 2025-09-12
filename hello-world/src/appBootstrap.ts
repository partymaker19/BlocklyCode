import * as Blockly from "blockly";
import { save as saveLocal, load as loadLocal } from "./serialization";

// Типы провайдеров хранения
export type StorageKind = "local" | "server";

interface StorageProvider {
  kind: StorageKind;
  load(ws: Blockly.Workspace): Promise<void> | void;
  save(ws: Blockly.Workspace): Promise<void> | void;
}

// Информация для UI-индикатора
export type StorageIndicatorInfo = { kind: StorageKind; lastSavedAt: Date | null };
export type StorageIndicatorUpdater = (info: StorageIndicatorInfo) => void;

let provider: StorageProvider;
let saveTimer: number | undefined;
let lastSavedAt: Date | null = null;
let indicatorUpdater: StorageIndicatorUpdater | null = null;

export function setStorageIndicatorUpdater(cb: StorageIndicatorUpdater | null) {
  indicatorUpdater = cb;
  // Немедленно сообщить текущее состояние, если возможно
  if (indicatorUpdater) {
    indicatorUpdater({ kind: provider?.kind ?? "local", lastSavedAt });
  }
}

class LocalStorageProvider implements StorageProvider {
  kind: StorageKind = "local";
  load(ws: Blockly.Workspace) {
    try {
      loadLocal(ws);
    } catch (e) {
      console.warn("Local load failed", e);
    }
  }
  save(ws: Blockly.Workspace) {
    try {
      saveLocal(ws);
      // Локальное сохранение успешно — обновляем метку
      lastSavedAt = new Date();
      indicatorUpdater?.({ kind: this.kind, lastSavedAt });
    } catch (e) {
      console.warn("Local save failed", e);
    }
  }
}

class ServerStorageProvider implements StorageProvider {
  kind: StorageKind = "server";
  async load(ws: Blockly.Workspace) {
    try {
      const res = await fetch("/api/workspace", { credentials: "include" });
      if (!res.ok) return; // Нет сохранений на сервере или не авторизованы
      const payload = await res.json();
      const data = payload?.data ?? payload; // допускаем прямые данные
      if (!data) return;
      Blockly.Events.disable();
      Blockly.serialization.workspaces.load(data, ws, undefined);
      Blockly.Events.enable();
    } catch (e) {
      console.warn("Server load failed, fallback to current state", e);
    }
  }
  async save(ws: Blockly.Workspace) {
    try {
      const data = Blockly.serialization.workspaces.save(ws);
      await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data }),
      });
      lastSavedAt = new Date();
      indicatorUpdater?.({ kind: this.kind, lastSavedAt });
    } catch (e) {
      console.warn("Server save failed", e);
    }
  }
}

// По умолчанию локальный провайдер, затем может переключиться
provider = new LocalStorageProvider();

async function isAuthedOnServer(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

// Позволяет выбрать провайдер вручную или автоматически
export async function selectStorageProvider(kind: StorageKind | "auto", ws?: Blockly.Workspace) {
  if (kind === "local") {
    provider = new LocalStorageProvider();
    if (ws) provider.load(ws);
    indicatorUpdater?.({ kind: provider.kind, lastSavedAt });
    return provider.kind;
  }
  if (kind === "server") {
    provider = new ServerStorageProvider();
    if (ws) await provider.load(ws);
    indicatorUpdater?.({ kind: provider.kind, lastSavedAt });
    return provider.kind;
  }
  // auto
  const authed = await isAuthedOnServer();
  if (authed) {
    provider = new ServerStorageProvider();
    if (ws) await provider.load(ws);
    indicatorUpdater?.({ kind: provider.kind, lastSavedAt });
    return provider.kind;
  } else {
    provider = new LocalStorageProvider();
    if (ws) provider.load(ws);
    indicatorUpdater?.({ kind: provider.kind, lastSavedAt });
    return provider.kind;
  }
}

// Инициализация приложения: выбираем хранилище и загружаем данные
export async function setupAppBootstrap(ws: Blockly.Workspace) {
  // Можно хранить предпочтение пользователя в localStorage
  const preferred = (window.localStorage?.getItem("storage_preference") as StorageKind | "auto") || "auto";
  await selectStorageProvider(preferred, ws);
}

// Дебаунс-обёртка для сохранения текущим провайдером
export function persistWorkspaceDebounced(ws: Blockly.Workspace, delayMs = 800) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    Promise.resolve(provider.save(ws))
      .then(() => {
        // Успешно сохранено — lastSavedAt уже обновляется внутри провайдера
        indicatorUpdater?.({ kind: provider.kind, lastSavedAt });
      })
      .catch((e) => console.warn("Persist failed", e));
  }, delayMs);
}

// Вспомогательная функция для смены провайдера в рантайме (например, после логина)
export async function switchStoragePreference(kind: StorageKind | "auto", ws: Blockly.Workspace) {
  window.localStorage?.setItem("storage_preference", kind);
  await selectStorageProvider(kind, ws);
}