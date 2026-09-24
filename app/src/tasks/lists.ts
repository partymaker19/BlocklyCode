// Задачи группы «lists»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText } from "./utils";
import type { TaskRegistry } from "./types";

async function validateListForEach(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expectedList = [1, 2, 3, 4, 5];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expectedList.length; start++) {
      let ok = true;
      for (let i = 0; i < expectedList.length; i++) {
        if (numericLines[start + i] !== expectedList[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasSum = lines.some((l) => /(^|\b)15(\b|$)/.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasPrint = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = hasSequence && hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedListCreate && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSublistForEach(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [3, 4, 5, 6, 7];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  let usedListCreate = false;
  let usedGetSublist = false;
  let usedForEach = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "lists_getSublist") usedGetSublist = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = hasSequence && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedListCreate && usedGetSublist && usedForEach;
    if (usedCore && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEven(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [2, 4, 6, 8, 10];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasSum = lines.some((l) => /(^|\b)30(\b|$)/.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasPrint = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSequence && hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedListCreate &&
      usedForEach &&
      usedIf &&
      usedEvenCheck &&
      (usedMathChange || usedArithmetic);
    if (usedCore && count <= 20) stars = 3;
    else if (count <= 28) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenMinMax(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [2, 4, 6, 8, 10];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasMin = lines.some((l) => /(^|\b)(min|минимум|мин)\s*[:=]?\s*2(\b|$)/i.test(l));
  const hasMax = lines.some((l) => /(^|\b)(max|максимум|макс)\s*[:=]?\s*10(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
    if (t === "math_on_list") {
      usedMathOnList = true;
      const mode =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
          : undefined;
      if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
      if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
    }
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSequence && hasMin && hasMax && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedIf && usedEvenCheck && usedMathOnList;
    if (usedCore && count <= 28) stars = 3;
    else if (count <= 40) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenAvg(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasCount = lines.some((l) => /(^|\b)count\s*[:=]?\s*5(\b|$)/i.test(l));
  const hasSum = lines.some((l) => /(^|\b)sum\s*[:=]?\s*30(\b|$)/i.test(l));
  const hasAvg = lines.some((l) => /(^|\b)avg\s*[:=]?\s*6(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasSetCount = false;
  let hasGetCount = false;
  let hasSetAvg = false;
  let hasGetAvg = false;

  let hasPrint = false;
  let usedMathChange = false;
  let usedArithmetic = false;
  let usedDivide = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;
    if (t === "variables_set" && (v === "count" || v === "cnt")) hasSetCount = true;
    if (t === "variables_get" && (v === "count" || v === "cnt")) hasGetCount = true;
    if (t === "variables_set" && (v === "avg" || v === "average" || v === "mean")) hasSetAvg = true;
    if (t === "variables_get" && (v === "avg" || v === "average" || v === "mean")) hasGetAvg = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") {
      usedArithmetic = true;
      const op =
        typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
      if (String(op).toUpperCase().includes("DIVIDE")) usedDivide = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasCount && hasSum && hasAvg && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedForEach && usedIf && usedEvenCheck && usedDivide && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 36) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenMedian(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasCount = lines.some((l) => /(^|\b)count\s*[:=]?\s*5(\b|$)/i.test(l));
  const hasMedian = lines.some((l) => /(^|\b)(median|медиана)\s*[:=]?\s*6(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedLength = false;
  let usedGetIndex = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "lists_length") usedLength = true;
    if (t === "lists_getIndex") usedGetIndex = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasCount && hasMedian && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedIf && usedEvenCheck && usedLength && usedGetIndex;
    if (usedCore && count <= 32) stars = 3;
    else if (count <= 44) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListSumEvenPositions(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasSum = lines.some((l) => /(^|\b)sum\s*[:=]?\s*19(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedFor = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedGetIndex = false;
  let hasPrint = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_for") usedFor = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "lists_getIndex") usedGetIndex = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedFor && usedIf && usedEvenCheck && usedGetIndex && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 38) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListSortMinMax(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasMin = lines.some((l) => /(^|\b)min\s*[:=]?\s*1(\b|$)/i.test(l));
  const hasMax = lines.some((l) => /(^|\b)max\s*[:=]?\s*9(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedSort = false;
  let usedGetIndex = false;
  let hasPrint = false;
  let hasSetList = false;
  let hasGetList = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "lists_sort") usedSort = true;
    if (t === "lists_getIndex") usedGetIndex = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
  }

  const ok = hasMin && hasMax && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedSort && usedGetIndex;
    if (usedCore && count <= 13) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

export const listsTasks: Pick<
  TaskRegistry,
  | "list_foreach"
  | "sublist_foreach"
  | "list_filter_even"
  | "list_filter_even_min_max"
  | "list_filter_even_avg"
  | "list_filter_even_median"
  | "list_sum_even_positions"
  | "list_sort_min_max"
> = {
  list_foreach: {
    id: "list_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 14: Список и цикл forEach" : "Task 14: List and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и сохраните его в переменную <strong>list</strong> (можно <strong>numbers</strong>).<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента k в списке»</strong> — это и есть <strong>forEach</strong>. Внутри цикла:<br>1) выведите текущий элемент (каждый с новой строки)<br>2) посчитайте сумму элементов в переменной <strong>sum</strong> и выведите сумму после цикла (должно получиться <strong>15</strong>).<br><br><strong>Важно:</strong> список может хранить не только числа, но и текст (строки), а иногда даже смешанные значения. А цикл <strong>forEach</strong> удобен именно для <strong>перебора элементов списка</strong>: он «идёт по списку» и даёт вам текущий элемент, в отличие от циклов <strong>for</strong> со счётчиком (когда вы управляете индексами/границами вручную) или <strong>while</strong> (когда повторяем, пока условие истинно)."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and store it in <strong>list</strong> (or <strong>numbers</strong>).<br><br>Then use the Loops block <strong>“for each item k in list”</strong> — this is the <strong>forEach</strong> idea. Inside the loop:<br>1) print the current item (one per line)<br>2) compute the sum in <strong>sum</strong> and print the final sum after the loop (it should be <strong>15</strong>).<br><br><strong>Note:</strong> a list can store not only numbers but also text (strings), and sometimes even mixed values. The <strong>forEach</strong> loop is great specifically for <strong>iterating over list elements</strong>: it walks through the list and gives you the current item, unlike a counter-based <strong>for</strong> (where you manage indexes/bounds) or <strong>while</strong> (repeat while a condition is true).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5» (блок из «Списки»).\n2. Создайте переменную sum = 0.\n3. В «Циклы» возьмите «для каждого элемента k в списке …».\n4. В поле списка вложите переменную list.\n5. Внутри цикла: «Добавить текст … цвет …» с k и «увеличить sum на k».\n6. После цикла выведите sum — должно получиться 15."
        : "Step by step:\n1. Create a variable list and assign “create list with 1 2 3 4 5” (a Lists block) to it.\n2. Create variable sum = 0.\n3. Take “for each item k in list …” from Loops.\n4. Put variable list into the list slot.\n5. Inside the loop: “Add text … color …” with k, and “change sum by k”.\n6. After the loop print sum — it should be 15.",
    validate: validateListForEach,
  },
  sublist_foreach: {
    id: "sublist_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 15: Подсписок и forEach" : "Task 15: Sublist and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем возьмите из него <strong>подсписок</strong> с элементами <strong>3, 4, 5, 6, 7</strong> (то есть часть списка) и сохраните в переменную <strong>sub</strong>.<br><br>Используйте блок <strong>«для каждого элемента k в списке»</strong> (Циклы), чтобы вывести элементы подсписка <strong>sub</strong> по одному (каждый с новой строки)."
        : "Create a list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then take a <strong>sublist</strong> containing <strong>3, 4, 5, 6, 7</strong> (a part of the list) and store it in <strong>sub</strong>.<br><br>Use the <strong>“for each item k in list”</strong> block (Loops) to print items of <strong>sub</strong> one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5 6 7 8 9 10» (блок из «Списки»).\n2. Возьмите блок «взять подсписок с № … по № …» из «Списки» — укажите с 3 по 7, а в поле списка вложите переменную list.\n3. Присвойте результат переменной sub.\n4. Возьмите «для каждого элемента k в списке …» из «Циклы», в поле списка вложите переменную sub.\n5. Внутри цикла выводите k через «Добавить текст … цвет …» — появятся 3 4 5 6 7."
        : "Step by step:\n1. Create a variable list and assign “create list with 1 2 3 4 5 6 7 8 9 10” (a Lists block) to it.\n2. Take the “get sub-list from # … to # …” block from Lists — set 3 to 7, and put list into the list slot.\n3. Assign the result to variable sub.\n4. Take “for each item k in list …” from Loops, put variable sub into the list slot.\n5. Inside the loop print k with “Add text … color …” — you get 3 4 5 6 7.",
    validate: validateSublistForEach,
  },
  list_filter_even: {
    id: "list_filter_even",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 16: Фильтрация списка" : "Task 16: List filtering"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента k в списке»</strong>, чтобы перебрать элементы. Внутри цикла с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа и:<br>1) выведите каждое чётное число (каждое с новой строки)<br>2) посчитайте сумму чётных чисел в переменной <strong>sum</strong><br><br>После цикла выведите сумму. Должны получиться числа: <strong>2 4 6 8 10</strong> и сумма <strong>30</strong>."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then use the Loops block <strong>“for each item k in list”</strong> to iterate. Inside the loop, use an <strong>if</strong> to keep only <strong>even</strong> numbers and:<br>1) print each even number (one per line)<br>2) compute the sum of even numbers in <strong>sum</strong><br><br>After the loop, print the sum. You should get: <strong>2 4 6 8 10</strong> and the sum <strong>30</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5 6 7 8 9 10», создайте sum = 0.\n2. Возьмите «для каждого элемента k в списке …» из «Циклы», в список вложите переменную list.\n3. Внутри цикла: блок «если» из «Логика».\n4. Условие чётности: «остаток от k ÷ 2» (Математика) равен 0 (Логика) — или блок «чётное?» из Математики.\n5. В ветку «если»: «Добавить текст … цвет …» с k и «увеличить sum на k».\n6. После цикла выведите sum — получится 30."
        : "Step by step:\n1. Create a variable list with “create list with 1 2 3 4 5 6 7 8 9 10”, and sum = 0.\n2. Take “for each item k in list …” from Loops, put variable list into it.\n3. Inside the loop: an “if” block from Logic.\n4. Even check: “remainder of k ÷ 2” (Math) equals 0 (Logic) — or the “is even” block from Math.\n5. In the if branch: “Add text … color …” with k, and “change sum by k”.\n6. After the loop print sum — it becomes 30.",
    validate: validateListFilterEven,
  },
  list_filter_even_min_max: {
    id: "list_filter_even_min_max",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 17: Min/Max среди чётных" : "Task 17: Min/Max among evens",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong> и выводите каждое чётное число (каждое с новой строки).<br><br>После цикла найдите и выведите:<br>— <strong>min=2</strong> (минимум среди чётных)<br>— <strong>max=10</strong> (максимум среди чётных)<br><br>Подсказка: используйте блок <strong>Математика → «сумма списка»</strong> и в выпадающем списке выберите MIN/MAX для списка evens."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add even numbers to a new list <strong>evens</strong> and print each even number (one per line).<br><br>After the loop, find and print:<br>— <strong>min=2</strong> (minimum among evens)<br>— <strong>max=10</strong> (maximum among evens)<br><br>Hint: use <strong>Math → “math on list”</strong> with MIN/MAX on the evens list.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10 и пустой список evens: «создать список из» (Списки) без элементов.\n2. «для каждого элемента k в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности k (остаток от k ÷ 2 равен 0 или «чётное?»).\n4. В ветку «если»: выведите k и блок «вставить в конец»: возьмите его из «Списки» (блок «вставить в …»), в поле списка — evens, а значением — k.\n5. После цикла: из «Математика» возьмите «сумма списка», в выпадающем списке выберите «наименьшее в списке», вложите evens и выведите как min=2.\n6. Вторым блоком выберите «наибольшее в списке» и выведите как max=10."
        : "Step by step:\n1. Create a variable list with 1..10 and an empty list evens: use “create list with” (Lists) with no items.\n2. “for each item k in list …” over the list variable.\n3. Inside: an “if” with the even check for k (remainder of k ÷ 2 equals 0 or “is even”).\n4. In the if branch: print k and add k to the end of evens (Lists → insert block, list slot = evens, value = k).\n5. After the loop: take “math on list” from Math, pick “minimum of list” in the dropdown, put evens in, and print it as min=2.\n6. Second block: pick “maximum of list” and print it as max=10.",
    validate: validateListFilterEvenMinMax,
  },
  list_filter_even_avg: {
    id: "list_filter_even_avg",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 18: Количество и среднее" : "Task 18: Count and average",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Для чётных чисел нужно посчитать:<br>— <strong>sum</strong> (сумма чётных)<br>— <strong>count</strong> (сколько чётных чисел)<br>— <strong>avg</strong> (среднее): <code>avg = sum / count</code><br><br>Выведите результат тремя строками:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>"
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. For even numbers compute:<br>— <strong>sum</strong> (sum of evens)<br>— <strong>count</strong> (how many evens)<br>— <strong>avg</strong> (average): <code>avg = sum / count</code><br><br>Print three lines:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10, переменные sum = 0 и count = 0.\n2. «для каждого элемента k в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности k (остаток от k ÷ 2 равен 0).\n4. В ветку «если»: «увеличить sum на k» и «увеличить count на 1».\n5. После цикла: переменная avg = sum ÷ count (блок «+ − × ÷» из «Математика», операция ÷).\n6. Выведите три строки: «Добавить текст … цвет …» с результатами count=5, sum=30, avg=6."
        : "Step by step:\n1. Create a variable list with 1..10, and variables sum = 0, count = 0.\n2. “for each item k in list …” over the list variable.\n3. Inside: an “if” with the even check for k (remainder of k ÷ 2 equals 0).\n4. In the if branch: “change sum by k” and “change count by 1”.\n5. After the loop: variable avg = sum ÷ count (a “+ − × ÷” block from Math with ÷).\n6. Print three lines with “Add text … color …”: count=5, sum=30, avg=6.",
    validate: validateListFilterEvenAvg,
  },
  list_filter_even_median: {
    id: "list_filter_even_median",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 19: Средний элемент чётных" : "Task 19: Middle even element",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong>.<br><br>После цикла выведите 2 строки:<br><strong>count=5</strong> (сколько чётных чисел в evens)<br><strong>median=6</strong> (средний элемент списка evens — для 5 элементов это 3‑й)."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate with <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add evens into a new list <strong>evens</strong>.<br><br>After the loop print 2 lines:<br><strong>count=5</strong> (how many evens in evens)<br><strong>median=6</strong> (the middle element of evens — for 5 elements it's the 3rd).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10 и пустой список evens («создать список из» без элементов).\n2. «для каждого элемента k в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности k.\n4. В ветку «если»: вставьте k в конец evens (Списки → «вставить в» с полем evens и значением k).\n5. После цикла: count — блок «длина evens» (Списки). Выведите count=5.\n6. Средний элемент: блок «взять № …» (Списки) с индексом 3 в evens — это 6. Выведите median=6."
        : "Step by step:\n1. Create a variable list with 1..10 and an empty list evens (“create list with” with no items).\n2. “for each item k in list …” over the list variable.\n3. Inside: an “if” with the even check for k.\n4. In the if branch: insert k at the end of evens (Lists → “insert into” with evens and value k).\n5. After the loop: count — the “length of evens” block (Lists). Print count=5.\n6. Middle element: “get item # …” (Lists) with index 3 in evens — that is 6. Print median=6.",
    validate: validateListFilterEvenMedian,
  },
  list_sum_even_positions: {
    id: "list_sum_even_positions",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 20: Сумма на чётных позициях" : "Task 20: Sum at even positions",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Посчитайте сумму элементов на <strong>чётных позициях</strong> (позиции считаем как 1‑я, 2‑я, 3‑я…). То есть нужно сложить элементы на позициях <strong>2, 4, 6, 8, 10</strong>.<br><br>Выведите результат строкой: <strong>sum=19</strong>"
        : "Create the list <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> and store it in <strong>list</strong>.<br><br>Compute the sum of elements at <strong>even positions</strong> (positions are 1st, 2nd, 3rd…). That means add elements at positions <strong>2, 4, 6, 8, 10</strong>.<br><br>Print: <strong>sum=19</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 10 1 8 2 7 3 6 4 5 9», создайте sum = 0.\n2. Возьмите «цикл по i от … до … с шагом …» из «Циклы» (от 1 до 10, шаг 1).\n3. Внутри: «если» с проверкой «i чётное» (блок «остаток от i ÷ 2» из «Математика» равен 0 из «Логика» или блок «чётное?»).\n4. В ветку «если»: возьмите элемент — «№ …» (Списки) с номером i в списке list, и прибавьте к sum («увеличить sum на …»).\n5. После цикла выведите «Добавить текст … цвет …» результат — получится sum=19."
        : "Step by step:\n1. Create a variable list with “create list with 10 1 8 2 7 3 6 4 5 9”, and sum = 0.\n2. Take “count with i from … to … by …” from Loops (1 to 10, step 1).\n3. Inside: an “if” checking “i is even” (remainder of i ÷ 2 from Math equals 0 from Logic, or the “is even” block).\n4. In the if branch: get the element — “item # …” (Lists) with number i in list, and add it to sum (“change sum by …”).\n5. After the loop print the result with “Add text … color …” — it becomes sum=19.",
    validate: validateListSumEvenPositions,
  },
  list_sort_min_max: {
    id: "list_sort_min_max",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 21: Сортировка списка" : "Task 21: List sorting"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[9, 3, 7, 1, 5]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Отсортируйте список блоком <strong>«сортировать числовая по возрастанию»</strong>. После сортировки выведите две строки:<br><strong>min=1</strong><br><strong>max=9</strong>.<br><br><strong>Что значит слово sort:</strong> <code>sort</code> переводится как «сортировать». В программировании это значит «упорядочить элементы по правилу». Для сортировки по возрастанию список <code>[9, 3, 7, 1, 5]</code> превращается в <code>[1, 3, 5, 7, 9]</code>."
        : "Create the list <code>[9, 3, 7, 1, 5]</code> and store it in <strong>list</strong>.<br><br>Sort it using the block <strong>“sort numeric ascending”</strong>. After sorting, print two lines:<br><strong>min=1</strong><br><strong>max=9</strong>.<br><br><strong>What sort means:</strong> <code>sort</code> means “to order items by a rule”. With ascending order, <code>[9, 3, 7, 1, 5]</code> becomes <code>[1, 3, 5, 7, 9]</code>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 9 3 7 1 5» (блок из «Списки»).\n2. В «Списки» возьмите блок «сортировать числовая по возрастанию», в его поле вложите переменную list, результат присвойте переменной sorted.\n3. В «Списки» возьмите блок «№ …» (взять элемент), в поле списка — sorted, номер 1. Это min.\n4. Для max в том же блоке выберите «№ с конца» и укажите 1 — это 9.\n5. Выведите две строки через «Добавить текст … цвет …»: min=1 и max=9."
        : "Step by step:\n1. Create a variable list with “create list with 9 3 7 1 5” (a Lists block).\n2. In Lists take “sort numeric ascending”, put variable list inside, and assign the result to variable sorted.\n3. Take “get item # 1” (Lists) with sorted as the list — that's min.\n4. For max use “get item # 1 from end” on sorted.\n5. Print two lines with “Add text … color …”: min=1 and max=9.",
    validate: validateListSortMinMax,
  },
};
