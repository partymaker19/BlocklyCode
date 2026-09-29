/**
 * Справочник тем: короткие объяснения новых терминов с примерами кода
 * на четырёх поддерживаемых языках (JavaScript, Python, Lua, PHP).
 *
 * Тема привязывается к задаче через поле `infoTopics` (см. tasks/types.ts)
 * и рендерится под условием задачи в контейнере #glossaryInfoSection —
 * там же, где живут старые захардкоженные info-секции. Новые темы
 * добавляются сюда как данные, а не как разметка в index.html.
 */

import { getAppLang } from "../localization";
import type { TaskId } from "../tasks/types";
import { tasks } from "../tasks/registry";

export type GlossaryTopicId =
  | "functions"
  | "nested_loops"
  | "break_continue"
  | "sorting"
  | "repeat_n_times"
  | "random_numbers"
  | "user_input"
  | "string_length"
  | "string_indexing"
  | "string_slice"
  | "string_case_trim"
  | "string_search"
  | "string_replace"
  | "boolean_logic"
  | "ternary_null"
  | "math_functions"
  | "rounding"
  | "split_join"
  | "list_operations";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

type LangExample = { label: string; code: string };

function examplesBlock(items: LangExample[]): string {
  const lis = items.map((i) => `<li><strong>${esc(i.label)}</strong><pre><code>${esc(i.code)}</code></pre></li>`);
  return `<ul class="code-examples">${lis.join("")}</ul>`;
}

function partsList(pairs: Array<[string, string]>): string {
  return `<ul>${pairs.map(([label, text]) => `<li><strong>${esc(label)}</strong>: ${esc(text)}</li>`).join("")}</ul>`;
}

function mistakesList(items: string[]): string {
  return `<h4 style="margin-top:12px;">${t("Частые ошибки", "Common mistakes")}</h4><ul>${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul>`;
}

function blocklyNote(html: string): string {
  return `<p style="font-size: 0.9em; font-style: italic;">${html}</p>`;
}

