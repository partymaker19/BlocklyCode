/**
 * Общая часть генераторов блока «создать текст из» (text_join).
 *
 * Штатные генераторы Blockly склеивают строки «взрослыми» приёмами:
 * `['a', b].join('')` в JavaScript, `''.join([str(x) for x in [...]])` в
 * Python, `table.concat({...})` в Lua. Мы переопределяем блок во всех
 * четырёх генераторах на обычный оператор склейки, поэтому каждому нужен
 * один и тот же список частей — и признак того, что часть уже является
 * строковым литералом (её не надо оборачивать в приведение к строке).
 */
import type * as Blockly from "blockly/core";

/** Одна часть склейки: код выражения и флаг строкового литерала. */
export type JoinPart = { code: string; isLiteral: boolean };

const LITERAL_BLOCK_TYPES = new Set(["text", "text_multiline"]);

/**
 * Собирает значения входов ADD0…ADDn блока text_join.
 *
 * @param block Блок text_join.
 * @param generator Генератор целевого языка.
 * @param order Приоритет, с которым запрашиваются вложенные выражения.
 * @returns Части склейки в порядке полей блока.
 */
export function collectJoinParts(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
  order: number,
): JoinPart[] {
  const itemCount = Number((block as any).itemCount_ ?? 0);
  const parts: JoinPart[] = [];
  for (let i = 0; i < itemCount; i++) {
    const name = `ADD${i}`;
    const target = block.inputList
      .find((input) => input.name === name)
      ?.connection?.targetBlock();
    parts.push({
      code: generator.valueToCode(block, name, order) || "''",
      isLiteral: Boolean(target && LITERAL_BLOCK_TYPES.has(target.type)),
    });
  }
  return parts;
}
