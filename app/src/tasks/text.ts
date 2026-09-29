// Задачи группы «text»: строки и работа с ними (категория «Текст»).
// Длина и разворот, символ по номеру, подстрока, регистр и пробелы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import type { TaskRegistry, ValidationResult } from "./types";

const WORD = "Blockly";
const WORD_LEN = WORD.length; // 7
const WORD_REV = "ylkcolB";

function blockTypes(ws: Blockly.WorkspaceSvg): string[] {
  try {
    return getNonShadowBlocks(ws).map((b) => (b as any).type);
  } catch {
    return [];
  }
}

function countOf(types: string[], type: string): number {
  return types.filter((t) => t === type).length;
}

async function validateStrLength(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const ok =
    countOf(types, "text_length") >= 1 &&
    lines.includes(String(WORD_LEN)) &&
    lines.includes(WORD_REV);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (countOf(types, "text_reverse") >= 1 && count <= 5)
      stars = 3; // 2 × (печать + блок строки)
    else if (count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrCharAt(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const charAt = countOf(types, "text_charAt");
  const ok =
    charAt >= 1 &&
    lines.includes("B") &&
    lines.includes("y") &&
    lines.includes("o");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (charAt >= 3 && count <= 7) stars = 3; // по одному блоку на символ
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrSubstring(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const slices = countOf(types, "text_getSubstring");
  const ok =
    slices >= 1 &&
    lines.includes("Blo") &&
    lines.includes("kly") &&
    lines.includes("lockl");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (slices >= 3 && count <= 7) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrClean(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const ok =
    countOf(types, "text_trim") >= 1 &&
    countOf(types, "text_changeCase") >= 1 &&
    lines.includes("PRIVET!");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (countOf(types, "text_append") >= 1 && count <= 7)
      stars = 3; // переменная + append + печать с trim и регистром
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const textTasks: Pick<
  TaskRegistry,
  "str_length" | "str_charat" | "str_substring" | "str_clean"
> = {
  str_length: {
    id: "str_length",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 29: Сколько букв?"
        : "Task 29: How Many Letters?",
    description: (lang) =>
      lang === "ru"
        ? `Строка — это последовательность символов, и компьютер умеет с ней работать как со списком. Возьмите слово <strong>«${WORD}»</strong> и напечатайте в окне вывода две строки:<br><br>1) <strong>сколько в нём символов</strong> — блок «длина текста» из категории «Текст»;<br>2) <strong>это же слово задом наперёд</strong> — блок «развернуть» из той же категории.<br><br>Символом считается всё: буквы, цифры и пробелы. <br><br>★★★ — оба действия сделаны блоками, лишних блоков нет.`
        : `A string is a sequence of characters, and a program can work with it like with a list. Take the word <strong>“${WORD}”</strong> and print two lines:<br><br>1) <strong>how many characters it has</strong> — the “length of text” block from the Text category;<br>2) <strong>the same word backwards</strong> — the “reverse” block from the same category.<br><br>Every character counts: letters, digits and spaces.<br><br>★★★ — both done with blocks, no extra blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите блок «длина текста» и вложите в него текст «${WORD}» (серое поле-подсказка).\n2. Положите этот блок в «Добавить текст … цвет …» — получите первую строку вывода.\n3. Запустите код («▶»): должно появиться число ${WORD_LEN}. Если цифра другая — вы взяли не то слово.\n4. Для второй строки возьмите «развернуть», вложите в него тот же текст «${WORD}» и тоже поместите в блок печати.\n5. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “length of text” and put the text “${WORD}” into it (the grey shadow field).\n2. Drop that block into “Add text … color …” — that is the first output line.\n3. Run the code (“▶”): you should see ${WORD_LEN}. A different number means a different word.\n4. For the second line take “reverse”, put the same “${WORD}” text into it and wrap it in a print block too.\n5. Press “Check solution”.`,
    infoTopics: ["string_length"],
    validate: validateStrLength,
  },
  str_charat: {
    id: "str_charat",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 30: Буквы по номеру"
        : "Task 30: Letters by Position",
    description: (lang) =>
      lang === "ru"
        ? `Возьмите слово <strong>«${WORD}»</strong> и напечатайте тремя отдельными строками:<br><br>1) <strong>первую</strong> букву;<br>2) <strong>последнюю</strong> букву;<br>3) букву под номером <strong>3</strong> (считаем от начала слова).<br><br>Используйте блок <strong>«в тексте получить …»</strong> из категории «Текст» — в его выпадающем списке есть режимы «первый», «последний», «с начала» и «с конца».<br><br><strong>Осторожно с нумерацией:</strong> режим «с начала» отсчитывает буквы с 1, а языки программирования — с 0. Об этом — раздел «Символ по номеру» под заданием.<br><br>★★★ — все три буквы получены блоком «в тексте получить …».`
        : `Take the word <strong>“${WORD}”</strong> and print three separate lines:<br><br>1) the <strong>first</strong> letter;<br>2) the <strong>last</strong> letter;<br>3) the letter at position <strong>3</strong> counting from the start.<br><br>Use the <strong>“in text get …”</strong> block from the Text category — its dropdown has first, last, from start and from end modes.<br><br><strong>Mind the numbering:</strong> the “from start” mode counts letters from 1, while programming languages count from 0. See the “Character by position” note below.<br><br>★★★ — all three letters come from the “in text get …” block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите «в тексте получить …», в поле текста — «${WORD}».\n2. В выпадающем списке выберите «первый» — это заглавная B. Вложите блок в «Добавить текст … цвет …».\n3. Скопируйте блок дважды. Во втором выберите «последний» (получится y), в третьем — «с начала» и поставьте число 3 (получится o).\n4. Запустите: в выводе три строки B, y, o.\n5. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “in text get …” and put “${WORD}” into its text field.\n2. Choose “first” in the dropdown — that is the capital B. Drop the block into “Add text … color …”.\n3. Copy the block twice. In the second one choose “last” (you get y); in the third choose “from start” with the number 3 (you get o).\n4. Run: the output shows B, y and o on three lines.\n5. Press “Check solution”.`,
    infoTopics: ["string_indexing"],
    validate: validateStrCharAt,
  },
  str_substring: {
    id: "str_substring",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 31: Кусочки строки"
        : "Task 31: Pieces of a String",
    description: (lang) =>
      lang === "ru"
        ? `От слова <strong>«${WORD}»</strong> осталось три кусочка — напечатайте их по строке каждый:<br><br>1) <strong>первые 3 буквы</strong> — Blo;<br>2) <strong>последние 3 буквы</strong> — kly;<br>3) <strong>слово без первой и последней буквы</strong> — lockl.<br><br>Для этого есть блок <strong>«в тексте получить подстроку с … по …»</strong> (категория «Текст»): у него задают начало и конец кусочка, каждый — своим способом (первый, с начала, с конца, последний).<br><br>Такой приём называют <strong>срез (slice)</strong>, и в разных языках он считает границы по-разному — смотрите раздел «Подстрока и срез» под заданием.<br><br>★★★ — все три кусочка вырезаны блоком подстроки.`
        : `Three pieces are left of the word <strong>“${WORD}”</strong> — print each on its own line:<br><br>1) the <strong>first 3 letters</strong> — Blo;<br>2) the <strong>last 3 letters</strong> — kly;<br>3) the <strong>word without its first and last letter</strong> — lockl.<br><br>Use the <strong>“in text get substring from … to …”</strong> block (Text category): you set a start and an end, each with its own mode (first, from start, from end, last).<br><br>This trick is called <strong>slicing</strong>, and languages treat the bounds differently — see the “Substring and slicing” note below.<br><br>★★★ — all three pieces come from the substring block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Возьмите «в тексте получить подстроку …», в поле текста — «${WORD}».\n2. Первый кусочек: начало — «первый», конец — «с начала» с числом 3. Получится Blo.\n3. Второй: начало — «с конца» с числом 3, конец — «последний». Получится kly.\n4. Третий: начало — «с начала» 2, конец — «с конца» 2. Получится lockl.\n5. Каждый блок подстроки вложите в свой «Добавить текст … цвет …», запустите и сравните три строки вывода.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Take “in text get substring …” and put “${WORD}” into its text field.\n2. First piece: start “first”, end “from start” with the number 3 → Blo.\n3. Second: start “from end” with 3, end “last” → kly.\n4. Third: start “from start” 2, end “from end” 2 → lockl.\n5. Put each substring block into its own “Add text … color …”, run and compare the three lines.\n6. Press “Check solution”.`,
    infoTopics: ["string_slice"],
    validate: validateStrSubstring,
  },
  str_clean: {
    id: "str_clean",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 32: Приводим текст в порядок"
        : "Task 32: Cleaning Up Text",
    description: (lang) =>
      lang === "ru"
        ? `Данные часто приходят «грязными»: лишние пробелы по краям, разный регистр. Соберите фразу и очистите её.<br><br>1. Создайте переменную <strong>phrase</strong> и присвойте ей текст из <strong>двух пробелов</strong> и букв <strong>«pri»</strong> (то есть «&nbsp;&nbsp;pri»).<br>2. Блоком <strong>«добавить к переменной текст»</strong> допишите к ней <strong>«vet!»</strong>.<br>3. Напечатайте значение phrase, предварительно <strong>убрав пробелы по краям</strong> («убрать пробелы») и <strong>подняв регистр</strong> («изменить регистр» → В ВЕРХНИЙ РЕГИСТР).<br><br>В окне вывода должна получиться ровно одна строка: <strong>PRIVET!</strong><br><br>★★★ — использованы и дописывание, и очистка, и смена регистра.`
        : `Real data often arrives dirty: extra spaces at the edges, mixed case. Build the phrase and clean it up.<br><br>1. Create a variable <strong>phrase</strong> and set it to a text made of <strong>two spaces</strong> and the letters <strong>“pri”</strong> (i.e. “&nbsp;&nbsp;pri”).<br>2. Using the <strong>“add text to variable”</strong> block, append <strong>“vet!”</strong> to it.<br>3. Print phrase after <strong>trimming the spaces</strong> (“trim spaces from”) and <strong>raising the case</strong> (“change case” → UPPERCASE).<br><br>The output must contain exactly one line: <strong>PRIVET!</strong><br><br>★★★ — appending, trimming and changing case are all used.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную phrase (категория «Переменные») и блок «присвоить …»; в поле значения — текст «  pri»: начните его с двух пробелов.\n2. Из категории «Текст» возьмите «добавить к переменной … текст» и допишите «vet!» — теперь в phrase лежит «  privet!».\n3. Возьмите «убрать пробелы» (режим «с обоих концов») и вложите в него переменную phrase: пробелы по краям исчезнут, внутри строка не меняется.\n4. Сверху положите «изменить регистр» с режимом «в верхний» — получится PRIVET!.\n5. Вложите всё в «Добавить текст … цвет …», запустите и проверьте: одна строка PRIVET!.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable phrase (Variables category) and a “set … to” block; its value is the text “  pri” — start it with two spaces.\n2. From the Text category take “add text to variable” and append “vet!” — phrase now holds “  privet!”.\n3. Take “trim spaces from … to …” (mode: both) and put the variable into it: the edge spaces disappear, the inside stays untouched.\n4. Wrap that in “change case” set to UPPERCASE — you get PRIVET!.\n5. Put it all into “Add text … color …”, run and check: a single line PRIVET!.\n6. Press “Check solution”.`,
    infoTopics: ["string_case_trim"],
    validate: validateStrClean,
  },
};
