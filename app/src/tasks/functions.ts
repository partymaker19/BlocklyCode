// Задачи группы «functions»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { hasAncestorOfType } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateFirstFunction(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  // Засчитываем и русский, и английский вариант приветствия
  const greetLines = lines.filter((l) => /^(привет, мир!|hello, world!)$/i.test(l));
  const ok = greetLines.length >= 3;

  let usedDef = false;
  let callCount = 0;
  let printInsideDef = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "procedures_defnoreturn") usedDef = true;
    if (t === "procedures_callnoreturn") callCount++;
    if (t === "text_print" || t === "add_text") {
      hasPrint = true;
      if (hasAncestorOfType(b, "procedures_defnoreturn")) printInsideDef = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedDef && callCount >= 2 && printInsideDef && count <= 10) stars = 3;
    else if (usedDef && callCount >= 1 && hasPrint && count <= 14) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateFunctionWithParam(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  // Приветствия вида «Привет, Имя!» / «Hello, Name!» — как минимум 2 разных имени
  const greetRe = /^(привет, .+!|hello, .+!)$/i;
  const greetNames = new Set<string>();
  for (const l of lines) {
    const m = l.match(greetRe);
    if (m) greetNames.add(l.replace(/^привет,/i, "hello,").toLowerCase());
  }
  const ok = greetNames.size >= 2;

  let usedDef = false;
  let callCount = 0;
  let callWithArg = false;
  let usedJoin = false;
  let printInsideDef = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "procedures_defnoreturn") usedDef = true;
    if (t === "procedures_callnoreturn") {
      callCount++;
      try {
        if (typeof (b as any).getInput === "function" && (b as any).getInput("ARG0")) {
          callWithArg = true;
        }
      } catch {}
    }
    if (t === "text_join") usedJoin = true;
    if (t === "text_print" || t === "add_text") {
      if (hasAncestorOfType(b, "procedures_defnoreturn")) printInsideDef = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedDef && callWithArg && usedJoin && printInsideDef && callCount >= 2 && count <= 12)
      stars = 3;
    else if (usedDef && callCount >= 2 && count <= 18) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateFunctionReturn(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  // Вывод должен содержать число 7 (результат add(3, 4) — числа свободные)
  const ok = lines.some((l) => /(^|\b)7(\b|$)/.test(l));

  let usedDefReturn = false;
  let returnAttached = false;
  let callReturnCount = 0;
  let usedArith = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "procedures_defreturn") {
      usedDefReturn = true;
      try {
        const target =
          typeof (b as any).getInputTargetBlock === "function"
            ? (b as any).getInputTargetBlock("RETURN")
            : null;
        if (target) returnAttached = true;
      } catch {}
    }
    if (t === "procedures_callreturn") callReturnCount++;
    if (t === "math_arithmetic") {
      const op =
        typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
      if (op === "ADD") usedArith = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedDefReturn && returnAttached && callReturnCount >= 1 && count <= 11) stars = 3;
    else if (usedDefReturn && callReturnCount >= 1 && count <= 16) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

export const functionsTasks: Pick<
  TaskRegistry,
  "first_function" | "function_with_param" | "function_return"
