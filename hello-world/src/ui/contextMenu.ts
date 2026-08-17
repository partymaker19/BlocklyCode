/**
 * Контекстные меню для блоков Blockly.
 * Регистрация пунктов меню правого клика (custom blocks + стандартные блоки).
 */

import * as Blockly from "blockly/core";
import { getAppLang } from "../localization";
import {
  getCustomBlocks,
  removeCustomBlock,
  registerCustomBlocks,
} from "../customBlocks";

// Типы для окружения контекстного меню
type ContextMenuScope = { block?: Blockly.Block };

// Флаги, чтобы не регистрировать пункты дважды
let customBlockContextRegistered = false;
let standardBlockContextRegistered = false;

/**
 * Регистрирует контекстное меню для удаления пользовательского блока.
 * @param onRefresh  Callback для обновления workspace после удаления
 */
export function registerCustomBlockContextMenu(options: {
  onRefresh?: () => void;
}): void {
  if (customBlockContextRegistered) return;

  const registry = (Blockly as any).ContextMenuRegistry?.registry as any;
  if (!registry) return;

  const ITEM_ID = "delete_custom_block_from_my_blocks";
  if (registry.getItem && registry.getItem(ITEM_ID)) {
    customBlockContextRegistered = true;
    return;
  }

  const displayText = () => {
    const lang = getAppLang();
    return lang === "ru" ? "Удалить из «Моих блоков»" : "Remove from My Blocks";
  };

  const item = {
    id: ITEM_ID,
    displayText,
    preconditionFn: (scope: ContextMenuScope | undefined) => {
      const block = scope?.block;
      if (!block) return "hidden";
      try {
        const custom = getCustomBlocks();
        return custom.some((b) => b.definition?.type === block.type)
          ? "enabled"
          : "hidden";
      } catch {
        return "hidden";
      }
    },
    callback: (scope: ContextMenuScope | undefined) => {
      const block = scope?.block;
      if (!block) return;
      const type = block.type;
      const lang = getAppLang();
      const name = type;
      const question =
        lang === "ru"
          ? `Удалить пользовательский блок «${name}» из раздела «Моих блоки»?\nЭкземпляры на рабочем поле не будут удалены.`
          : `Remove custom block "${name}" from "My Blocks"?\nInstances already on the workspace will not be removed.`;
      if (!confirm(question)) return;

      if (removeCustomBlock(type)) {
        registerCustomBlocks();
        options.onRefresh?.();
        const out = document.getElementById("output");
        if (out) {
          const p = document.createElement("p");
          p.textContent =
            lang === "ru" ? `Удалён блок: ${type}` : `Removed block: ${type}`;
          (out as HTMLElement).appendChild(p);
        }
      } else {
        alert(
          lang === "ru"
            ? "Не удалось удалить блок."
            : "Failed to remove block.",
        );
      }
    },
    scopeType: (Blockly as any).ContextMenuRegistry.ScopeType.BLOCK,
    weight: 200,
  } as any;

  try {
    registry.register(item);
    customBlockContextRegistered = true;
  } catch (e) {
    customBlockContextRegistered = true;
  }
}

/**
 * Регистрирует стандартные контекстные меню для блоков:
 * вставка рядом, развернуть, включить, удалить комментарий, встроенные/внешние входы.
 */
