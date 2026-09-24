// Задачи группы «loops»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText, tryGetAssignedNumber, escapeRe } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateFirstLoop(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isInteger(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = Array.from({ length: 11 }, (_, i) => i);

  const ok = (() => {
    if (numericLines.length < expected.length) return false;
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let matches = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  })();

  const tryGetInputNumber = (block: any, inputName: string): number | null => {
    try {
      const target =
        typeof block?.getInputTargetBlock === "function"
          ? block.getInputTargetBlock(inputName)
          : null;
      if (!target) return null;
      if ((target as any).type !== "math_number") return null;
      const raw =
        typeof (target as any).getFieldValue === "function"
          ? (target as any).getFieldValue("NUM")
          : undefined;
      if (raw === undefined || raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };

  let usedFor = false;
  let forFromOk = false;
  let forToOk = false;
  let forByOk = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_for") {
      usedFor = true;
      try {
        const from = tryGetInputNumber(b, "FROM");
        const to = tryGetInputNumber(b, "TO");
        const by = tryGetInputNumber(b, "BY");
        if (from === 0) forFromOk = true;
        if (to === 10) forToOk = true;
        if (by === 1) forByOk = true;
      } catch {}
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedFor && hasPrint && forFromOk && forToOk && forByOk;
    if (usedCore && count <= 8) stars = 3;
    else if (usedFor && hasPrint && count <= 12) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSum1ToN(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let n: number | null = null;
  let hasSetN = false;
  let hasGetN = false;
  let hasPrint = false;

  let usedFor = false;
  let usedAccumulator = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetN = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get") hasGetN = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_for") usedFor = true;

    if (t === "variables_set" && getVarFieldText(b) === "sum") usedAccumulator = true;
    if (t === "variables_set" && getVarFieldText(b) === "total") usedAccumulator = true;
  }

  const expected = (() => {
    if (n === null) return null;
    if (n < 1) return null;
    return (n * (n + 1)) / 2;
  })();

  const ok = (() => {
    if (blocks.length === 0) {
      return lines.some((l) => /\d/.test(l));
    }
    if (!hasSetN || !hasGetN || !hasPrint) return false;
    if (expected === null) return false;
    const re = new RegExp(`(^|\\b)${escapeRe(String(expected))}(\\b|$)`);
    return lines.some((l) => re.test(l));
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedFor && usedAccumulator;
    if (usedCore && count <= 14) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateGuessGame(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );

  const blocks = getNonShadowBlocks(ws);

  let hasSetSecret = false;
  let hasGetSecret = false;
  let hasSetGuess = false;
  let hasGetGuess = false;
  let usedInputNumber = false;
  let usedWhile = false;
  let usedIf = false;
  let usedElseIf = false;
  let usedElse = false;
  let usedCompare = false;
  let hasEq = false;
  let hasLt = false;
  let hasGt = false;
  let hasNeq = false;
  let hasPrint = false;

  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetSecret = true;
      hasSetGuess = true;
    }
    if (t === "variables_get") {
      hasGetSecret = true;
      hasGetGuess = true;
    }

    if (t === "py_input_number") usedInputNumber = true;
    if (t === "controls_whileUntil") usedWhile = true;
    if (t === "controls_if") {
      usedIf = true;
      try {
        if (typeof (b as any).getInput === "function") {
          let elseIfCount = 0;
          for (let i = 1; i < 10; i++) {
            if ((b as any).getInput(`IF${i}`)) elseIfCount += 1;
            else break;
          }
          if (elseIfCount >= 1) usedElseIf = true;
          if ((b as any).getInput("ELSE")) usedElse = true;
        }
      } catch {}
    }
    if (t === "logic_compare") {
      usedCompare = true;
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "EQ") hasEq = true;
        if (op === "LT") hasLt = true;
        if (op === "GT") hasGt = true;
        if (op === "NEQ") hasNeq = true;
      } catch {}
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const hasFeedbackText = (() => {
    const ruHigher = normalized.some((l) => l.includes("загаданное число больше"));
    const ruLower = normalized.some((l) => l.includes("загаданное число меньше"));
    const ruCongrats = normalized.some((l) => l.includes("поздравляем"));
    const enHigher = normalized.some((l) => l.includes("higher"));
    const enLower = normalized.some((l) => l.includes("lower"));
    const enCongrats = normalized.some((l) => l.includes("congrat"));
    return ruHigher || ruLower || ruCongrats || enHigher || enLower || enCongrats;
  })();

  const ok =
    blocks.length === 0
      ? hasPrint && hasFeedbackText
      : hasPrint &&
        usedIf &&
        usedCompare &&
        hasPrint &&
        (hasFeedbackText || (hasGetSecret && hasGetGuess));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedWhile && usedIf && usedElseIf && usedElse && usedInputNumber && hasEq && hasLt && hasGt;
    if (usedCore && count <= 26) stars = 3;
    else if (usedWhile && usedIf && usedCompare && count <= 34) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateMultTable(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);

  const rowRe = /^(\d+)\s*[×*xх]\s*(\d+)\s*=\s*(\d+)$/;

  let validRows = 0;
  for (const l of lines) {
    const m = l.match(rowRe);
    if (m) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      const z = Number(m[3]);
      if (x * y === z) validRows++;
    }
  }

  const hasRow = (a: number, b: number) =>
    lines.some((l) => {
      const m = l.match(rowRe);
      if (!m) return false;
      return Number(m[1]) === a && Number(m[2]) === b && Number(m[3]) === a * b;
    });

  // Полная таблица 1..5 — это 25 строк; требуем почти все и ключевые примеры
  const ok = validRows >= 20 && hasRow(2, 3) && hasRow(4, 5) && hasRow(5, 5);

  const tryGetInputNumber = (block: any, inputName: string): number | null => {
    try {
      const target =
        typeof block?.getInputTargetBlock === "function"
          ? block.getInputTargetBlock(inputName)
          : null;
      if (!target) return null;
      if ((target as any).type !== "math_number") return null;
      const raw =
        typeof (target as any).getFieldValue === "function"
          ? (target as any).getFieldValue("NUM")
          : undefined;
      if (raw === undefined || raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };

  let usedFor = 0;
  let nestedFor = false;
  let forFromOk = false;
  let forToOk = false;
  let forByOk = false;
  let usedMultiply = false;
  let usedJoin = false;
  let usedPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_for") {
      usedFor++;
      let p = typeof b.getParent === "function" ? b.getParent() : null;
      while (p) {
        if ((p as any).type === "controls_for") {
          nestedFor = true;
          break;
        }
        p = typeof p.getParent === "function" ? p.getParent() : null;
      }
      try {
        const from = tryGetInputNumber(b, "FROM");
        const to = tryGetInputNumber(b, "TO");
        const by = tryGetInputNumber(b, "BY");
        if (from === 1) forFromOk = true;
        if (to === 5) forToOk = true;
        if (by === 1) forByOk = true;
      } catch {}
    }
    if (t === "math_arithmetic") {
      const op =
        typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
      if (op === "MULTIPLY") usedMultiply = true;
    }
    if (t === "text_join") usedJoin = true;
    if (t === "text_print" || t === "add_text") usedPrint = true;
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      nestedFor && usedMultiply && usedJoin && usedPrint && forFromOk && forToOk && forByOk;
    if (usedCore && count <= 20) stars = 3;
    else if (nestedFor && usedMultiply && usedJoin && usedPrint && count <= 28) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateFirstEvenBreak(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);

  // Задача требует вывести ровно одно число — первое чётное (8).
  // Если цикл не прерван, в вывод попадут и последующие чётные (2) — это не ок.
  const numericLines = lines.map((l) => Number(l)).filter((n) => Number.isFinite(n));
  const ok = numericLines.length === 1 && numericLines[0] === 8;

  let usedLoop = false;
  let usedIf = false;
  let usedBreak = false;
  let usedEvenCheck = false;
  let usedModulo = false;
  let usedCompare = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (
      t === "controls_forEach" ||
      t === "controls_for" ||
      t === "controls_repeat" ||
      t === "controls_whileUntil"
    ) {
      usedLoop = true;
    }
    if (t === "controls_if") usedIf = true;
    if (t === "controls_flow_statements") {
      const op =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("FLOW")
          : undefined;
      if (String(op).toUpperCase() === "BREAK") usedBreak = true;
    }
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedEvenCheck = true;
    }
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const evenCheck = usedEvenCheck || (usedModulo && usedCompare);
  const usedCore = usedLoop && usedIf && evenCheck && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    // Минимальное решение ~16 блоков (6 чисел списка тоже считаются)
    if (usedCore && usedBreak && count <= 17) stars = 3;
    else if (usedCore && count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

export const loopsTasks: Pick<
  TaskRegistry,
  "first_loop" | "sum_1_to_n" | "guess_game" | "mult_table" | "first_even_break"
> = {
  first_loop: {
    id: "first_loop",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 11: Первый цикл" : "Task 11: First Loop"),
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая выводит в консоль все числа от <strong>0</strong> до <strong>10</strong> (включительно), каждое число с новой строки."
        : "Write a program that prints all numbers from <strong>0</strong> to <strong>10</strong> (inclusive), one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Циклы» возьмите блок «цикл по i от … до … с шагом …».\n2. Впишите границы: от 0 до 10, шаг 1.\n3. Внутрь цикла вложите «Добавить текст … цвет …» и перетащите в него переменную i из «Переменные».\n4. Запустите код — в выводе появятся числа от 0 до 10 (каждое с новой строки). Нажмите «Проверить решение»."
        : "Step by step:\n1. In the Loops category take the “count with i from … to … by …” block.\n2. Set the bounds: from 0 to 10, step 1.\n3. Put “Add text … color …” inside the loop and drag the variable i from Variables into it.\n4. Run the code — the numbers 0 through 10 appear in the output. Press “Check solution”.",
    validate: validateFirstLoop,
  },
  sum_1_to_n: {
    id: "sum_1_to_n",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 12: Сумма чисел" : "Task 12: Sum of Numbers"),
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая вычисляет сумму всех целых чисел от <strong>1</strong> до <strong>N</strong>, где <strong>N</strong> сохранено в переменной <strong>n</strong>.<br><br>Пример: при <strong>n = 5</strong> нужно вывести <strong>15</strong>, при <strong>n = 10</strong> — <strong>55</strong>."
        : "Write a program that computes the sum of all integers from <strong>1</strong> to <strong>N</strong>, where <strong>N</strong> is stored in the variable <strong>n</strong>.<br><br>Example: for <strong>n = 5</strong> print <strong>15</strong>, for <strong>n = 10</strong> print <strong>55</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную n и присвойте ей число (например, 5 или 10).\n2. Создайте переменную-аккумулятор sum и присвойте ей 0.\n3. Возьмите блок «цикл по i от … до … с шагом …», впишите от 1 до n, шаг 1.\n4. Внутри цикла вложите «увеличить sum на i» (блок «увеличить … на …» из «Математика» с переменной i в качестве приращения).\n5. После цикла вложите sum в «Добавить текст … цвет …»: при n=5 получится 15, при n=10 — 55."
        : "Step by step:\n1. Create a variable n and set it to a number (e.g. 5 or 10).\n2. Create an accumulator variable sum and set it to 0.\n3. Take the “count with i from … to … by …” loop, from 1 to n, step 1.\n4. Inside the loop put “change sum by i” (the “change … by …” block from Math with variable i as the delta).\n5. After the loop put sum into “Add text … color …”: n=5 gives 15, n=10 gives 55.",
    validate: validateSum1ToN,
  },
  guess_game: {
    id: "guess_game",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 13: Игра «Угадай число»" : "Task 13: Number Guessing Game",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте программу, в которой компьютер <strong>загадывает</strong> число от <strong>1</strong> до <strong>10</strong> (сохраните его в переменной <strong>secret</strong>), а пользователь пытается его угадать.<br><br>Используйте переменную <strong>guess</strong> для догадки. В цикле спрашивайте число у пользователя и сообщайте:<br>— если догадка меньше секрета: <strong>"Загаданное число больше!"</strong><br>— если догадка больше секрета: <strong>"Загаданное число меньше!"</strong><br>— если равно: <strong>"Поздравляем! Вы угадали число!"</strong>.'
        : 'Create a program where the computer chooses a number from <strong>1</strong> to <strong>10</strong> (store it in <strong>secret</strong>), and the user tries to guess it.<br><br>Use <strong>guess</strong> for the user\'s guess. In a loop, ask for a number and print:<br>— if guess is lower: <strong>"The secret number is higher!"</strong><br>— if guess is higher: <strong>"The secret number is lower!"</strong><br>— if equal: <strong>"Congratulations! You guessed the number!"</strong><br><br>Use the <strong>py_input_number</strong> block (Text) for input.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную secret и присвойте ей число от 1 до 10.\n2. Создайте переменную guess. Используйте блок «Ввод числа» из «Текст», чтобы спросить число у пользователя, и присвойте результат guess.\n3. Возьмите блок «повторять, пока …» из «Циклы» с условием «guess ≠ secret».\n4. Внутри цикла: блок «если / иначе если / иначе» (шестерёнка → добавить секции) — если guess < secret вывести «Загаданное число больше!», если guess > secret — «Загаданное число меньше!», иначе — «Поздравляем! Вы угадали число!».\n5. В ветках «меньше/больше» запрашивайте новую догадку через «Ввод числа»."
        : "Step by step:\n1. Create variable secret and set it to a number from 1 to 10.\n2. Create variable guess. Use the “numeric input” block from Text to ask the user for a number and assign it to guess.\n3. Take the “repeat while …” block from Loops with condition “guess ≠ secret”.\n4. Inside the loop: an “if / else if / else” block (gear → add sections) — if guess < secret print “The secret number is higher!”, if guess > secret print “The secret number is lower!”, else print “Congratulations! You guessed the number!”.\n5. In the lower/higher branches ask for a new guess via “numeric input”.",
    validate: validateGuessGame,
  },
  mult_table: {
    id: "mult_table",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 22: Таблица умножения" : "Task 22: Multiplication table",
    description: (lang) =>
      lang === "ru"
        ? "Выведите таблицу умножения для чисел от <strong>1</strong> до <strong>5</strong>: каждая строка — один пример, например:<br><strong>2 × 3 = 6</strong><br><strong>5 × 5 = 25</strong><br><br>Для этого используйте <strong>вложенные циклы</strong>: внешний цикл перебирает первый множитель (от 1 до 5), внутренний — второй (от 1 до 5). Для каждой пары (i, j) выведите строку вида <strong>i × j = результат</strong>.<br><br><strong>Подсказка:</strong> соберите строку примера блоком <strong>«создать текст из»</strong> (Текст): переменная i, символ ×, переменная j, знак = и результат умножения (блок «+ − × ÷» из «Математика» с операцией ×)."
        : "Print the multiplication table for numbers from <strong>1</strong> to <strong>5</strong>: each line is one equation, for example:<br><strong>2 × 3 = 6</strong><br><strong>5 × 5 = 25</strong><br><br>Use <strong>nested loops</strong>: the outer loop goes over the first factor (1 to 5), the inner loop over the second (1 to 5). For each pair (i, j) print a line like <strong>i × j = result</strong>.<br><br><strong>Tip:</strong> build the line with the <strong>“create text with”</strong> block (Text): variable i, symbol ×, variable j, the = sign and the product (the “+ − × ÷” block from Math with the × operation).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В «Циклы» возьмите блок «цикл по i от … до … с шагом …» (от 1 до 5, шаг 1) — внешний цикл, первый множитель.\n2. Внутрь внешнего цикла положите второй блок «цикл по j от … до … с шагом …» (от 1 до 5, шаг 1) — внутренний цикл, второй множитель.\n3. Внутри внутреннего цикла соберите строку примера блоком «создать текст из» (Текст): переменная i, символ ×, переменная j, знак = и результат i × j (блок «+ − × ÷» с операцией ×).\n4. Вложите эту строку в «Добавить текст … цвет …» — каждая пара (i, j) печатается с новой строки.\n5. Запустите код: в окне вывода будет 25 строк — от «1 × 1 = 1» до «5 × 5 = 25». Нажмите «Проверить решение»."
        : "Step by step:\n1. In Loops take the “count with i from … to … by …” block (1 to 5, step 1) — the outer loop, the first factor.\n2. Put a second “count with j from … to … by …” block (1 to 5, step 1) inside the outer loop — the inner loop, the second factor.\n3. Inside the inner loop build the line with the “create text with” block (Text): variable i, symbol ×, variable j, the = sign and the product i × j (the “+ − × ÷” block with the × operation).\n4. Put this line into the “Add text … color …” block — each pair (i, j) is printed on a new line.\n5. Run the code: the output shows 25 lines — from “1 × 1 = 1” to “5 × 5 = 25”. Press “Check solution”.",
    validate: validateMultTable,
  },
  first_even_break: {
    id: "first_even_break",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 23: Найди первое чётное" : "Task 23: Find the first even",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[7, 3, 8, 5, 2, 9]</code> и сохраните его в переменную <strong>list</strong>. Переберите элементы циклом и, как только встретится <strong>чётное</strong> число, выведите его и <strong>прервите цикл</strong>: в окне вывода должно появиться только <strong>8</strong>.<br><br><strong>Что такое «прервать цикл»:</strong> блок <strong>«прервать цикл»</strong> (категория «Циклы») немедленно останавливает цикл — программа продолжается с первого блока после цикла. Это классический паттерн «поиск с ранним выходом».<br><br>Проверить чётность можно блоком <strong>«чётное»</strong> из «Математика» (выберите «чётное» в выпадающем списке) или сравнением «остаток от n ÷ 2 = 0»."
        : "Create the list <code>[7, 3, 8, 5, 2, 9]</code> and store it in <strong>list</strong>. Loop over the items and as soon as you meet an <strong>even</strong> number, print it and <strong>break out of the loop</strong>: the output must show only <strong>8</strong>.<br><br><strong>What “break” means:</strong> the <strong>“break out of loop”</strong> block (Loops category) stops the loop immediately — the program continues right after the loop. This is the classic “search with early exit” pattern.<br><br>To check parity use the <strong>“is even”</strong> block from Math (choose “even” in the dropdown) or the comparison “remainder of n ÷ 2 = 0”.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 7 3 8 5 2 9» (блок из «Списки»).\n2. В «Циклы» возьмите блок «для каждого элемента n в списке …» и вложите в его поле переменную list.\n3. Внутрь цикла положите «если» из «Логика» с условием «чётное»: блок из «Математика» (в выпадающем списке выберите «чётное»), в его поле — переменная n. Альтернатива: «остаток от n ÷ 2 = 0».\n4. В ветку «если» добавьте «Добавить текст … цвет …» с переменной n.\n5. Сразу после печати в той же ветке «если» поставьте блок «прервать цикл» из «Циклы» — после первого чётного цикл остановится, и 2 не будет выведено.\n6. Запустите код: в окне вывода только 8. Нажмите «Проверить решение»."
        : "Step by step:\n1. Create a variable list and set it to “create list with 7 3 8 5 2 9” (a Lists block).\n2. In Loops take the “for each item n in list …” block and put variable list into its field.\n3. Inside the loop place an “if” from Logic with the condition “is even”: the Math block (choose “even” in the dropdown) with variable n in its field. Alternative: “remainder of n ÷ 2 = 0”.\n4. In the if branch add “Add text … color …” with variable n.\n5. Right after the print, in the same if branch, put the “break out of loop” block from Loops — after the first even number the loop stops, so 2 is never printed.\n6. Run the code: the output shows only 8. Press “Check solution”.",
    validate: validateFirstEvenBreak,
  },
};
