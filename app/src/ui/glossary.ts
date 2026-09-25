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
  | "user_input";

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