> = {
  first_function: {
    id: "first_function",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 24: Моя первая функция" : "Task 24: My first function",
    description: (lang) =>
      lang === "ru"
        ? "Создайте функцию, которая печатает <strong>Hello, world!</strong>, и вызовите её <strong>три раза</strong>: в окне вывода строка должна появиться трижды.<br><br><strong>Зачем нужны функции:</strong> функция — это «именованный кусок программы». Вы описываете действия <em>один раз</em>, а потом запускаете их сколько угодно раз по имени — не копируя блоки."
        : "Create a function that prints <strong>Hello, world!</strong> and call it <strong>three times</strong>: the output must show the line three times.<br><br><strong>Why functions:</strong> a function is a “named piece of a program”. You describe the actions <em>once</em> and then run them any number of times by name — without copying blocks.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Функции» нажмите кнопку создания функции — на поле появится блок-фигура «создать функцию …». Впишите вместо «выполнить что-то» имя, например greet.\n2. Внутрь фигуры (слот «выполнить») положите «Добавить текст … цвет …» и впишите Hello, world!.\n3. В «Функциях» появился блок вызова вашей функции — перетащите его на поле под фигуру (или ПКМ по фигуре → «создать вызов»).\n4. Продублируйте вызов ещё дважды — всего три вызова.\n5. Запустите код: три строки Hello, world!. Нажмите «Проверить решение»."
        : "Step by step:\n1. In the Functions category press the create-function button — a “make a function …” puzzle block appears. Replace “do something” with a name, e.g. greet.\n2. Inside the figure (the “do” slot) put “Add text … color …” and type Hello, world!.\n3. A call block for your function appeared in Functions — drag it onto the canvas below the figure (or right-click the figure → “create call”).\n4. Duplicate the call twice more — three calls in total.\n5. Run the code: three lines of Hello, world!. Press “Check solution”.",
    validate: validateFirstFunction,
  },
  function_with_param: {
    id: "function_with_param",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 25: Функция с параметром" : "Task 25: Function with a parameter",
    description: (lang) =>
      lang === "ru"
        ? "Создайте функцию <strong>greet</strong> с параметром <strong>name</strong>, которая печатает приветствие «Привет, &lt;имя&gt;!», и вызовите её дважды: с именами <strong>Аня</strong> и <strong>Боря</strong>. Вывод:<br><strong>Привет, Аня!</strong><br><strong>Привет, Боря!</strong><br><br><strong>Параметр</strong> — это переменная внутри функции. Чтобы добавить параметр: нажмите шестерёнку на блоке функции и перетащите «имя параметра» в список. Строку приветствия соберите блоком «создать текст из»: текст «Привет, », переменная name, текст «!»."
        : "Create a function <strong>greet</strong> with a parameter <strong>name</strong> that prints a greeting “Hello, &lt;name&gt;!”, and call it twice: with <strong>Anya</strong> and <strong>Borya</strong>. Output:<br><strong>Hello, Anya!</strong><br><strong>Hello, Borya!</strong><br><br>A <strong>parameter</strong> is a variable inside the function. To add one: press the gear on the function block and drag “parameter name” into the list. Assemble the greeting with the “create text with” block: text “Hello, ”, the name variable, text “!”.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте функцию greet (как в задаче 24).\n2. Нажмите шестерёнку на блоке функции и перетащите «имя параметра» в «параметры»; назовите его name.\n3. Внутрь фигуры положите «Добавить текст … цвет …», а в него — «создать текст из» с тремя элементами: текст Привет\\,  (с пробелом), переменная name, текст !\n4. Перетащите блок вызова greet и в поле параметра укажите Аня; продублируйте вызов и укажите Боря.\n5. Запустите код: две строки приветствия. Нажмите «Проверить решение»."
        : "Step by step:\n1. Create a function greet (like in task 24).\n2. Press the gear on the function block and drag “parameter name” into “parameters”; call it name.\n3. Inside the figure put “Add text … color …”, and into it a “create text with” block with three items: text Hello\\,  (with a space), the name variable, text !\n4. Drag a greet call block and set the parameter to Anya; duplicate the call and set Borya.\n5. Run the code: two greeting lines. Press “Check solution”.",
    validate: validateFunctionWithParam,
  },
  function_return: {
    id: "function_return",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 26: Функция с возвратом" : "Task 26: Function with a return value",
    description: (lang) =>
      lang === "ru"
        ? "Создайте функцию <strong>add</strong> с параметрами <strong>a</strong> и <strong>b</strong>, которая <strong>возвращает</strong> их сумму (a + b). Вызовите её и выведите результат: должно получиться <strong>7</strong> (например, add(3, 4)).<br><br>Функция с возвратом — это «вычислитель»: она не просто что-то делает, а выдаёт значение, которое можно вложить прямо в печать. Используйте блок «Функции» с возвратом и блок <strong>«вернуть»</strong> внутри него."
        : "Create a function <strong>add</strong> with parameters <strong>a</strong> and <strong>b</strong> that <strong>returns</strong> their sum (a + b). Call it and print the result: it should be <strong>7</strong> (e.g. add(3, 4)).<br><br>A return-function is a “calculator”: it doesn’t just do things — it produces a value you can plug straight into a print block. Use the Functions block with return and the <strong>“return”</strong> block inside it.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В «Функциях» возьмите блок «создать функцию … вернуться» (с возвратом значения); имя — add.\n2. Через шестерёнку добавьте два параметра: a и b.\n3. В слот «вернуть» вложите «+ − × ÷» с операцией «+»; в его поля — переменные a и b.\n4. Возьмите «Добавить текст … цвет …», а в него — блок вызова add; в поля вызова — числа 3 и 4.\n5. Запустите код: в выводе 7. Нажмите «Проверить решение»."
        : "Step by step:\n1. In Functions take the “make a function … return” block (with a return value); name it add.\n2. Via the gear add two parameters: a and b.\n3. Into the “return” slot put the “+ − × ÷” block with the “+” operation; its fields are variables a and b.\n4. Take “Add text … color …”, and into it an add call block; set the call inputs to numbers 3 and 4.\n5. Run the code: the output shows 7. Press “Check solution”.",
    validate: validateFunctionReturn,
  },
};
