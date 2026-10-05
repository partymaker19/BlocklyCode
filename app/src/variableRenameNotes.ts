/**
 * Пояснения к переименованным переменным в панели кода.
 *
 * Blockly строит имена идентификаторов по правилам целевого языка: если имя
 * ученика совпадает со служебным словом языка (`name` в JavaScript) или с
 * другой сущностью (`total`, если есть функция с таким именем), генератор
 * добавляет цифру — `name2`. Без пояснения ученик видит в коде переменную,
 * которой он не создавал.
 */
import type * as Blockly from "blockly/core";
import type { SupportedLanguage } from "./types/messages";
import { getAppLang, getAceUIStrings } from "./localization";

/** Символ комментария для языка панели кода. */
const COMMENT_TOKENS: Record<SupportedLanguage, string> = {
  javascript: "//",
  typescript: "//",
  python: "#",
  lua: "--",
  php: "//",
};

/** Название языка в тексте пояснения. */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  lua: "Lua",
  php: "PHP",
};

const TRAILING_DIGITS = /\d+$/;

/**
 * Нужная нам часть Blockly.Names. Оба поля защищены в Blockly, поэтому
 * читаются через приведение: `db` хранит соответствие «имя ученика → имя в
 * коде» (ключ — имя в нижнем регистре, значение — имя без префикса языка),
 * `reservedWords` — служебные слова целевого языка.
 */
type NameDB = {
  db?: Map<string, Map<string, string>>;
  reservedWords?: Set<string>;
};

/**
 * Минимальный интерфейс генератора, нужный для пояснений: Blockly объявляет
 * `nameDB_` защищённым, поэтому база имён читается через приведение внутри
 * модуля.
 */
export type RenameNoteGenerator = {
  init?: (workspace: Blockly.Workspace) => void;
};

/** Внутреннее представление Blockly.Names. */
type NameDBHost = {
  nameDB_?: NameDB;
};

const VARIABLE_NAME_TYPE = "VARIABLE";

/**
 * Возвращает переименования: имя ученика, имя в коде и признак того, что
 * причина — служебное слово языка.
 */
function collectRenames(
  workspace: Blockly.Workspace,
  generator: RenameNoteGenerator,
): { original: string; generated: string; reserved: boolean }[] {
  // Генератор очищает базу имён в finish(), поэтому перед чтением её нужно
  // восстановить: init() делает ровно то же, что и начало workspaceToCode().
  generator.init?.(workspace);
  const nameDB = (generator as NameDBHost).nameDB_;
  const names = nameDB?.db?.get(VARIABLE_NAME_TYPE);
  if (!nameDB || !names) return [];
  const renames: { original: string; generated: string; reserved: boolean }[] =
    [];
  for (const variable of workspace.getVariableMap().getAllVariables()) {
    const original = variable.getName();
    const generated = names.get(original.toLowerCase());
    if (!generated || generated === original) continue;
    // Цифра на конце — единственный случай, который стоит объяснять:
    // кириллицу и пробелы Blockly транслитерирует полностью, и это другая тема.
    const digits = TRAILING_DIGITS.exec(generated);
    if (!digits) continue;
    const reserved = Boolean(
      nameDB.reservedWords?.has?.(generated.slice(0, digits.index)),
    );
    renames.push({ original, generated, reserved });
  }
  return renames;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Вставляет над объявлением переменной комментарий о том, почему Blockly
 * изменил её имя. Строки вставки собираются снизу вверх, чтобы индексы строк
 * не съезжали.
 *
 * @param code Сгенерированный код.
 * @param workspace Рабочая область, из которой получен код.
 * @param generator Генератор того же языка.
 * @param language Язык панели кода.
 * @returns Код с пояснениями либо без изменений, если переименований нет.
 */
export function annotateRenamedVariables(
  code: string,
  workspace: Blockly.Workspace,
  generator: RenameNoteGenerator,
  language: SupportedLanguage,
): string {
  const renames = collectRenames(workspace, generator);
  if (!renames.length || !code) return code;

  const strings = getAceUIStrings(getAppLang());
  const token = COMMENT_TOKENS[language];
  const languageName = LANGUAGE_NAMES[language];
  const lines = code.split("\n");
  const notes: { line: number; text: string }[] = [];
  for (const rename of renames) {
    // В PHP идентификаторы с префиксом $.
    const identifier =
      language === "php" ? `$${rename.generated}` : rename.generated;
    const search = new RegExp(
      `(^|[^\\w$])${escapeRegExp(identifier)}(?![\\w$])`,
    );
    const line = lines.findIndex((row) => search.test(row));
    if (line === -1) continue;
    const text = rename.reserved
      ? strings.renameNoteReserved(
          rename.original,
          rename.generated,
          languageName,
        )
      : strings.renameNoteCollision(
          rename.original,
          rename.generated,
          languageName,
        );
    notes.push({ line, text });
  }

  for (const note of notes.sort((a, b) => b.line - a.line)) {
    const indent = /^[\t ]*/.exec(lines[note.line])?.[0] ?? "";
    lines.splice(note.line, 0, `${indent}${token} ${note.text}`);
  }
  return lines.join("\n");
}