export function registerStandardBlockContextMenus(): void {
  if (standardBlockContextRegistered) return;

  const registry = (Blockly as any).ContextMenuRegistry?.registry as any;
  if (!registry) return;
  const scopeType = (Blockly as any).ContextMenuRegistry.ScopeType.BLOCK;

  const makeItem = (
    id: string,
    displayText: () => string,
    preconditionFn: (scope: ContextMenuScope) => "enabled" | "disabled" | "hidden",
    callback: (scope: ContextMenuScope) => void,
    weight = 195,
  ) => ({ id, displayText, preconditionFn, callback, scopeType, weight });

  const t = () => getAppLang() === "ru";
  const text = {
    paste: () => (t() ? "Вставить" : "Paste"),
    expand: () => (t() ? "Развернуть блок" : "Expand block"),
    enable: () => (t() ? "Включить блок" : "Enable block"),
    removeComment: () => (t() ? "Удалить комментарий" : "Remove comment"),
    inline: () => (t() ? "Встроить входы" : "Inline inputs"),
    external: () => (t() ? "Внешние входы" : "External inputs"),
  };

  const hasItem = (id: string) => registry.getItem && registry.getItem(id);

  // Вставить рядом с блоком
  if (!hasItem("custom_paste_near_block")) {
    registry.register(
      makeItem(
        "custom_paste_near_block",
        text.paste,
        (scope) => {
          const data = (Blockly as any).clipboard?.getLastCopiedData?.();
          return data ? "enabled" : "disabled";
        },
        (scope) => {
          const block: any = scope.block;
          if (!block) return;
          try {
            const data = (Blockly as any).clipboard.getLastCopiedData();
            const ws =
              (Blockly as any).clipboard.getLastCopiedWorkspace?.() ||
              block.workspace;
            let p = block.getRelativeToSurfaceXY?.();
            p =
              p && typeof p.clone === "function"
                ? p.clone()
                : new (Blockly as any).utils.Coordinate(0, 0);
            p.translate?.(24, 24);
            (Blockly as any).clipboard.paste(data, ws, p);
          } catch {
            try {
              (Blockly as any).clipboard.paste();
            } catch {}
          }
        },
      ),
    );
  }

  // Развернуть блок
  if (!hasItem("custom_expand_block")) {
    registry.register(
      makeItem(
        "custom_expand_block",
        text.expand,
        (scope) => {
          const b: any = scope.block;
          if (!b) return "hidden";
          return !!b.workspace?.options?.collapse &&
            !!b.isMovable?.() &&
            !!b.isCollapsed?.()
            ? "enabled"
            : "hidden";
        },
        (scope) => {
          const b: any = scope.block;
          b?.setCollapsed?.(false);
        },
      ),
    );
  }

  // Включить блок
  if (!hasItem("custom_enable_block")) {
    registry.register(
      makeItem(
        "custom_enable_block",
        text.enable,
        (scope) => {
          const b: any = scope.block;
          if (!b) return "hidden";
          const isEnabled =
            typeof b.isEnabled === "function" ? b.isEnabled() : true;
          return !isEnabled && !!b.isEditable?.() ? "enabled" : "hidden";
        },
        (scope) => {
          const b: any = scope.block;
          try {
            const reason =
              (Blockly as any).constants?.MANUALLY_DISABLED ||
              "MANUALLY_DISABLED";
            b?.setDisabledReason?.(false, reason);
          } catch {
            b?.setDisabled?.(false);
          }
        },
      ),
    );
  }

  // Удалить комментарий
  if (!hasItem("custom_remove_comment")) {
    registry.register(
      makeItem(
        "custom_remove_comment",
        text.removeComment,
        (scope) => {
          const b: any = scope.block;
          if (!b) return "hidden";
          const hasText = !!(
            typeof b.getCommentText === "function" && b.getCommentText()
          );
          return hasText ? "enabled" : "hidden";
        },
        (scope) => {
          const b: any = scope.block;
          b?.setCommentText?.(null);
        },
      ),
    );
  }

  // Встроить входы
  if (!hasItem("custom_inline_inputs")) {
    registry.register(
      makeItem(
        "custom_inline_inputs",
        text.inline,
        (scope) => {
          const b: any = scope.block;
          if (!b) return "hidden";
          const multiple = !!(
            b.inputList &&
            b.inputList.length > 1 &&
            !b.isCollapsed?.()
          );
          return multiple && !b.getInputsInline?.() ? "enabled" : "hidden";
        },
        (scope) => {
          const b: any = scope.block;
          b?.setInputsInline?.(true);
        },
      ),
    );
  }

  // Внешние входы
  if (!hasItem("custom_external_inputs")) {
    registry.register(
      makeItem(
        "custom_external_inputs",
        text.external,
        (scope) => {
          const b: any = scope.block;
          if (!b) return "hidden";
          const multiple = !!(
            b.inputList &&
            b.inputList.length > 1 &&
            !b.isCollapsed?.()
          );
          return multiple && !!b.getInputsInline?.() ? "enabled" : "hidden";
        },
        (scope) => {
          const b: any = scope.block;
          b?.setInputsInline?.(false);
        },
      ),
    );
  }

  standardBlockContextRegistered = true;
}