const TOPIC_CONTENT: Record<GlossaryTopicId, () => string> = {
  functions: () =>
    `<h4>${t("Функции: определение, параметр, возврат", "Functions: definition, parameter, return")}</h4>` +
    `<p>${t(
      "Функция — это именованный кусок программы: действия описываются один раз и запускаются по имени столько раз, сколько нужно.",
      "A function is a named piece of a program: you describe the actions once and run them by name as many times as needed."
    )}</p>` +
    partsList([
      [t("определение", "definition"), t("описание функции — блок «создать функцию …»", "writing the function body — the “create a function …” block")],
      [t("вызов", "call"), t("запуск функции по имени — блок вызова", "running the function by name — the call block")],
      [t("параметр", "parameter"), t("внутренняя переменная функции, получает значение при вызове", "a variable inside the function, gets its value at call time")],
      [t("аргумент", "argument"), t("конкретное значение, которое передают при вызове", "the actual value passed at the call site")],
      [t("возврат", "return"), t("значение, которое функция отдаёт обратно в выражение", "the value the function hands back into the expression")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: функция с параметром", "Example: function with a parameter")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'function greet(name) {\n  console.log("Hello, " + name + "!");\n}\ngreet("Anna"); // Hello, Anna!' },
      { label: "Python", code: 'def greet(name):\n    print("Hello, " + name + "!")\ngreet("Anna")  # Hello, Anna!' },
      { label: "Lua", code: 'function greet(name)\n  print("Hello, " .. name .. "!")\nend\ngreet("Anna") -- Hello, Anna!' },
      { label: "PHP", code: '<?php\nfunction greet($name) {\n  echo "Hello, " . $name . "!" . PHP_EOL;\n}\ngreet("Anna"); // Hello, Anna!' },
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: функция с возвратом", "Example: function with a return value")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(3, 4)); // 7" },
      { label: "Python", code: "def add(a, b):\n    return a + b\nprint(add(3, 4))  # 7" },
      { label: "Lua", code: "function add(a, b)\n  return a + b\nend\nprint(add(3, 4)) -- 7" },
      { label: "PHP", code: "<?php\nfunction add($a, $b) {\n  return $a + $b;\n}\necho add(3, 4) . PHP_EOL; // 7" },
    ]) +
    mistakesList([
      t("Определили функцию, но ни разу не вызвали — ничего не выполняется.", "The function is defined but never called — nothing runs."),
      t("Перепутали параметр (в определении) и аргумент (в вызове).", "Confusing the parameter (in the definition) with the argument (in the call)."),
      t("Печатают результат вместо возврата, когда значение нужно использовать дальше.", "Printing the result instead of returning it when the value is needed later."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Функции» — блок-фигура «создать функцию …», параметры добавляются через шестерёнку; блок вызова появляется в той же категории.",
      "In Blockly: the Functions category — the “create a function …” puzzle block, parameters are added via the gear; the call block appears in the same category."
    )),

  nested_loops: () =>
    `<h4>${t("Вложенные циклы", "Nested loops")}</h4>` +
    `<p>${t(
      "Вложенный цикл — это цикл внутри другого цикла. Внешний цикл отвечает за строки, внутренний — за столбцы: на каждую итерацию внешнего цикла внутренний проходится целиком.",
      "A nested loop is a loop inside another loop. The outer loop handles the rows, the inner one the columns: for each outer iteration the inner loop runs to completion."
    )}</p>` +
    partsList([
      [t("внешний цикл", "outer loop"), t("выполняется меньше раз, каждый его шаг запускает внутренний цикл заново", "runs fewer times; each of its steps starts the inner loop from scratch")],
      [t("внутренний цикл", "inner loop"), t("выполняется на каждой итерации внешнего", "runs fully on every iteration of the outer one")],
      [t("всего итераций", "total iterations"), t("произведение количеств: 5 × 5 = 25 повторов внутреннего", "the product of the counts: 5 × 5 = 25 inner repetitions")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: таблица умножения 1…3", "Example: multiplication table 1…3")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (let i = 1; i <= 3; i++) {\n  for (let j = 1; j <= 3; j++) {\n    console.log(i + \" × \" + j + \" = \" + i * j);\n  }\n}" },
      { label: "Python", code: "for i in range(1, 4):\n    for j in range(1, 4):\n        print(f\"{i} × {j} = {i * j}\")" },
      { label: "Lua", code: "for i = 1, 3 do\n  for j = 1, 3 do\n    print(i .. \" × \" .. j .. \" = \" .. i * j)\n  end\nend" },
      { label: "PHP", code: "<?php\nfor ($i = 1; $i <= 3; $i++) {\n  for ($j = 1; $j <= 3; $j++) {\n    echo \"$i × $j = \" . ($i * $j) . PHP_EOL;\n  }\n}" },
    ]) +
    mistakesList([
      t("Один и тот же счётчик в обоих циклах — цикл «съедает» сам себя.", "The same counter variable in both loops — the loop eats itself."),
      t("Перепутали местами: перемножение i × j даёт разные строки, если внешний и внутренний поменяны.", "Swapping the loops: the i × j products change if outer and inner are switched."),
    ]) +
    blocklyNote(t(
      "В Blockly: вложите блок «цикл по j …» внутрь слота «выполнить» блока «цикл по i …» (категория «Циклы»).",
      "In Blockly: put the “count with j …” block into the “do” slot of the “count with i …” block (Loops category)."
    )),

  break_continue: () =>
    `<h4>${t("Break и continue: управление циклом", "Break and continue: controlling the loop")}</h4>` +
    partsList([
      [t("break", "break"), t("немедленно останавливает цикл — программа продолжается с блока после цикла", "stops the loop at once — execution continues after the loop")],
      [t("continue", "continue"), t("пропускает остаток текущей итерации и переходит к следующей", "skips the rest of the current iteration and moves to the next one")],
    ]) +
    `<p>${t(
      "break — классический паттерн «поиск с ранним выходом»: нашли искомое — дальше искать незачем.",
      "break is the classic “search with early exit” pattern: once the item is found, there is no reason to keep looking."
    )}</p>` +
    `<h4 style="margin-top:12px;">${t("Пример: break — первое чётное число", "Example: break — the first even number")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (const n of [7, 3, 8, 5, 2]) {\n  if (n % 2 === 0) {\n    console.log(n);\n    break; // напечатает только 8\n  }\n}" },
      { label: "Python", code: "for n in [7, 3, 8, 5, 2]:\n    if n % 2 == 0:\n        print(n)\n        break  # prints only 8" },
      { label: "Lua", code: "for _, n in ipairs({7, 3, 8, 5, 2}) do\n  if n % 2 == 0 then\n    print(n)\n    break -- prints only 8\n  end\nend" },
      { label: "PHP", code: "<?php\nforeach ([7, 3, 8, 5, 2] as $n) {\n  if ($n % 2 === 0) {\n    echo $n . PHP_EOL;\n    break; // only 8 is printed\n  }\n}" },
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: continue — пропустить нечётные", "Example: continue — skip the odds")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (const n of [1, 2, 3, 4]) {\n  if (n % 2 !== 0) continue;\n  console.log(n); // 2, 4\n}" },
      { label: "Python", code: "for n in [1, 2, 3, 4]:\n    if n % 2 != 0:\n        continue\n    print(n)  # 2, 4" },
      { label: "Lua", code: "-- В Lua нет continue: тело оборачивают\n-- в противоположное условие\nfor _, n in ipairs({1, 2, 3, 4}) do\n  if n % 2 == 0 then print(n) end\nend" },
      { label: "PHP", code: "<?php\nforeach ([1, 2, 3, 4] as $n) {\n  if ($n % 2 !== 0) continue;\n  echo $n . PHP_EOL; // 2, 4\n}" },
    ]) +
    mistakesList([
      t("Код в цикле после break не выполняется — ставьте его сразу после нужного действия.", "Code in the loop after break never runs — place it right after the useful action."),
      t("break останавливает только ближайший (внутренний) цикл, внешний продолжится.", "break stops only the innermost loop; the outer loop keeps going."),
    ]) +
    blocklyNote(t(
      "В Blockly: блок «прервать цикл» из категории «Циклы» — в выпадающем списке выберите «прервать» (break) или «пропустить» (continue).",
      "In Blockly: the “break out of loop” block from the Loops category — the dropdown switches it between “break” and “continue”."
    )),

  sorting: () =>
    `<h4>${t("Сортировка списка", "Sorting a list")}</h4>` +
    `<p>${t(
      "Сортировать — значит упорядочить элементы списка по правилу: по возрастанию (от меньшего к большему) или по убыванию. После сортировки по возрастанию первый элемент — минимум, последний — максимум.",
      "To sort means to arrange list items by a rule: ascending (smallest to largest) or descending. After an ascending sort the first item is the minimum and the last is the maximum."
    )}</p>` +
    partsList([
      [t("по возрастанию", "ascending"), t("1, 3, 5, 7, 9", "1, 3, 5, 7, 9")],
      [t("по убыванию", "descending"), t("9, 7, 5, 3, 1", "9, 7, 5, 3, 1")],
      [t("алфавитный порядок", "alphabetical"), t("слова сравниваются по буквам: \"арбуз\" раньше \"банан\"", "words compare letter by letter: \"apple\" comes before \"banana\"")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сортировка [9, 3, 7, 1, 5]", "Example: sorting [9, 3, 7, 1, 5]")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const list = [9, 3, 7, 1, 5];\nlist.sort((a, b) => a - b);\nconsole.log(list); // [1, 3, 5, 7, 9]" },
      { label: "Python", code: "lst = [9, 3, 7, 1, 5]\nlst.sort()\nprint(lst)  # [1, 3, 5, 7, 9]" },
      { label: "Lua", code: "local list = {9, 3, 7, 1, 5}\ntable.sort(list)\nprint(table.concat(list, \", \"))\n-- 1, 3, 5, 7, 9" },
      { label: "PHP", code: "<?php\n$list = [9, 3, 7, 1, 5];\nsort($list);\necho implode(\", \", $list); // 1, 3, 5, 7, 9" },
    ]) +
    mistakesList([
      t("Числа как текст сортируются странно: [\"10\", \"9\"] → 10 раньше 9. Сортируйте именно числа.", "Numbers stored as text sort oddly: [\"10\", \"9\"] puts 10 before 9. Sort actual numbers."),
      t("Путают direction в блоке сортировки: по убыванию минимум окажется в конце.", "Mixing up the sort direction: with descending order the minimum ends up last."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — блок «сортировать» с выпадающим списком (числовая по возрастанию / по убыванию / алфавитно).",
      "In Blockly: the Lists category — the “sort” block with a dropdown (numeric ascending / descending / alphabetical)."
    )),

  repeat_n_times: () =>
    `<h4>${t("Повторить N раз", "Repeat N times")}</h4>` +
    `<p>${t(
      "Самый простой цикл, когда заранее известно число повторов: «повторить 10 раз» — счётчик не нужен, тело цикла выполняется заданное количество раз.",
      "The simplest loop when the number of repetitions is known upfront: “repeat 10 times” — no counter needed, the body runs exactly that many times."
    )}</p>` +
    partsList([
      [t("повторить … раз", "repeat … times"), t("сколько раз выполнить тело цикла", "how many times to run the loop body")],
      [t("отличие от «цикл по i»", "vs “count with i”"), t("здесь нет переменной-счётчика: действие повторяется, но номер шага недоступен", "there is no counter variable: the action repeats, but the step number isn't available")],
      [t("отличие от «пока»", "vs “while”"), t("число повторов известно до запуска, а не зависит от условия", "the repeat count is known before running, not driven by a condition")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сказать «Привет» 3 раза", "Example: say “Hello” 3 times")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (let k = 0; k < 3; k++) {\n  console.log(\"Привет\");\n}" },
      { label: "Python", code: "for _ in range(3):\n    print(\"Привет\")" },
      { label: "Lua", code: "for _ = 1, 3 do\n  print(\"Привет\")\nend" },
      { label: "PHP", code: "<?php\nfor ($k = 0; $k < 3; $k++) {\n  echo \"Привет\" . PHP_EOL;\n}" },
    ]) +
    mistakesList([
      t("Ставят «повторить» там, где нужен счётчик (например, числа 1…10) — берите «цикл по i».", "Using “repeat” where a counter is needed (e.g. printing 1…10) — take “count with i” instead."),
      t("Не то, что нужно, при неизвестном числе повторов («пока не угадан») — там подходит «повторять, пока».", "Wrong tool when the count is unknown (“until guessed right”) — use “repeat while” there."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Циклы» — блок «повторить … раз» с полем количества повторений.",
      "In Blockly: the Loops category — the “repeat … times” block with a count field."
    )),

  random_numbers: () =>
    `<h4>${t("Случайные числа", "Random numbers")}</h4>` +
    `<p>${t(
      "Генератор случайных чисел каждый запуск выдаёт новое значение «из ничего» — программа не может его предсказать. Чаще всего нужен целый случайный число в диапазоне: от и до, включая обе границы.",
      "A random number generator produces a fresh unpredictable value on each run. The most common need is a random whole number in a range: from and to, both bounds included."
    )}</p>` +
    partsList([
      [t("целое в диапазоне", "random integer in range"), t("случайное целое от A до B включительно (кубик: от 1 до 6)", "a random whole number from A to B inclusive (a die: 1 to 6)")],
      [t("дробное", "random fraction"), t("число от 0 до 1 — основа для ручных диапазонов", "a number from 0 to 1 — the building block for manual ranges")],
      [t("непредсказуемость", "unpredictability"), t("проверить вывод генератора точно нельзя — только диапазон и форму", "you can't assert the exact output — only the range and the shape")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: бросок кубика (1…6)", "Example: a die roll (1…6)")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const roll = Math.floor(Math.random() * 6) + 1;\nconsole.log(roll);" },
      { label: "Python", code: "import random\nroll = random.randint(1, 6)\nprint(roll)" },
      { label: "Lua", code: "roll = math.random(1, 6)\nprint(roll)" },
      { label: "PHP", code: "<?php\n$roll = rand(1, 6);\necho $roll . PHP_EOL;" },
    ]) +
    mistakesList([
      t("Думают, что границы не включаются: «от 1 до 6» может дать и 1, и 6.", "Believing the bounds are exclusive: “1 to 6” can yield both 1 and 6."),
      t("Сравнивают результат с конкретным числом при проверке — он же случайный. Проверяйте диапазон.", "Checking the result against a fixed number — it is random. Verify the range instead."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — блок «выдать случайное от … до …» (целое) и «случайное дробное».",
      "In Blockly: the Math category — the “random integer from … to …” block and “random fraction”."
    )),

  user_input: () =>
    `<h4>${t("Ввод пользователя", "User input")}</h4>` +
    `<p>${t(
      "Программа может не только печатать, но и спрашивать: во время запуска появляется поле ввода, пользователь что-то пишет, а функция ввода возвращает это как значение.",
      "A program can not only print but also ask: while it runs an input box appears, the user types something, and the input call returns it as a value."
    )}</p>` +
    partsList([
      [t("значение из поля", "value from the box"), t("результат ввода можно присвоить переменной или вложить в другой блок", "the input result can be stored in a variable or plugged into another block")],
      [t("текст vs число", "text vs number"), t("ввод — это всегда строка; для арифметики её надо привести к числу", "input is always a string; convert it to a number for arithmetic")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: спросить имя и поздороваться", "Example: ask a name and greet")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const name = prompt(\"Как тебя зовут?\");\nconsole.log(\"Привет, \" + name + \"!\");" },
      { label: "Python", code: "name = input(\"Как тебя зовут? \")\nprint(\"Привет, \" + name + \"!\")" },
      { label: "Lua", code: "io.write(\"Как тебя зовут? \")\nlocal name = io.read()\nprint(\"Привет, \" .. name .. \"!\")" },
      { label: "PHP", code: "<?php\necho \"Как тебя зовут? \" . PHP_EOL;\n$name = trim(fgets(STDIN));\necho \"Привет, \" . $name . \"!\" . PHP_EOL;" },
    ]) +
    mistakesList([
      t("Числовой ввод используют без перевода в число: «возраст + 1» к строке даёт склеивание, а не сумму — берите блок числа вместо текста.", "Using numeric input without conversion: “age + 1” on a string concatenates instead of adding — use the number input block."),
      t("Забывают, что ввод происходит во время запуска: нужно нажать «▶», дождаться поле ввода и ответить.", "Forgetting that input happens at run time: press “▶”, wait for the input box and answer."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блоки «Ввод текста» и «Ввод числа»; они возвращают значение, которое присваивают переменной.",
      "In Blockly: the Text category — the “text input” and “numeric input” blocks; they return a value you assign to a variable."
    )),

  string_length: () =>
    `<h4>${t("Длина строки и разворот", "String length and reverse")}</h4>` +
    `<p>${t(
      "Длина строки — это сколько символов в ней хранится. Символом считается всё: буквы, цифры, знаки препинания и пробелы. Разворот строки — то же самое чтение символов, но с конца.",
      "A string's length is how many characters it holds. Every character counts: letters, digits, punctuation and spaces. Reversing a string means reading those characters from the end."
    )}</p>` +
    partsList([
      [t("длина", "length"), t("число символов в строке, у \"\" она равна 0", "the number of characters, an empty string has 0")],
      [t("пробел — символ", "a space is a character"), t("\"привет \" длиннее, чем \"привет\"", "\"hello \" is longer than \"hello\"")],
      [t("разворот", "reverse"), t("строка наоборот: \"abc\" → \"cba\"", "the string backwards: \"abc\" → \"cba\"")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: длина и разворот слова «Blockly»", "Example: length and reverse of “Blockly”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.length); // 7\nconsole.log(s.split("").reverse().join("")); // ylkcolB' },
      { label: "Python", code: 's = "Blockly"\nprint(len(s))      # 7\nprint(s[::-1])     # ylkcolB' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(#s)                  -- 7\nprint(string.reverse(s))   -- ylkcolB' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho strlen($s) . PHP_EOL; // 7\necho strrev($s) . PHP_EOL; // ylkcolB' },
    ]) +
    mistakesList([
      t("Длина — не последний индекс: у строки из 7 символов последний индекс 6, потому что счёт символов начинается с нуля.", "Length is not the last index: a 7-character string ends at index 6 because counting starts at zero."),
      t("В JavaScript разворота строки нет — сначала split(''), затем reverse(), потом join('').", "JavaScript has no string reverse — split('') first, then reverse(), then join('')."),
      t("Путают длину текста и длину списка: блоки «длина текста» и «длина списка» разные.", "Confusing text length with list length — they are different blocks."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блоки «длина текста» и «развернуть».",
      "In Blockly: the Text category — the “length of text” and “reverse” blocks."
    )),

  string_indexing: () =>
    `<h4>${t("Символ по номеру: как считают индексы", "Character by position: how indexes work")}</h4>` +
    `<p>${t(
      "Чтобы взять один символ строки, указывают его позицию — индекс. В большинстве языков первый символ имеет индекс 0, а не 1, и это главный источник ошибок. В Blockly можно выбрать удобный способ: первый, последний, «с начала» и «с конца».",
      "To take a single character you give its position — the index. In most languages the first character has index 0, not 1, which is the main source of bugs. Blockly lets you pick a mode: first, last, from the start, from the end."
    )}</p>` +
    partsList([
      [t("индекс", "index"), t("номер символа в строке", "the number of a character inside the string")],
      [t("с нуля", "zero-based"), t("JavaScript, Python, PHP: первый символ — 0", "JavaScript, Python, PHP: the first character is 0")],
      [t("с единицы", "one-based"), t("Lua и блоки Blockly «с начала»: первый символ — 1", "Lua and the Blockly “from start” mode: the first character is 1")],
      [t("с конца", "from the end"), t("отрицательный индекс: -1 — последний символ", "a negative index: -1 is the last character")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: первый и последний символ", "Example: first and last character")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.charAt(0)); // B\nconsole.log(s.charAt(s.length - 1)); // y' },
      { label: "Python", code: 's = "Blockly"\nprint(s[0])   # B\nprint(s[-1])  # y' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(string.sub(s, 1, 1))  -- B\nprint(string.sub(s, -1))    -- y' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho $s[0] . PHP_EOL;            // B\necho substr($s, -1) . PHP_EOL;   // y' },
    ]) +
    mistakesList([
      t("Спрашивают «первый символ» под индексом 1 и получают второй. В JS/Python/PHP первый — это 0.", "Asking for index 1 to get the first character and getting the second one. In JS/Python/PHP the first is 0."),
      t("Индекс равный длине уже вне строки: у \"Blockly\" индексы 0…6, а 7 — пусто.", "An index equal to the length is out of range: \"Blockly\" has indexes 0…6, index 7 is empty."),
      t("Режим «с начала» в Blockly считает с 1 — не путайте его с индексом языка.", "Blockly's “from start” mode counts from 1 — don't mix it up with the language index."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блок «в тексте получить …», в выпадающем списке: первый, последний, с начала, с конца.",
      "In Blockly: the Text category — the “in text get …” block; the dropdown offers first, last, from start, from end."
    )),

  string_slice: () =>
    `<h4>${t("Подстрока и срез (slice)", "Substring and slicing")}</h4>` +
    `<p>${t(
      "Подстрока — это кусочек строки, вырезанный между двумя позициями. В JavaScript и Python такой приём называют slice («срез»): указывают начало и конец, причём символ на позиции «конец» в результат не входит. В Lua и PHP задают начало и длину или начало и конец.",
      "A substring is a piece cut out between two positions. In JavaScript and Python this is called slicing: you give a start and an end, and the character at the end position is not included. Lua and PHP take a start and a length instead."
    )}</p>` +
    partsList([
      [t("начало", "start"), t("позиция первого символа кусочка", "the position of the piece's first character")],
      [t("конец", "end"), t("в JS/Python — позиция ПОСЛЕ последнего символа кусочка", "in JS/Python — the position AFTER the last character of the piece")],
      [t("с конца", "from the end"), t("отрицательная позиция отсчитывает хвост строки", "a negative position counts from the tail of the string")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: три куска слова «Blockly»", "Example: three pieces of “Blockly”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.slice(0, 3)); // Blo\nconsole.log(s.slice(-3));   // kly\nconsole.log(s.slice(1, 6)); // lockl' },
      { label: "Python", code: 's = "Blockly"\nprint(s[0:3])  # Blo\nprint(s[-3:])  # kly\nprint(s[1:6])  # lockl' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(string.sub(s, 1, 3))   -- Blo\nprint(string.sub(s, -3))     -- kly\nprint(string.sub(s, 2, 6))   -- lockl' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho substr($s, 0, 3) . PHP_EOL;  // Blo\necho substr($s, -3) . PHP_EOL;    // kly\necho substr($s, 1, 5) . PHP_EOL;  // lockl' },
    ]) +
    mistakesList([
      t("В JS/Python правая граница не включается: s.slice(0, 3) даёт 3 символа, а не 4.", "In JS/Python the right bound is exclusive: s.slice(0, 3) yields 3 characters, not 4."),
      t("В Lua и PHP вторая цифра — часто длина, а не конечная позиция: substr(s, 0, 3) и sub(s, 1, 3) значат разное.", "In Lua and PHP the second number is often a length, not an end position: substr(s, 0, 3) and sub(s, 1, 3) differ."),
      t("Если начало дальше конца, получается пустая строка, а не ошибка — проверьте границы.", "When the start is past the end you get an empty string, not an error — check the bounds."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блок «в тексте получить подстроку с … по …»; границы переключаются между «с начала», «с конца», «первый» и «последний».",
      "In Blockly: the Text category — the “in text get substring from … to …” block; each bound switches between from start, from end, first and last."
    )),

  string_case_trim: () =>
    `<h4>${t("Регистр, пробелы и дописывание строки", "Case, trimming and appending")}</h4>` +
    `<p>${t(
      "Реальные данные приходят «грязными»: с лишними пробелами по краям и в разном регистре. Перед сравнением строку чистят: убирают пробелы (trim) и приводят к одному регистру. Дописывание (append) — способ собирать длинную строку по частям.",
      "Real-world data arrives dirty: extra spaces around the text and mixed case. Before comparing, clean it up: trim the spaces and normalize the case. Appending is how you build a long string piece by piece."
    )}</p>` +
    partsList([
      [t("trim", "trim"), t("удаляет пробелы только по краям строки", "removes whitespace only at the ends of the string")],
      [t("верхний/нижний регистр", "upper/lower case"), t("PRI и pri — разные строки для компьютера", "PRI and pri are different strings for a computer")],
      [t("append", "append"), t("дописать текст к переменной, не перезаписывая её", "add text to a variable without overwriting it")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: очистить и поднять регистр", "Example: clean up and uppercase")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'let s = "  pri";\ns += "vet!";\nconsole.log(s.trim().toUpperCase()); // PRIVET!' },
      { label: "Python", code: 's = "  pri"\ns += "vet!"\nprint(s.strip().upper())  # PRIVET!' },
      { label: "Lua", code: 'local s = "  pri"\ns = s .. "vet!"\nlocal t = s:match("^%s*(.-)%s*$")\nprint(t:upper())  -- PRIVET!' },
      { label: "PHP", code: '<?php\n$s = "  pri";\n$s .= "vet!";\necho strtoupper(trim($s)) . PHP_EOL; // PRIVET!' },
    ]) +
    mistakesList([
      t("trim не трогает пробелы внутри строки: \" pri vet \" останется с двойным пробелом посередине.", "trim leaves inner spaces alone: \" pri vet \" still has a double space in the middle."),
      t("Сравнивают строки разного регистра и получают «не равно». Сначала — к одному регистру, потом сравнивать.", "Comparing strings of different case returns “not equal”. Normalize the case first, then compare."),
      t("Функции регистра не меняют строку на месте в JS и Python — результат нужно присвоить.", "Case functions do not mutate the string in JS and Python — assign the result."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «изменить регистр», «убрать пробелы» и «добавить к переменной текст».",
      "In Blockly: the Text category — “change case”, “trim whitespace” and “add text to variable”."
    )),

  string_search: () =>
    `<h4>${t("Поиск в строке: позиция и количество", "Searching a string: position and count")}</h4>` +
    `<p>${t(
      "Искать в строке — значит отвечать на два вопроса: «где подстрока?» и «сколько её раз?». В Blockly позиция считается с 1, а если подстроки нет — блок возвращает 0. В самих языках отсчёт идёт с 0, а «не найдено» выглядит по-разному: -1, None или false.",
      "Searching a string answers two questions: “where is the substring?” and “how many times?”. Blockly counts positions from 1 and returns 0 when nothing is found. The languages themselves count from 0 and spell “not found” differently: -1, None or false."
    )}</p>` +
    partsList([
      [t("первое вхождение", "first occurrence"), t("самая левая позиция подстроки", "the leftmost position of the substring")],
      [t("последнее вхождение", "last occurrence"), t("самая правая позиция — искать нужно с конца", "the rightmost position — the search runs from the end")],
      [t("не найдено", "not found"), t("в Blockly это 0, в JS/Python -1, в PHP false", "0 in Blockly, -1 in JS/Python, false in PHP")],
      [t("количество", "count"), t("сколько НЕПЕРЕКРЫВАЮЩИХСЯ вхождений подстроки", "how many NON-OVERLAPPING occurrences the substring has")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: ищем «a» в «banana»", "Example: looking for “a” in “banana”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "banana";\nconsole.log(s.indexOf("a"));         // 1 — отсчёт с 0\nconsole.log(s.lastIndexOf("a"));       // 5\nconsole.log(s.indexOf("z"));           // -1 — не найдено\nconsole.log(s.split("a").length - 1);  // 3 — сколько раз' },
      { label: "Python", code: 's = "banana"\nprint(s.find("a"))    # 1\nprint(s.rfind("a"))   # 5\nprint(s.find("z"))    # -1\nprint(s.count("a"))   # 3' },
      { label: "Lua", code: 'local s = "banana"\nprint((string.find(s, "a", 1, true)))  -- 1\nlocal n = 0\nfor _ in s:gmatch("a") do n = n + 1 end\nprint(n)  -- 3' },
      { label: "PHP", code: '<?php\n$s = "banana";\necho strpos($s, "a") . PHP_EOL;        // 1\necho strrpos($s, "a") . PHP_EOL;       // 5\nvar_dump(strpos($s, "z"));             // bool(false)\necho substr_count($s, "a") . PHP_EOL;  // 3' },
    ]) +
    mistakesList([
      t("«Позиция 0» в языке программирования — это первая буква, а не «не найдено». Проверяйте результат сравнением с -1 или false.", "Position 0 in a programming language is the first letter, not “not found”. Test the result against -1 or false."),
      t("Подсчёт не перекрывается: «na» в «banana» дают 2, а не 3 — найденный кусок «вычёркивается» целиком.", "Counting does not overlap: “na” in “banana” gives 2, not 3 — each hit is consumed whole."),
      t("Регистр важен: «A» не найдётся в «banana». Сначала приведите строку к одному регистру.", "Case matters: “A” is not found in “banana”. Normalize the case first."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «в тексте … найти первое вхождение текста» (режимы «первое» и «последнее») и «подсчитать количество … в …». Обе позиции уже пересчитаны с 1.",
      "In Blockly: the Text category — “in text … find first occurrence of text …” (modes first and last) and “count … in …”. Both positions are already 1-based."
    )),

  string_replace: () =>
    `<h4>${t("Замена подстроки", "Replacing a substring")}</h4>` +
    `<p>${t(
      "Замена создаёт новую строку, в которой одни куски заменены другими. Блок Blockly «заменить … на … в тексте» меняет сразу ВСЕ вхождения; в JavaScript обычный replace() заменяет только первое, и для остальных нужен специальный режим.",
      "Replacement produces a new string where some pieces are swapped for others. The Blockly “replace … with … in text” block changes ALL occurrences at once; in JavaScript a plain replace() changes only the first one and you need a special mode for the rest."
    )}</p>` +
    partsList([
      [t("что менять", "search"), t("подстрока-образец (FROM)", "the substring to look for (FROM)")],
      [t("на что менять", "replacement"), t("новый текст на месте каждого совпадения", "the new text placed at every match")],
      [t("в чём искать", "haystack"), t("исходная строка, которую обрабатывают", "the original string being processed")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: «Mississippi» с заменами", "Example: “Mississippi” with replacements")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Mississippi";\nconsole.log(s.replace("i", "1"));     // M1ssissippi — только первое\nconsole.log(s.replaceAll("i", "1"));  // M1ss1ss1pp1 — все\nconsole.log(s.replace(/ss/g, "sh"));  // Mishishippi' },
      { label: "Python", code: 's = "Mississippi"\nprint(s.replace("i", "1"))      # M1ss1ss1pp1 — сразу все\nprint(s.replace("i", "1", 1))   # M1ssissippi — только первое' },
      { label: "Lua", code: 'local s = "Mississippi"\nprint((s:gsub("i", "1")))      -- M1ss1ss1pp1\n-- gsub всегда меняет все вхождения, если не указан лимит' },
      { label: "PHP", code: '<?php\n$s = "Mississippi";\necho str_replace("i", "1", $s) . PHP_EOL;  // M1ss1ss1pp1' },
    ]) +
    mistakesList([
      t("Замена не меняет строку на месте: без присваивания результата исходная строка остаётся прежней.", "Replacement does not mutate the string: unless you assign the result, the original stays unchanged."),
      t("Замена на пустой текст — это удаление: replace(s, \"\") вырезает подстроку.", "Replacing with an empty text is deletion: replace(s, \"\") cuts the substring out."),
      t("Нельзя получить обратную замену «на автомате»: чтобы вернуть ss, нужна вторая замена с обратным направлением.", "There is no automatic undo: to get ss back you need a second replacement in the opposite direction."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «заменить … на … в …». Блок — выражение, поэтому замены вкладывают друг в друга цепочкой.",
      "In Blockly: the Text category — “replace … with … in …”. It is a value block, so replacements chain into each other."
    )),

  boolean_logic: () =>
    `<h4>${t("Логические операции: И, ИЛИ, НЕ", "Boolean operators: AND, OR, NOT")}</h4>` +
    `<p>${t(
      "Логические операции собирают из простых проверок одну сложную. «И» истина, только когда истинны обе части; «ИЛИ» истина, если истинна хотя бы одна; «НЕ» переворачивает значение. Результат любой проверки — это логическое значение (true/false), и его можно напечатать, сохранить в переменную или передать в условие.",
      "Boolean operators build one complex check out of simple ones. AND is true only when both parts are true; OR is true when at least one part is; NOT flips the value. Every check yields a boolean (true/false) that you can print, store in a variable or feed into a condition."
    )}</p>` +
    partsList([
      [t("И (AND)", "AND"), t("оба условия должны выполниться", "both conditions must hold")],
      [t("ИЛИ (OR)", "OR"), t("достаточно одного выполнившегося условия", "one satisfied condition is enough")],
      [t("НЕ (NOT)", "NOT"), t("инверсия: истина становится ложью", "inversion: truth becomes falsehood")],
      [t("схема вычисления", "short-circuit"), t("вторую часть не проверяют, если вердикт ясен из первой", "the second part is skipped when the first already decides")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сборка из двух проверок", "Example: combining two checks")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const a = true, b = false;\nconsole.log(a && b);  // false\nconsole.log(a || b);  // true\nconsole.log(!a);      // false\nconsole.log(14 > 10 && 14 < 12);  // false' },
      { label: "Python", code: 'a, b = True, False\nprint(a and b)        # False\nprint(a or b)         # True\nprint(not a)          # False\nprint(14 > 10 and 14 < 12)  # False' },
      { label: "Lua", code: 'local a, b = true, false\nprint(a and b)   -- false\nprint(a or b)    -- true\nprint(not a)     -- false' },
      { label: "PHP", code: '<?php\n$a = true; $b = false;\nvar_dump($a && $b);  // bool(false)\nvar_dump($a || $b);  // bool(true)\nvar_dump(!$a);       // bool(false)' },
    ]) +
    mistakesList([
      t("«И» с противоречивыми границами не выполним никогда: x > 20 и x < 12 ложны для любого числа.", "AND with contradictory bounds can never hold: x > 20 and x < 12 is false for every number."),
      t("Печать true в разных языках выглядит по-разному (True/true/1) — для окна вывода надёжнее печатать слово «да»/«нет».", "Printing true differs per language (True/true/1) — for the output panel it is safer to print a “yes”/“no” word."),
      t("«ИЛИ» — не «либо-либо»: когда истины обе части, результат всё равно истина.", "OR is not “either-or”: when both parts are true the result is still true."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Логика» — блоки «… и …», «… или …», «не …»; они принимаются внутрь «если» и в любые сравнения.",
      "In Blockly: the Logic category — “… and …”, “… or …”, “not …”; they fit inside “if” and into any comparison."
    )),

  ternary_null: () =>
    `<h4>${t("Тернарный выбор и пустое значение", "Ternary choice and the empty value")}</h4>` +
    `<p>${t(
      "Тернарный выбор — это «если … то … иначе», записанное одним значением: такой блок можно вставить прямо в печать или в переменную, и громоздкое «если» не нужно. Отдельная сущность — пустое значение (null): оно означает «значения вовсе нет», и это не то же самое, что 0, false или пустая строка.",
      "A ternary choice is “if … then … else” written as a single value: the block drops straight into a print or a variable, with no bulky “if”. A separate thing is the null value: it means “there is no value at all”, which is not the same as 0, false or an empty string."
    )}</p>` +
    partsList([
      [t("условие", "condition"), t("проверка, которая выбирает одну из двух веток", "the check that picks one of two branches")],
      [t("значение «то»", "then value"), t("что получить, когда условие истинно", "what you get when the condition holds")],
      [t("значение «иначе»", "else value"), t("что получить во всех остальных случаях", "what you get otherwise")],
      [t("null", "null"), t("пустое значение переменной или результата", "the empty value of a variable or a result")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: выбор значением", "Example: choosing a value")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const n = 7;\nconsole.log(n > 5 ? "больше" : "меньше");  // больше\nlet x;\nconsole.log(x == null);  // true — значения нет' },
      { label: "Python", code: 'n = 7\nprint("больше" if n > 5 else "меньше")  # больше\nx = None\nprint(x is None)  # True' },
      { label: "Lua", code: 'local n = 7\n-- в Lua тернарного оператора нет, роль играет пара and/or\nprint(n > 5 and "больше" or "меньше")\nlocal x = nil\nprint(x == nil)  -- true' },
      { label: "PHP", code: '<?php\n$n = 7;\necho ($n > 5 ? "больше" : "меньше") . PHP_EOL;  // больше\n$x = null;\nvar_dump($x === null);  // bool(true)' },
    ]) +
    mistakesList([
      t("null, 0, false и \"\" — четыре разных вещи. «Пустой текст» проверяют блоком «… пуст», а не сравнением с «ничто».", "null, 0, false and \"\" are four different things. An empty text is checked with the “… is empty” block, not by comparing with “null”."),
      t("Переменная, которой никогда не присваивали значение, и есть null — частый источник «пустых» результатов.", "A variable that was never assigned a value is exactly null — a common source of “empty” results."),
      t("Тернарный блок — выражение, а не команда: он сам отдаёт значение, поэтому «если» с двумя ветками печати не обязателен.", "The ternary block is an expression, not a command: it hands back a value, so an “if” with two print branches is not needed."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Логика» — «выбрать по … | если истина … | если ложь …» (значение) и «ничто»; категория «Текст» — «… пуст».",
      "In Blockly: the Logic category — “test … | if true … | if false …” (a value) and “null”; the Text category — “… is empty”."
    )),

  math_functions: () =>
    `<h4>${t("Математические функции и константы", "Math functions and constants")}</h4>` +
    `<p>${t(
      "Кроме сложения и умножения есть готовые функции: корень, модуль, противоположное число, логарифм — и готовые константы: π, число Эйлера, золотое сечение. Их не нужно вычислять вручную: блок просто вставляется на место числа.",
      "Beyond addition and multiplication there are ready-made functions — square root, absolute value, negation, logarithm — and ready-made constants: π, Euler's number, the golden ratio. You do not compute them by hand: the block takes the place of a number."
    )}</p>` +
    partsList([
      [t("корень (sqrt)", "square root"), t("число, которое само умноженное даёт исходное", "the number that multiplied by itself gives the input")],
      [t("модуль (abs)", "absolute value"), t("расстояние до нуля, всегда неотрицательное", "distance from zero, never negative")],
      [t("противоположное (neg)", "negation"), t("смена знака: −7 становится 7", "flipping the sign: −7 becomes 7")],
      [t("константа", "constant"), t("готовое именованное число, например π ≈ 3,14159", "a named ready-made number such as π ≈ 3.14159")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: корень, модуль и π", "Example: root, absolute value and π")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'console.log(Math.sqrt(144));  // 12\nconsole.log(Math.abs(-7));    // 7\nconsole.log(Math.PI);         // 3.141592653589793\nconsole.log(Math.log(9));     // натуральный логарифм' },
      { label: "Python", code: 'import math\nprint(math.sqrt(144))  # 12.0 — дробное, даже если корень целый\nprint(math.fabs(-7))   # 7.0\nprint(math.pi)         # 3.141592653589793\nprint(math.log(9))' },
      { label: "Lua", code: 'print(math.sqrt(144))  -- 12\nprint(math.abs(-7))    -- 7\nprint(math.pi)         -- 3.1415926535898\nprint(math.log(9))' },
      { label: "PHP", code: '<?php\necho sqrt(144) . PHP_EOL;  // 12\necho abs(-7) . PHP_EOL;    // 7\necho M_PI . PHP_EOL;       // 3.1415926535898' },
    ]) +
    mistakesList([
      t("Функции часто возвращают дробное число там, где ждёшь целое: math.sqrt(144) в Python — это 12.0. Округляйте, если нужен целый ответ.", "These functions often return a float where you expect a whole number: math.sqrt(144) is 12.0 in Python. Round it when you need a whole answer."),
      t("Корень из отрицательного числа и логарифм от 0 или меньше дадут ошибку или NaN — сначала проверьте знак условием.", "A root of a negative number and a logarithm of 0 or less produce an error or NaN — check the sign with a condition first."),
      t("π печатается с разной точностью: JavaScript и Python дают 3.141592653589793, Lua и PHP — 3.1415926535898.", "π prints with different precision: JavaScript and Python give 3.141592653589793, Lua and PHP give 3.1415926535898."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — блок с нужной операцией («квадратный корень …», «модуль …», «- …», «ln …») и блок константы «π» с выбором π / e / φ / sqrt(2) / sqrt(½) / ∞.",
      "In Blockly: the Math category — the block for the operation (“square root …”, absolute value, negation, ln …) and the “π” constant block with a π / e / φ / sqrt(2) / sqrt(½) / ∞ dropdown."
    )),

  rounding: () =>
    `<h4>${t("Округление и ограничение значения", "Rounding and clamping")}</h4>` +
    `<p>${t(
      "Округление превращает дробь в целое: обычное — к ближайшему, вверх — к следующему целому, вниз — к предыдущему. Ограничение (constrain) не округляет, а запирает значение в диапазон: что меньше нижней границы, становится нижней, что больше верхней — верхней.",
      "Rounding turns a fraction into a whole number: ordinary rounding goes to the nearest, up to the next integer, down to the previous one. Clamping does not round: it locks a value into a range — anything below the low bound becomes the low bound, anything above the high bound becomes the high bound."
    )}</p>` +
    partsList([
      [t("округлить", "round"), t("к ближайшему целому", "to the nearest whole number")],
      [t("вверх", "ceiling"), t("к наименьшему целому, которое не меньше числа", "to the smallest integer that is not less")],
      [t("вниз", "floor"), t("к наибольшему целому, которое не больше числа", "to the largest integer that is not greater")],
      [t("ограничить", "clamp"), t("запереть значение между нижней и верхней границей", "lock a value between a low and a high bound")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: 4,4 / 4,6 и диапазон 0..100", "Example: 4.4 / 4.6 and the range 0..100")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'console.log(Math.round(4.4));   // 4\nconsole.log(Math.round(4.6));   // 5\nconsole.log(Math.ceil(4.1));    // 5\nconsole.log(Math.floor(4.9));   // 4\nconsole.log(Math.min(Math.max(150, 0), 100));  // 100' },
      { label: "Python", code: 'import math\nprint(round(4.4))     # 4\nprint(round(4.6))     # 5\nprint(round(4.5))     # 4 — до чётного, а не вверх!\nprint(math.ceil(4.1)) # 5\nprint(math.floor(4.9))# 4' },
      { label: "Lua", code: 'print(math.floor(4.4 + .5))  -- 4 (в Blockly округление так и пишется)\nprint(math.floor(4.6 + .5))  -- 5\nprint(math.ceil(4.1))        -- 5\nprint(math.floor(4.9))       -- 4' },
      { label: "PHP", code: '<?php\necho round(4.4) . PHP_EOL;  // 4\necho round(4.6) . PHP_EOL;  // 5\necho ceil(4.1) . PHP_EOL;   // 5\necho floor(4.9) . PHP_EOL;  // 4' },
    ]) +
    mistakesList([
      t("Ровно половина округляется неоднозначно: JavaScript и PHP дают round(4.5) = 5, а Python — 4, потому что округляет к чётному. Проверяйте .5 на своём языке.", "Exact halves round inconsistently: JavaScript and PHP give round(4.5) = 5 while Python gives 4, because it rounds to even. Test .5 on your own language."),
      t("Округление «вверх» для отрицательного числа идёт к нулю: потолок −4.9 это −4, а не −5.", "Rounding “up” moves a negative number toward zero: the ceiling of −4.9 is −4, not −5."),
      t("Ограничение молча портит данные, если границы перепутаны: при low > 100 любое значение станет равным низу.", "Clamping silently ruins data when the bounds are swapped: with low > 100 every value collapses to the low bound."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — «округлить …» с режимами «округлить», «округлить к большему», «округлить к меньшему» и «ограничить … снизу … сверху …».",
      "In Blockly: the Math category — “round …” with round / round up / round down modes and “constrain … low … high …”."
    )),

  split_join: () =>
    `<h4>${t("Разделить строку на список и склеить список в строку", "Splitting a string into a list and joining it back")}</h4>` +
    `<p>${t(
      "Один и тот же блок работает в двух направлениях. Разделение (split) режет текст по разделителю и возвращает список кусков; склейка (join) берёт список и собирает из него текст, вставляя разделитель между частями. Так хранят несколько значений в одной строке: CSV-файл, параметры, «фамилия имя».",
      "The same block works in both directions. Splitting cuts a text by a delimiter and returns a list of pieces; joining takes a list and builds a text, inserting the delimiter between parts. This is how several values live in one string: a CSV line, parameters, “lastname firstname”."
    )}</p>` +
    partsList([
      [t("разделитель", "delimiter"), t("подстрока, по которой режут; сама она в результат не попадает", "the substring to cut at; it is not kept in the result")],
      [t("куски", "pieces"), t("после разделения это всегда ТЕКСТ, а не числа", "after splitting these are TEXT, never numbers")],
      [t("пустой разделитель", "empty delimiter"), t("режет строку по символам", "cuts the string character by character")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: «10,20,30» туда и обратно", "Example: “10,20,30” there and back")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const parts = "10,20,30".split(",");  // ["10","20","30"]\nconsole.log(parts[0]);                 // 10\nconsole.log(parts[0] + 1);             // "101" — строки, не числа!\nconsole.log(parts.join("-"));          // 10-20-30' },
      { label: "Python", code: 'parts = "10,20,30".split(",")\nprint(parts[0])           # 10\nprint(int(parts[0]) + 1)  # 11 — сначала перевод в число\nprint("-".join(parts))    # 10-20-30' },
      { label: "Lua", code: 'local parts = {}\nfor w in ("10,20,30"):gmatch("([^,]+)") do\n  parts[#parts + 1] = w\nend\nprint(table.concat(parts, "-"))  -- 10-20-30' },
      { label: "PHP", code: '<?php\n$parts = explode(",", "10,20,30");\necho $parts[0] . PHP_EOL;          // 10\necho number_format($parts[0] + 1) . PHP_EOL;  // 11\necho implode("-", $parts);         // 10-20-30' },
    ]) +
    mistakesList([
      t("После split элементы — строки: «10» + 1 в JavaScript даст «101». Для арифметики преобразуйте в число.", "After split the items are strings: \"10\" + 1 gives \"101\" in JavaScript. Convert to a number before doing arithmetic."),
      t("В Python join читается наоборот: разделитель стоит слева, \"-\".join(parts). В Blockly это просто другой режим того же блока.", "In Python join reads backwards: the delimiter comes first, \"-\".join(parts). In Blockly it is just another mode of the same block."),
      t("Разделитель может быть длиннее одного символа, и тогда его вырезают целиком: split(\"a => b\", \" => \") даёт два куска.", "A delimiter can be longer than one character and is then cut out whole: split(\"a => b\", \" => \") gives two pieces."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — «сделать список из текста … с разделителем …» и «собрать текст из списка … с разделителем …»; режим переключается в выпадающем списке блока.",
      "In Blockly: the Lists category — “make list from text … with delimiter …” and “make text from list … with delimiter …”; the mode is a dropdown on the same block."
    )),

  list_operations: () =>
    `<h4>${t("Операции со списками: переворот, повтор, позиция", "List operations: reverse, repeat, position")}</h4>` +
    `<p>${t(
      "Список можно развернуть задом наперёд, собрать из одного элемента нужное число раз и найти, на какой позиции стоит элемент. Все три блока — выражения: они возвращают новый список или число, а исходный список не портят.",
      "A list can be reversed, built from one element repeated a number of times, or searched for the position of an element. All three blocks are values: they return a new list or a number and leave the original list intact."
    )}</p>` +
    partsList([
      [t("развернуть", "reverse"), t("новый список с тем же содержимым в обратном порядке", "a new list with the same items in opposite order")],
      [t("повторить", "repeat"), t("список из одного элемента, повторённого n раз", "a list of one item repeated n times")],
      [t("позиция элемента", "item position"), t("в Blockly считается с 1, 0 — элемента нет", "Blockly counts from 1, 0 means the item is absent")],
      [t("длина", "length"), t("сколько элементов в списке, у пустого — 0", "how many items the list has, 0 when empty")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: [1, 2, 3] со всех сторон", "Example: looking at [1, 2, 3] from all sides")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const xs = [1, 2, 3];\nconsole.log(xs.slice().reverse());  // [3,2,1]\nconsole.log(xs.indexOf(2));         // 1 — отсчёт с 0\nconsole.log(Array(5).fill("ха"));   // пять повторений' },
      { label: "Python", code: 'xs = [1, 2, 3]\nprint(list(reversed(xs)))  # [3, 2, 1]\nprint(xs.index(2))         # 1 — отсчёт с 0\nprint(["ха"] * 5)          # 5 повторений' },
      { label: "Lua", code: 'local xs = {1, 2, 3}\nlocal rev = {}\nfor i = #xs, 1, -1 do rev[#rev + 1] = xs[i] end\nprint(rev[1])  -- 3\nprint(#xs)     -- 3 — длина' },
      { label: "PHP", code: '<?php\n$xs = [1, 2, 3];\nprint_r(array_reverse($xs));        // 3, 2, 1\nvar_dump(array_search(2, $xs));     // int(1) — с 0\necho count($xs) . PHP_EOL;          // 3' },
    ]) +
    mistakesList([
      t("Блок позиции отдаёт 0, когда элемента в списке нет, — а 0 похож на настоящее число. Проверяйте «не найдено» отдельно.", "The position block returns 0 when the item is not in the list — and 0 looks like a real number. Check “not found” explicitly."),
      t("Разворот в JavaScript на месте (xs.reverse()) портит исходный список; через slice() — безопасный копия-вариант.", "Reversing in place in JavaScript (xs.reverse()) ruins the original list; slice().reverse() works on a copy."),
      t("Элементы нужно сравнивать целиком: 2 и \"2\" — разные значения для поиска позиции.", "Items must match exactly: 2 and \"2\" are different values for a position search."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — «изменить порядок на обратный …», «создать список из элемента …, повторяющегося … раз», «в списке … найти первое вхождение элемента …» и «длина …».",
      "In Blockly: the Lists category — “reverse …”, “create list with item … repeated … times”, “in list … find first occurrence of item …” and “length of …”."
    )),
};

/**
 * Возвращает HTML-содержимое темы справочника (для тестов и переиспользования).
 */
export function glossaryTopicHtml(topic: GlossaryTopicId): string {
  return TOPIC_CONTENT[topic]();
}

/**
 * Рендерит в контейнер справочные секции тем, привязанных к задаче.
 * Темы берутся из `tasks[taskId].infoTopics`; пустой список скрывает контейнер.
 */
export function mountGlossaryForTask(container: HTMLElement, taskId: TaskId): void {
  const topics = tasks[taskId].infoTopics ?? [];
  container.innerHTML = "";
  container.style.display = topics.length === 0 ? "none" : "";
  for (const topic of topics) {
    const div = document.createElement("div");
    div.className = "console-output-info";
    div.dataset.glossaryTopic = topic;
    div.innerHTML = glossaryTopicHtml(topic);
    container.appendChild(div);
  }
}
