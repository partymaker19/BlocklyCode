import * as Blockly from "blockly";
import { getAppLang } from "./localization";
import { countNonShadowBlocks, getNonShadowBlocks } from "./workspaceUtils";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
  // Кнопка перехода к следующей задаче (опционально)
  nextButton?: HTMLButtonElement | null;
  // Кнопка перехода к предыдущей задаче (опционально)
  prevButton?: HTMLButtonElement | null;
};

// ---------- Прогресс и порядок задач ----------
export type TaskId =
  | "hello_world"
  | "add_2_7"
  | "var_my_age"
  | "calc_sum"
  | "greet_concat"
  | "inc_counter"
  | "discount_calc"
  | "even_or_odd"
  | "time_of_day"
  | "first_loop"
  | "sum_1_to_n"
  | "guess_game"
  | "list_foreach"
  | "sublist_foreach"
  | "list_filter_even"
  | "list_filter_even_min_max"
  | "list_filter_even_avg"
  | "list_filter_even_median"
  | "list_sum_even_positions"
  | "first_condition"
  | "a1_number_analyzer"
  | "sum_array"
  | "min_max"
  | "char_freq";

export type TaskDifficulty = "basic" | "advanced";

type TaskDef = {
  id: TaskId;
  difficulty: TaskDifficulty;
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // может содержать HTML
  hint: (lang: "ru" | "en") => string;
  validate: (
    ws: Blockly.WorkspaceSvg,
  ) => Promise<{ ok: boolean; stars: number }>;
};

const tasks: Record<TaskId, TaskDef> = {
  hello_world: {
    id: "hello_world",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 1: Hello World" : "Task 1: Hello World",
    description: (lang) =>
      lang === "ru"
        ? "Соберите блоки так, чтобы в окне вывода появилась строка: <strong>Hello World!</strong><br><br><strong>Как проверить решение:</strong> добавьте нужные блоки на рабочее поле, затем справа в редакторе нажмите кнопку «▶» («Запустить код»), а после этого нажмите «Проверить решение»."
        : "Assemble blocks so that the output shows: <strong>Hello World!</strong><br><br><strong>How to check:</strong> add the needed blocks to the workspace, then press “▶” (“Run code”) in the editor, and finally press “Check solution”.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок из Текст «Добавить текст … цвет …» и текстовый литерал (например, «создать текст из»)."
        : "Hint: use the Text block “Add text … color …” and a text literal (e.g. “create text with”).",
    validate: validateHelloWorld,
  },
  add_2_7: {
    id: "add_2_7",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 2: 2 + 7" : "Task 2: 2 + 7"),
    description: (lang) =>
      lang === "ru"
        ? "Сложите <strong>2</strong> и <strong>7</strong> и выведите результат в окно вывода: должно получиться <strong>9</strong>. Дополнительно: после того как получилось <strong>9</strong>, попробуйте поменять операцию на <strong>−</strong>, <strong>×</strong> или <strong>÷</strong> и посмотрите, как меняется результат (но проверка засчитывает только <strong>2 + 7</strong>)."
        : "Add <strong>2</strong> and <strong>7</strong> and print the result to the output: it should be <strong>9</strong>. Bonus: after you get <strong>9</strong>, try changing the operation to <strong>−</strong>, <strong>×</strong>, or <strong>÷</strong> and see how the result changes (but validation checks only <strong>2 + 7</strong>).",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок арифметики из категории Математика и блок из Текст «Добавить текст … цвет …»."
        : "Hint: use the arithmetic block from Math and the Text block “Add text … color …”.",
    validate: validateAdd2Plus7,
  },
  var_my_age: {
    id: "var_my_age",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 3: Моя первая переменная"
        : "Task 3: My first variable",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную с именем <strong>myAge</strong> и сохраните в неё число. Затем выведите значение этой переменной в окно вывода.<br><br><strong>Пример:</strong> вы устанавливаете значение <strong>10</strong>, и в окне вывода появляется <strong>10</strong>.<br><br><strong>Дополнительно (для исследования):</strong> после того как получилось, попробуйте изменить число в переменной или создать новую переменную с другим именем (например, <strong>birthYear</strong>) и вывести её."
        : "Create a variable named <strong>myAge</strong> and store a number in it. Then print the value of this variable to the output.<br><br><strong>Example:</strong> you set it to <strong>10</strong>, and the output shows <strong>10</strong>.<br><br><strong>Bonus (explore):</strong> after it works, try changing the number or creating a new variable with another name (e.g. <strong>birthYear</strong>) and printing it.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте «создать переменную…» в категории Переменные, затем блок присваивания значения (например, число из Математики) и блок из Текст «Добавить текст … цвет …»."
        : 'Hint: use "create variable..." in Variables, then a set-value block (e.g. a number from Math) and the Text block “Add text … color …”.',
    validate: validateVarMyAge,
  },
  calc_sum: {
    id: "calc_sum",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 4: Простой калькулятор"
        : "Task 4: Simple calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте две переменные: <strong>a</strong> и <strong>b</strong>. Присвойте им числа. Создайте третью переменную <strong>sum</strong> и сохраните в неё результат сложения <strong>a</strong> и <strong>b</strong>. Выведите значение <strong>sum</strong>."
        : "Create two variables: <strong>a</strong> and <strong>b</strong>. Assign numbers to them. Create a third variable <strong>sum</strong> and store <strong>a + b</strong> in it. Print <strong>sum</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: задайте a и b через блоки переменных, затем соберите a+b в блоке арифметики и присвойте в sum. Потом выведите sum."
        : "Hint: set a and b using variable blocks, build a+b with an arithmetic block and assign to sum, then print sum.",
    validate: validateCalcSum,
  },
  greet_concat: {
    id: "greet_concat",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 5: Машина для приветствий"
        : "Task 5: Greeting machine",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте текстовую переменную <strong>name</strong> и сохраните в неё ваше имя (например, <strong>"Anna"</strong>). Используйте соединение строк (конкатенацию), чтобы собрать и вывести фразу <strong>"Hello, " + name + "!"</strong>.<br><br><strong>Для PHP:</strong> <strong>"Hello, " . $name . "!"</strong> (в PHP строки склеиваются через <code>.</code>).'
        : 'Create a text variable <strong>name</strong> and store your name in it (for example, <strong>"Anna"</strong>). Use string concatenation to build and print <strong>"Hello, " + name + "!"</strong>.<br><br><strong>For PHP:</strong> <strong>"Hello, " . $name . "!"</strong> (PHP uses <code>.</code> to concatenate strings).',
    hint: (lang) =>
      lang === "ru"
        ? 'Подсказка: используйте блоки Переменные («присвоить» и «получить»), блок Текст «создать текст из» и блок Текст «Добавить текст … цвет …». Важно: после запятой в "Hello," добавьте пробел — должно получиться "Hello, ".'
        : "Hint: use variables (set/get), the Text block “create text with”, and the Text block “Add text … color …”.",
    validate: validateGreetConcat,
  },
  inc_counter: {
    id: "inc_counter",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 6: Счётчик инкремент"
        : "Task 6: Increment counter",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>counter</strong> со значением <strong>0</strong>. Затем увеличьте её значение на <strong>1</strong> (используйте блок <strong>counter = counter + 1</strong>). Выведите новое значение."
        : "Create a variable <strong><code>counter</code></strong> with the value <strong>0</strong>. Then increase it by <strong>1</strong> (use <strong>counter = counter + 1</strong>). Print the new value.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: сначала counter=0, потом сделайте counter=counter+1 и выведите counter."
        : "Hint: first set counter=0, then do counter=counter+1 and print counter.",
    validate: validateIncCounter,
  },
  discount_calc: {
    id: "discount_calc",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 7: Умный калькулятор скидок"
        : "Task 7: Smart Discount Calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>price</strong> и сохраните в неё цену товара (например, <strong>1000</strong>). Создайте вторую переменную <strong>discount</strong> и сохраните в неё размер скидки в процентах (например, <strong>15</strong>). Вычислите и выведите <strong>финальную цену</strong> по формуле: <strong>price - (price * discount / 100)</strong>."
        : "Create a variable <strong><code>price</code></strong> and store the item price in it (e.g. <strong>1000</strong>). Create a second variable <strong><code>discount</code></strong> and store the discount percent in it (e.g. <strong>15</strong>). Compute and print the <strong>final price</strong> using: <strong>price - (price * discount / 100)</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: понадобятся блоки Переменные («присвоить» и «получить») и блоки арифметики из Математики. Соберите выражение по шагам и выведите результат."
        : "Hint: use variables (set/get) and arithmetic blocks. Build the expression step by step and print the result.",
    validate: validateDiscountCalc,
  },
  first_condition: {
    id: "first_condition",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 8: Первое условие" : "Task 8: First condition",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>temperature</strong> и сохраните в неё какое-либо число. Задача: проверьте, что температура выше нуля. Если это так — выведите фразу <strong>"The weather is warm"</strong>. Если нет — не выводите ничего.'
        : 'Create a variable <strong>temperature</strong> and store any number in it. Task: check that the temperature is above zero. If yes, print <strong>"The weather is warm"</strong>. If not, print nothing.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте если/иначе (Логика) и сравнение (Логика), например temperature > 0."
        : "Hint: use if/else (Logic) and a comparison (Logic), e.g. temperature > 0.",
    validate: validateFirstCondition,
  },
  even_or_odd: {
    id: "even_or_odd",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 9: Чётное или нечётное" : "Task 9: Even or Odd",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Напишите программу, которая определяет, является ли число <strong>чётным</strong> или <strong>нечётным</strong>, и выводит сообщение:<br><br>Если число чётное, выведите <strong>"Число чётное"</strong> (или <strong>"The number is even"</strong>).<br>Если число нечётное, выведите <strong>"Число нечётное"</strong> (или <strong>"The number is odd"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Determine whether the number is <strong>even</strong> or <strong>odd</strong>, and print a message:<br><br>If even, print <strong>"The number is even"</strong>.<br>If odd, print <strong>"The number is odd"</strong>.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте если/иначе (Логика), остаток от деления (%) и сравнение number % 2 == 0. Чтобы добавить «иначе если» или «иначе», откройте шестерёнку в блоке «если» и добавьте нужные секции."
        : "Hint: use if/else (Logic), modulo (%) and the check number % 2 == 0.",
    validate: validateEvenOrOdd,
  },
  time_of_day: {
    id: "time_of_day",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 10: Время суток" : "Task 10: Time of Day",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>hour</strong> и сохраните в неё текущий час (число от <strong>0</strong> до <strong>23</strong>). Напишите программу, которая определяет время суток и выводит сообщение:<br><br>Если <strong>hour</strong> от <strong>6</strong> до <strong>11</strong> → <strong>"Good morning!"</strong><br>Если <strong>hour</strong> от <strong>12</strong> до <strong>17</strong> → <strong>"Good afternoon!"</strong><br>Если <strong>hour</strong> от <strong>18</strong> до <strong>22</strong> → <strong>"Good evening!"</strong><br>Иначе → <strong>"Good night!"</strong>'
        : 'Create a variable <strong>hour</strong> and store the current hour (0 to 23). Determine the time of day and print:<br><br>If <strong>hour</strong> is 6..11 → <strong>"Good morning!"</strong><br>If 12..17 → <strong>"Good afternoon!"</strong><br>If 18..22 → <strong>"Good evening!"</strong><br>Else → <strong>"Good night!"</strong>',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте цепочку если/иначе если/иначе, сравнения (>=, <=) и вывод текста. Чтобы добавить «иначе если» или «иначе», откройте шестерёнку в блоке «если» и добавьте нужные секции."
        : "Hint: use an if/else if/else chain, comparisons (>=, <=) and print blocks.",
    validate: validateTimeOfDay,
  },
  first_loop: {
    id: "first_loop",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 11: Первый цикл" : "Task 11: First Loop",
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая выводит в консоль все числа от <strong>0</strong> до <strong>10</strong> (включительно), каждое число с новой строки."
        : "Write a program that prints all numbers from <strong>0</strong> to <strong>10</strong> (inclusive), one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте цикл for (Циклы) со счётчиком i: от 0 до 10, шаг 1. Внутри цикла выведите текущее значение i."
        : "Hint: use a for loop (Loops) with a counter i: from 0 to 10, step 1. Print i inside the loop.",
    validate: validateFirstLoop,
  },
  sum_1_to_n: {
    id: "sum_1_to_n",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 12: Сумма чисел" : "Task 12: Sum of Numbers",
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая вычисляет сумму всех целых чисел от <strong>1</strong> до <strong>N</strong>, где <strong>N</strong> сохранено в переменной <strong>n</strong>.<br><br>Пример: при <strong>n = 5</strong> нужно вывести <strong>15</strong>, при <strong>n = 10</strong> — <strong>55</strong>."
        : "Write a program that computes the sum of all integers from <strong>1</strong> to <strong>N</strong>, where <strong>N</strong> is stored in the variable <strong>n</strong>.<br><br>Example: for <strong>n = 5</strong> print <strong>15</strong>, for <strong>n = 10</strong> print <strong>55</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте цикл «цикл i от ... до ... с шагом ...» (Циклы) со счётчиком от 1 до n и переменную-аккумулятор sum (sum = sum + i). Затем выведите sum."
        : "Hint: use a for loop (Loops) from 1 to n and an accumulator variable sum (sum = sum + i). Then print sum.",
    validate: validateSum1ToN,
  },
  guess_game: {
    id: "guess_game",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 13: Игра «Угадай число»"
        : "Task 13: Number Guessing Game",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте программу, в которой компьютер <strong>загадывает</strong> число от <strong>1</strong> до <strong>10</strong> (сохраните его в переменной <strong>secret</strong>), а пользователь пытается его угадать.<br><br>Используйте переменную <strong>guess</strong> для догадки. В цикле спрашивайте число у пользователя и сообщайте:<br>— если догадка меньше секрета: <strong>"Загаданное число больше!"</strong><br>— если догадка больше секрета: <strong>"Загаданное число меньше!"</strong><br>— если равно: <strong>"Поздравляем! Вы угадали число!"</strong>.'
        : 'Create a program where the computer chooses a number from <strong>1</strong> to <strong>10</strong> (store it in <strong>secret</strong>), and the user tries to guess it.<br><br>Use <strong>guess</strong> for the user\'s guess. In a loop, ask for a number and print:<br>— if guess is lower: <strong>"The secret number is higher!"</strong><br>— if guess is higher: <strong>"The secret number is lower!"</strong><br>— if equal: <strong>"Congratulations! You guessed the number!"</strong><br><br>Use the <strong>py_input_number</strong> block (Custom) for input.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте while (Циклы) «пока guess ≠ secret». Для ввода используйте блок «Ввод числа» (py_input_number, Custom). Внутри — если/иначе если/иначе для трёх случаев: меньше, больше, равно."
        : 'Hint: use a while loop (Loops) "while guess != secret" and an if/else if/else chain for lower/higher/equal.',
    validate: validateGuessGame,
  },
  list_foreach: {
    id: "list_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 14: Список и цикл forEach"
        : "Task 14: List and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и сохраните его в переменную <strong>list</strong> (можно <strong>numbers</strong>).<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента k в списке»</strong> — это и есть <strong>forEach</strong>. Внутри цикла:<br>1) выведите текущий элемент (каждый с новой строки)<br>2) посчитайте сумму элементов в переменной <strong>sum</strong> и выведите сумму после цикла (должно получиться <strong>15</strong>).<br><br><strong>Важно:</strong> список может хранить не только числа, но и текст (строки), а иногда даже смешанные значения. А цикл <strong>forEach</strong> удобен именно для <strong>перебора элементов списка</strong>: он «идёт по списку» и даёт вам текущий элемент, в отличие от циклов <strong>for</strong> со счётчиком (когда вы управляете индексами/границами вручную) или <strong>while</strong> (когда повторяем, пока условие истинно)."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and store it in <strong>list</strong> (or <strong>numbers</strong>).<br><br>Then use the Loops block <strong>“for each item k in list”</strong> — this is the <strong>forEach</strong> idea. Inside the loop:<br>1) print the current item (one per line)<br>2) compute the sum in <strong>sum</strong> and print the final sum after the loop (it should be <strong>15</strong>).<br><br><strong>Note:</strong> a list can store not only numbers but also text (strings), and sometimes even mixed values. The <strong>forEach</strong> loop is great specifically for <strong>iterating over list elements</strong>: it walks through the list and gives you the current item, unlike a counter-based <strong>for</strong> (where you manage indexes/bounds) or <strong>while</strong> (repeat while a condition is true).",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: list=[1,2,3,4,5], sum=0. Внутри «для каждого элемента…»: вывести k и сделать sum = sum + k. После цикла вывести sum."
        : "Hint: list=[1,2,3,4,5], sum=0. Inside “for each item …”: print k and do sum = sum + k. After the loop print sum.",
    validate: validateListForEach,
  },
  sublist_foreach: {
    id: "sublist_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 15: Подсписок и forEach"
        : "Task 15: Sublist and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем возьмите из него <strong>подсписок</strong> с элементами <strong>3, 4, 5, 6, 7</strong> (то есть часть списка) и сохраните в переменную <strong>sub</strong>.<br><br>Используйте блок <strong>«для каждого элемента k в списке»</strong> (Циклы), чтобы вывести элементы подсписка <strong>sub</strong> по одному (каждый с новой строки)."
        : "Create a list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then take a <strong>sublist</strong> containing <strong>3, 4, 5, 6, 7</strong> (a part of the list) and store it in <strong>sub</strong>.<br><br>Use the <strong>“for each item k in list”</strong> block (Loops) to print items of <strong>sub</strong> one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок из категории Списки «взять подсписок» (lists_getSublist). Потом forEach по sub и вывод k."
        : "Hint: use the Lists block “get sub-list” (lists_getSublist). Then forEach over sub and print k.",
    validate: validateSublistForEach,
  },
  list_filter_even: {
    id: "list_filter_even",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 16: Фильтрация списка"
        : "Task 16: List filtering",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента k в списке»</strong>, чтобы перебрать элементы. Внутри цикла с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа и:<br>1) выведите каждое чётное число (каждое с новой строки)<br>2) посчитайте сумму чётных чисел в переменной <strong>sum</strong><br><br>После цикла выведите сумму. Должны получиться числа: <strong>2 4 6 8 10</strong> и сумма <strong>30</strong>."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then use the Loops block <strong>“for each item k in list”</strong> to iterate. Inside the loop, use an <strong>if</strong> to keep only <strong>even</strong> numbers and:<br>1) print each even number (one per line)<br>2) compute the sum of even numbers in <strong>sum</strong><br><br>After the loop, print the sum. You should get: <strong>2 4 6 8 10</strong> and the sum <strong>30</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: проверка чётности: «остаток от деления» (k на 2) равен 0 (Математика → остаток от деления, Логика → сравнение) или блок «k чётное». Внутри если/иначе: вывести k и сделать sum = sum + k. После цикла вывести sum."
        : "Hint: even check: remainder of k ÷ 2 equals 0 (Math → remainder of, Logic → compare) or the “is even” block. Inside if: print k and do sum = sum + k. After the loop print sum.",
    validate: validateListFilterEven,
  },
  list_filter_even_min_max: {
    id: "list_filter_even_min_max",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 17: Min/Max среди чётных"
        : "Task 17: Min/Max among evens",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong> и выводите каждое чётное число (каждое с новой строки).<br><br>После цикла найдите и выведите:<br>— <strong>min=2</strong> (минимум среди чётных)<br>— <strong>max=10</strong> (максимум среди чётных)<br><br>Подсказка: используйте блок <strong>Математика → «сумма списка»</strong> и в выпадающем списке выберите MIN/MAX для списка evens."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add even numbers to a new list <strong>evens</strong> and print each even number (one per line).<br><br>After the loop, find and print:<br>— <strong>min=2</strong> (minimum among evens)<br>— <strong>max=10</strong> (maximum among evens)<br><br>Hint: use <strong>Math → “math on list”</strong> with MIN/MAX on the evens list.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: создайте evens (пустой список). Проверка чётности: «остаток от деления» (k на 2) равен 0 или блок «k чётное». Внутри если/иначе: добавьте k в evens (Списки → вставить/добавить в конец) и выведите k. После цикла: Математика → «сумма списка» и в выпадающем списке выберите MIN/MAX по evens, затем выведите min=… и max=…"
        : "Hint: create evens (empty list). Even check: remainder of k ÷ 2 equals 0 or the “is even” block. Inside if: add k to evens (Lists → set/insert at end) and print k. After the loop: Math → “math on list” MIN/MAX on evens and print min=… and max=…",
    validate: validateListFilterEvenMinMax,
  },
  list_filter_even_avg: {
    id: "list_filter_even_avg",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 18: Количество и среднее"
        : "Task 18: Count and average",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Для чётных чисел нужно посчитать:<br>— <strong>sum</strong> (сумма чётных)<br>— <strong>count</strong> (сколько чётных чисел)<br>— <strong>avg</strong> (среднее): <code>avg = sum / count</code><br><br>Выведите результат тремя строками:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>"
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. For even numbers compute:<br>— <strong>sum</strong> (sum of evens)<br>— <strong>count</strong> (how many evens)<br>— <strong>avg</strong> (average): <code>avg = sum / count</code><br><br>Print three lines:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: перед циклом sum=0 и count=0. Внутри если/иначе для чётных: sum = sum + k и count = count + 1. После цикла: avg = sum / count. Проверка чётности: «остаток от деления» (k на 2) равен 0 или блок «k чётное»."
        : "Hint: before the loop set sum=0 and count=0. Inside if for evens: sum = sum + k and count = count + 1. After the loop: avg = sum / count. Even check: remainder of k ÷ 2 equals 0 or the “is even” block.",
    validate: validateListFilterEvenAvg,
  },
  list_filter_even_median: {
    id: "list_filter_even_median",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 19: Средний элемент чётных"
        : "Task 19: Middle even element",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента k в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong>.<br><br>После цикла выведите 2 строки:<br><strong>count=5</strong> (сколько чётных чисел в evens)<br><strong>median=6</strong> (средний элемент списка evens — для 5 элементов это 3‑й)."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate with <strong>“for each item k in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add evens into a new list <strong>evens</strong>.<br><br>After the loop print 2 lines:<br><strong>count=5</strong> (how many evens in evens)<br><strong>median=6</strong> (the middle element of evens — for 5 elements it's the 3rd).",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: создайте evens как пустой список. Внутри если/иначе добавляйте k в конец evens. Количество: Списки → «длина списка» (lists_length). Средний элемент: Списки → «взять элемент #» (lists_getIndex) с индексом 3."
        : "Hint: create evens as an empty list. Inside if add k to the end of evens. Count: Lists → “length of list” (lists_length). Middle element: Lists → “get item #” (lists_getIndex) with index 3.",
    validate: validateListFilterEvenMedian,
  },
  list_sum_even_positions: {
    id: "list_sum_even_positions",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 20: Сумма на чётных позициях"
        : "Task 20: Sum at even positions",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Посчитайте сумму элементов на <strong>чётных позициях</strong> (позиции считаем как 1‑я, 2‑я, 3‑я…). То есть нужно сложить элементы на позициях <strong>2, 4, 6, 8, 10</strong>.<br><br>Выведите результат строкой: <strong>sum=19</strong>"
        : "Create the list <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> and store it in <strong>list</strong>.<br><br>Compute the sum of elements at <strong>even positions</strong> (positions are 1st, 2nd, 3rd…). That means add elements at positions <strong>2, 4, 6, 8, 10</strong>.<br><br>Print: <strong>sum=19</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок из Циклы «цикл по i от … до … с шагом …». Внутри: блок Логика «если» + проверка «i чётное». Если условие истинно — используйте блок из Списки «в списке … взять № …» и добавьте его к sum."
        : "Hint: use the Loops block “count with i from … to … by …”. Inside: if i is even, get item #i from the list (Lists → “get item #”) and add it to sum.",
    validate: validateListSumEvenPositions,
  },
  a1_number_analyzer: {
    id: "a1_number_analyzer",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача A1: Анализ числа" : "Task A1: Number Analyzer",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Программа должна определить и вывести два факта о нём (каждый с новой строки):<br>1) чётное или нечётное (например, <strong>"The number is even"</strong>)<br>2) положительное, отрицательное или ноль (например, <strong>"The number is positive"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Print two facts (each on a new line):<br>1) even or odd (e.g. <strong>"The number is even"</strong>)<br>2) positive, negative, or zero (e.g. <strong>"The number is positive"</strong>).',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте если/иначе, сравнения (>, <, ==) и остаток от деления (%)."
        : "Hint: use if/else, comparisons (>, <, ==) and modulo (%).",
    validate: validateNumberAnalyzer,
  },
  sum_array: {
    id: "sum_array",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача A2: Сумма массива" : "Task A2: Array sum",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и выведите их сумму: <strong>15</strong>. Можно использовать блоки из категории Списки/Математика или цикл."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and print their sum: <strong>15</strong>. You may use list/math blocks or a loop.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: попробуйте блок «Математика → сумма списка» (в выпадающем выбрать SUM) или цикл forEach."
        : "Hint: try ‘math on list’ (SUM) or a forEach loop.",
    validate: validateSumArray,
  },
  min_max: {
    id: "min_max",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача A3: Минимум и максимум" : "Task A3: Min and Max",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список <code>[5, 1, 9, 3, 7]</code> и выведите минимальное и максимальное значения: <strong>min=1</strong> и <strong>max=9</strong>. Допустимо выводить в одну строку или в две."
        : "Create a list <code>[5, 1, 9, 3, 7]</code> and print min and max: <strong>min=1</strong> and <strong>max=9</strong>. One or two lines are fine.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок «Математика → сумма списка» (в выпадающем выбрать MIN/MAX) или напишите цикл."
        : "Hint: use ‘math on list’ MIN/MAX or write a loop.",
    validate: validateMinMax,
  },
  char_freq: {
    id: "char_freq",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru"
        ? "Задача A4: Частоты символов"
        : "Task A4: Character frequencies",
    description: (lang) =>
      lang === "ru"
        ? 'Подсчитайте частоты символов в строке <code>"abcaabbb"</code> и выведите результат, например: <strong>a:3 b:4 c:1</strong> (формат вывода свободный). Рекомендуется использовать блоки словаря из категории Custom.'
        : 'Count character frequencies in the string <code>"abcaabbb"</code> and print the result, e.g. <strong>a:3 b:4 c:1</strong> (any clear format). Using the dictionary blocks from Custom is recommended.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: создайте словарь, проверяйте наличие ключа и увеличивайте счётчик."
        : "Hint: create a dictionary, check key existence, and increment counters.",
    validate: validateCharFreq,
  },
};

let activeTaskId: TaskId = "hello_world";

let activeDifficulty: TaskDifficulty = "basic";

const FREE_TASK_NAV = true;

// Порядок задач для последовательного прохождения
const TASKS_ORDER_BY_DIFFICULTY: Record<TaskDifficulty, TaskId[]> = {
  basic: [
    "hello_world",
    "add_2_7",
    "var_my_age",
    "calc_sum",
    "greet_concat",
    "inc_counter",
    "discount_calc",
    "first_condition",
    "even_or_odd",
    "time_of_day",
    "first_loop",
    "sum_1_to_n",
    "guess_game",
    "list_foreach",
    "sublist_foreach",
    "list_filter_even",
    "list_filter_even_min_max",
    "list_filter_even_avg",
    "list_filter_even_median",
    "list_sum_even_positions",
  ],
  advanced: ["a1_number_analyzer", "sum_array", "min_max", "char_freq"],
};
const PROGRESS_KEY = "task_progress_v1";

type Progress = Partial<Record<TaskId, { solved: boolean; stars: number }>>;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* ничего */
  }
}

function markSolved(taskId: TaskId, stars: number) {
  const p = loadProgress();
  p[taskId] = { solved: true, stars };
  saveProgress(p);
}

export function isSolved(taskId: TaskId): boolean {
  const p = loadProgress();
  return !!p[taskId]?.solved;
}

export function getActiveDifficulty(): TaskDifficulty {
  return activeDifficulty;
}

export function setActiveDifficulty(difficulty: TaskDifficulty) {
  activeDifficulty = difficulty;
}

export function getFirstUnsolvedTask(
  difficulty: TaskDifficulty = activeDifficulty,
): TaskId {
  const p = loadProgress();
  const order = TASKS_ORDER_BY_DIFFICULTY[difficulty] || [];
  for (const id of order) {
    if (!p[id]?.solved) return id;
  }
  return order[order.length - 1] || "hello_world";
}

export function getNextTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx < 0) return null;
  return idx + 1 < order.length ? order[idx + 1] : null;
}

export function getPrevTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx < 0) return null;
  if (order.length === 0) return null;
  if (idx === 0) return order[order.length - 1] || null;
  return order[idx - 1] || null;
}

export function getActiveTask(): TaskId {
  return activeTaskId;
}

// ---------- Вспомогательные функции ----------
function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((s) => s.length > 0);
}

function getVisibleOutputLines(): string[] {
  const out = document.getElementById("output") as HTMLDivElement | null;
  return collectPrintedLines(out);
}

function getVarFieldText(b: any): string {
  try {
    const f = typeof b?.getField === "function" ? b.getField("VAR") : null;
    const t = typeof f?.getText === "function" ? f.getText() : "";
    return String(t || "");
  } catch {
    return "";
  }
}

function tryGetAssignedNumber(setBlock: any): number | null {
  try {
    const target =
      typeof setBlock?.getInputTargetBlock === "function"
        ? setBlock.getInputTargetBlock("VALUE")
        : null;
    if (!target || (target as any).type !== "math_number") return null;
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
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateHelloWorld(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "Hello World!";
  const ok = lines.includes(expected);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 2)
      stars = 3; // печать + текст
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateAdd2Plus7(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "9"; // должно вывести 9
  const ok = lines.includes(expected);

  // Эвристика по звёздам: желательно использовать math_arithmetic с ADD и числами 2 и 7
  let hasAddition = false;
  let has2 = false;
  let has7 = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      if ((b as any).type === "math_arithmetic") {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "ADD") hasAddition = true;
      }
      if ((b as any).type === "math_number") {
        const num =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("NUM")
            : undefined;
        if (String(num) === "2") has2 = true;
        if (String(num) === "7") has7 = true;
      }
    }
  } catch {
    // игнорируем
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasAddition && has2 && has7 && count <= 4)
      stars = 3; // печать + math_arithmetic + 2 числа
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateVarMyAge(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let assignedValue: string | null = null;
  let hasSetMyAge = false;
  let hasGetMyAge = false;
  let hasPrint = false;
  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "myAge") {
        hasSetMyAge = true;
        try {
          const target =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("VALUE")
              : null;
          if (target && (target as any).type === "math_number") {
            const num =
              typeof (target as any).getFieldValue === "function"
                ? (target as any).getFieldValue("NUM")
                : undefined;
            if (num !== undefined && num !== null)
              assignedValue = String(num).trim();
          }
        } catch {}
      }
    }
    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "myAge") hasGetMyAge = true;
    }
    if (t === "text_print" || t === "add_text") {
      hasPrint = true;
    }
  }

  const ok = (() => {
    if (!assignedValue) return false;
    const re = new RegExp(`(^|\\b)${escapeRe(assignedValue)}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return hasSetMyAge && hasGetMyAge && hasValueInOutput;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasSetMyAge && hasGetMyAge && hasPrint && assignedValue && count <= 5)
      stars = 3;
    else if (count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCalcSum(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let aVal: number | null = null;
  let bVal: number | null = null;
  let hasSetA = false;
  let hasSetB = false;
  let hasSetSum = false;
  let hasGetA = false;
  let hasGetB = false;
  let hasGetSum = false;
  let hasPrint = false;
  let hasSumFromAPlusB = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "a") {
        hasSetA = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) aVal = n;
      }
      if (name === "b") {
        hasSetB = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) bVal = n;
      }
      if (name === "sum") {
        hasSetSum = true;
        try {
          const valueBlock =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("VALUE")
              : null;
          if (valueBlock && (valueBlock as any).type === "math_arithmetic") {
            const op =
              typeof (valueBlock as any).getFieldValue === "function"
                ? (valueBlock as any).getFieldValue("OP")
                : undefined;
            if (op === "ADD") {
              const left =
                typeof (valueBlock as any).getInputTargetBlock === "function"
                  ? (valueBlock as any).getInputTargetBlock("A")
                  : null;
              const right =
                typeof (valueBlock as any).getInputTargetBlock === "function"
                  ? (valueBlock as any).getInputTargetBlock("B")
                  : null;
              const leftOk =
                left &&
                (left as any).type === "variables_get" &&
                getVarFieldText(left) === "a";
              const rightOk =
                right &&
                (right as any).type === "variables_get" &&
                getVarFieldText(right) === "b";
              const leftOk2 =
                left &&
                (left as any).type === "variables_get" &&
                getVarFieldText(left) === "b";
              const rightOk2 =
                right &&
                (right as any).type === "variables_get" &&
                getVarFieldText(right) === "a";
              if ((leftOk && rightOk) || (leftOk2 && rightOk2))
                hasSumFromAPlusB = true;
            }
          }
        } catch {}
      }
    }
    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "a") hasGetA = true;
      if (name === "b") hasGetB = true;
      if (name === "sum") hasGetSum = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = (() => {
    if (aVal === null || bVal === null) return false;
    const expected = aVal + bVal;
    const re = new RegExp(`(^|\\b)${escapeRe(String(expected))}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return (
      hasSetA &&
      hasSetB &&
      hasSetSum &&
      hasGetSum &&
      hasGetA &&
      hasGetB &&
      hasSumFromAPlusB &&
      hasValueInOutput
    );
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && count <= 10) stars = 3;
    else if (count <= 13) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateGreetConcat(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetName = false;
  let hasGetName = false;
  let usedTextJoin = false;
  let usedTextAppend = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "name")
      hasSetName = true;
    if (t === "variables_get" && getVarFieldText(b) === "name")
      hasGetName = true;
    if (t === "text_join") usedTextJoin = true;
    if (t === "text_append") usedTextAppend = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    hasSetName &&
    hasGetName &&
    (usedTextJoin || usedTextAppend) &&
    lines.some((l) => /^Hello,\s*.+!$/.test(l.trim()));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && usedTextJoin && count <= 9) stars = 3;
    else if (count <= 12) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateIncCounter(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let initOk = false;
  let incOk = false;
  let hasGetCounter = false;
  let hasPrint = false;
  let usesMathChange = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set" && getVarFieldText(b) === "counter") {
      const valueBlock =
        typeof (b as any).getInputTargetBlock === "function"
          ? (b as any).getInputTargetBlock("VALUE")
          : null;

      if (valueBlock && (valueBlock as any).type === "math_number") {
        const n = tryGetAssignedNumber(b);
        if (n === 0) initOk = true;
      }

      if (valueBlock && (valueBlock as any).type === "math_arithmetic") {
        try {
          const op =
            typeof (valueBlock as any).getFieldValue === "function"
              ? (valueBlock as any).getFieldValue("OP")
              : undefined;
          if (op !== "ADD") continue;

          const left =
            typeof (valueBlock as any).getInputTargetBlock === "function"
              ? (valueBlock as any).getInputTargetBlock("A")
              : null;
          const right =
            typeof (valueBlock as any).getInputTargetBlock === "function"
              ? (valueBlock as any).getInputTargetBlock("B")
              : null;

          const isGetCounter = (x: any) =>
            x &&
            (x as any).type === "variables_get" &&
            getVarFieldText(x) === "counter";
          const isOne = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "1";
          };

          if (
            (isGetCounter(left) && isOne(right)) ||
            (isOne(left) && isGetCounter(right))
          )
            incOk = true;
        } catch {}
      }
    }

    if (t === "math_change" && getVarFieldText(b) === "counter") {
      usesMathChange = true;
      try {
        const delta =
          typeof (b as any).getInputTargetBlock === "function"
            ? (b as any).getInputTargetBlock("DELTA")
            : null;
        if (delta && (delta as any).type === "math_number") {
          const raw =
            typeof (delta as any).getFieldValue === "function"
              ? (delta as any).getFieldValue("NUM")
              : undefined;
          if (String(raw).trim() === "1") incOk = true;
        }
      } catch {}
    }

    if (t === "variables_get" && getVarFieldText(b) === "counter")
      hasGetCounter = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = initOk && incOk && hasGetCounter && lines.includes("1");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && count <= 7) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }

  if (ok && usesMathChange && count <= 6) stars = 3;
  return { ok, stars };
}

async function validateDiscountCalc(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let priceVal: number | null = null;
  let discountVal: number | null = null;
  let hasSetPrice = false;
  let hasSetDiscount = false;
  let hasGetPrice = false;
  let hasGetDiscount = false;
  let hasPrint = false;

  let usedMinus = false;
  let usedMultiply = false;
  let usedDivide = false;
  let usedPercentConst = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "price") {
        hasSetPrice = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) priceVal = n;
      }
      if (name === "discount") {
        hasSetDiscount = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) discountVal = n;
      }
    }

    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "price") hasGetPrice = true;
      if (name === "discount") hasGetDiscount = true;
    }

    if (t === "math_arithmetic") {
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "MINUS") usedMinus = true;
        if (op === "MULTIPLY") usedMultiply = true;
        if (op === "DIVIDE") usedDivide = true;
      } catch {}
    }

    if (t === "math_number") {
      try {
        const raw =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("NUM")
            : undefined;
        if (String(raw).trim() === "100") usedPercentConst = true;
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const expected = (() => {
    if (priceVal === null || discountVal === null) return null;
    return priceVal - (priceVal * discountVal) / 100;
  })();

  const hasExpectedInOutput = (() => {
    if (expected === null) return false;
    const s = String(expected);
    const re = new RegExp(`(^|\\b)${escapeRe(s)}(\\b|$)`);
    return lines.some((l) => re.test(l));
  })();

  const ok =
    hasSetPrice &&
    hasSetDiscount &&
    hasGetPrice &&
    hasGetDiscount &&
    hasPrint &&
    expected !== null &&
    hasExpectedInOutput;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedFormulaHints =
      usedMinus && usedMultiply && usedDivide && usedPercentConst;
    if (usedFormulaHints && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateFirstCondition(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetTemperature = false;
  let hasGetTemperature = false;
  let hasIf = false;
  let hasCompare = false;
  let hasGreaterThanZero = false;
  let hasPrint = false;
  let tempValue: number | null = null;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set" && getVarFieldText(b) === "temperature") {
      hasSetTemperature = true;
      const n = tryGetAssignedNumber(b);
      if (n !== null) tempValue = n;
    }

    if (t === "variables_get" && getVarFieldText(b) === "temperature")
      hasGetTemperature = true;

    if (t === "controls_if") hasIf = true;
    if (t === "logic_compare") {
      hasCompare = true;
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "GT" || op === "GTE") {
          const left =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("A")
              : null;
          const right =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("B")
              : null;
          const isTemp = (x: any) =>
            x &&
            (x as any).type === "variables_get" &&
            getVarFieldText(x) === "temperature";
          const isZero = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "0";
          };
          if (
            (isTemp(left) && isZero(right)) ||
            (isZero(left) && isTemp(right))
          ) {
            hasGreaterThanZero = true;
          }
        }
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const hasWarmOutput = lines.some((l) =>
    l.trim().toLowerCase().includes("the weather is warm"),
  );

  const ok =
    hasSetTemperature &&
    hasGetTemperature &&
    hasIf &&
    hasCompare &&
    hasPrint &&
    hasWarmOutput &&
    tempValue !== null &&
    tempValue > 0;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = hasGreaterThanZero && hasIf && hasCompare;
    if (usedCore && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateNumberAnalyzer(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines().map((l) => l.trim());

  const nonShadowBlocks = getNonShadowBlocks(ws);

  const tryGetAssignedInt = (setBlock: any): number | null => {
    try {
      const target =
        typeof setBlock?.getInputTargetBlock === "function"
          ? setBlock.getInputTargetBlock("VALUE")
          : null;
      if (!target || (target as any).type !== "math_number") return null;
      const raw =
        typeof (target as any).getFieldValue === "function"
          ? (target as any).getFieldValue("NUM")
          : undefined;
      if (raw === undefined || raw === null) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      if (!Number.isInteger(n)) return null;
      return n;
    } catch {
      return null;
    }
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "number") {
      hasSetNumber = true;
      const cand = tryGetAssignedInt(b);
      if (cand !== null) n = cand;
    }
    if (t === "variables_get" && getVarFieldText(b) === "number")
      hasGetNumber = true;

    if (t === "controls_if") {
      try {
        const elseCount =
          typeof (b as any).elseCount_ === "number" ? (b as any).elseCount_ : 0;
        const hasElseInput =
          typeof (b as any).getInput === "function" &&
          !!(b as any).getInput("ELSE");
        if (elseCount > 0 || hasElseInput) usedIfElse = true;
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const expected = (() => {
    if (n === null) return null;
    const parity = n % 2 === 0 ? "even" : "odd";
    const sign = n > 0 ? "positive" : n < 0 ? "negative" : "zero";
    return {
      evenLine: `The number is ${parity}`.toLowerCase(),
      signLine: `The number is ${sign}`.toLowerCase(),
      ruEvenLine:
        n % 2 === 0
          ? "Число чётное".toLowerCase()
          : "Число нечётное".toLowerCase(),
      ruSignLine:
        n > 0
          ? "Число положительное".toLowerCase()
          : n < 0
            ? "Число отрицательное".toLowerCase()
            : "Число равно нулю".toLowerCase(),
    };
  })();

  const normalized = lines.map((l) => l.replace(/[.!]+$/g, "").toLowerCase());

  const hasParityLine = (() => {
    if (!expected) return false;
    return (
      normalized.includes(expected.evenLine) ||
      normalized.includes(expected.ruEvenLine)
    );
  })();

  const hasSignLine = (() => {
    if (!expected) return false;
    return (
      normalized.includes(expected.signLine) ||
      normalized.includes(expected.ruSignLine)
    );
  })();

  const ok =
    hasSetNumber &&
    hasGetNumber &&
    hasPrint &&
    n !== null &&
    hasParityLine &&
    hasSignLine;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateEvenOrOdd(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let hasPrint = false;
  let usedIf = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "number") {
      hasSetNumber = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get" && getVarFieldText(b) === "number")
      hasGetNumber = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      usedIf = true;
      try {
        if (typeof (b as any).getInput === "function") {
          const hasElseInput = !!(b as any).getInput("ELSE");
          if (hasElseInput) usedIfElse = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "math_arithmetic") {
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (String(op).toUpperCase().includes("MOD")) usedModulo = true;
      } catch {}
    }
  }

  const ok = (() => {
    if (!hasSetNumber || !hasGetNumber || !hasPrint) return false;
    if (n === null) return false;
    const parity = n % 2 === 0 ? "even" : "odd";
    const enExpected = `the number is ${parity}`.toLowerCase();
    const ruExpected =
      parity === "even"
        ? ["число чётное", "число четное"]
        : ["число нечётное", "число нечетное"];
    const hasEn = normalized.includes(enExpected);
    const hasRu = ruExpected.some((s) => normalized.includes(s));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 10) stars = 3;
    else if ((usedIf || usedCompare || usedModulo) && count <= 14) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateTimeOfDay(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let hour: number | null = null;
  let hasSetHour = false;
  let hasGetHour = false;
  let hasPrint = false;

  let ifBlocksCount = 0;
  let hasElseIfChain = false;
  let hasElseBranch = false;

  let usedCompare = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "hour") {
      hasSetHour = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) hour = assigned;
    }
    if (t === "variables_get" && getVarFieldText(b) === "hour")
      hasGetHour = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      ifBlocksCount += 1;
      try {
        if (typeof (b as any).getInput === "function") {
          let elseIfCount = 0;
          for (let i = 1; i < 10; i++) {
            if ((b as any).getInput(`IF${i}`)) elseIfCount += 1;
            else break;
          }
          if (elseIfCount >= 2) hasElseIfChain = true;
          if ((b as any).getInput("ELSE")) hasElseBranch = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
  }

  const expectedKey = (() => {
    if (hour === null) return null;
    if (hour >= 6 && hour <= 11) return "morning";
    if (hour >= 12 && hour <= 17) return "afternoon";
    if (hour >= 18 && hour <= 22) return "evening";
    return "night";
  })();

  const ok = (() => {
    if (!hasSetHour || !hasGetHour || !hasPrint) return false;
    if (!expectedKey) return false;
    const enExpected =
      expectedKey === "morning"
        ? "good morning"
        : expectedKey === "afternoon"
          ? "good afternoon"
          : expectedKey === "evening"
            ? "good evening"
            : "good night";
    const ruExpected =
      expectedKey === "morning"
        ? ["доброе утро"]
        : expectedKey === "afternoon"
          ? ["добрый день"]
          : expectedKey === "evening"
            ? ["добрый вечер"]
            : ["спокойной ночи", "доброй ночи"];

    const hasEn = normalized.some((l) => l.includes(enExpected));
    const hasRu = ruExpected.some((s) => normalized.some((l) => l.includes(s)));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      ifBlocksCount === 1 && hasElseIfChain && hasElseBranch && usedCompare;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 26) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateFirstLoop(
  ws: Blockly.WorkspaceSvg,
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
    for (
      let start = 0;
      start <= numericLines.length - expected.length;
      start++
    ) {
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

async function validateSum1ToN(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
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
    if (t === "variables_set" && getVarFieldText(b) === "n") {
      hasSetN = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get" && getVarFieldText(b) === "n") hasGetN = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_for") usedFor = true;

    if (t === "variables_set" && getVarFieldText(b) === "sum")
      usedAccumulator = true;
    if (t === "variables_set" && getVarFieldText(b) === "total")
      usedAccumulator = true;
  }

  const expected = (() => {
    if (n === null) return null;
    if (n < 1) return null;
    return (n * (n + 1)) / 2;
  })();

  const ok = (() => {
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
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
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
    if (t === "variables_set" && getVarFieldText(b) === "secret")
      hasSetSecret = true;
    if (t === "variables_get" && getVarFieldText(b) === "secret")
      hasGetSecret = true;
    if (t === "variables_set" && getVarFieldText(b) === "guess")
      hasSetGuess = true;
    if (t === "variables_get" && getVarFieldText(b) === "guess")
      hasGetGuess = true;

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
    const ruHigher = normalized.some((l) =>
      l.includes("загаданное число больше"),
    );
    const ruLower = normalized.some((l) =>
      l.includes("загаданное число меньше"),
    );
    const ruCongrats = normalized.some((l) => l.includes("поздравляем"));
    const enHigher = normalized.some((l) => l.includes("higher"));
    const enLower = normalized.some((l) => l.includes("lower"));
    const enCongrats = normalized.some((l) => l.includes("congrat"));
    return (
      ruHigher || ruLower || ruCongrats || enHigher || enLower || enCongrats
    );
  })();

  const ok =
    hasSetSecret &&
    hasSetGuess &&
    usedInputNumber &&
    usedWhile &&
    usedIf &&
    usedCompare &&
    hasPrint &&
    (hasFeedbackText || (hasGetSecret && hasGetGuess));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedWhile &&
      usedIf &&
      usedElseIf &&
      usedElse &&
      usedInputNumber &&
      hasEq &&
      hasLt &&
      hasGt;
    if (usedCore && count <= 26) stars = 3;
    else if (usedWhile && usedIf && usedCompare && count <= 34) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListForEach(
  ws: Blockly.WorkspaceSvg,
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
    for (
      let start = 0;
      start <= numericLines.length - expectedList.length;
      start++
    ) {
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
    if (t === "variables_set" && (v === "list" || v === "numbers"))
      hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers"))
      hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total"))
      hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total"))
      hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    hasSequence &&
    hasSum &&
    usedForEach &&
    usedListCreate &&
    hasSetList &&
    hasGetList &&
    hasSetSum &&
    hasGetSum &&
    hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedForEach && usedListCreate && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSublistForEach(
  ws: Blockly.WorkspaceSvg,
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
    for (
      let start = 0;
      start <= numericLines.length - expected.length;
      start++
    ) {
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

  const ok =
    hasSequence && usedListCreate && usedGetSublist && usedForEach && hasPrint;

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
  ws: Blockly.WorkspaceSvg,
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
    for (
      let start = 0;
      start <= numericLines.length - expected.length;
      start++
    ) {
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
    if (t === "variables_set" && (v === "list" || v === "numbers"))
      hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers"))
      hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total"))
      hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total"))
      hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok =
    hasSequence &&
    hasSum &&
    usedListCreate &&
    usedForEach &&
    usedIf &&
    usedEvenCheck &&
    hasSetList &&
    hasGetList &&
    hasSetSum &&
    hasGetSum &&
    hasPrint;

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
  ws: Blockly.WorkspaceSvg,
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
    for (
      let start = 0;
      start <= numericLines.length - expected.length;
      start++
    ) {
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

  const hasMin = lines.some((l) =>
    /(^|\b)(min|минимум|мин)\s*[:=]?\s*2(\b|$)/i.test(l),
  );
  const hasMax = lines.some((l) =>
    /(^|\b)(max|максимум|макс)\s*[:=]?\s*10(\b|$)/i.test(l),
  );

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

  const ok =
    hasSequence &&
    hasMin &&
    hasMax &&
    usedListCreate &&
    usedForEach &&
    usedIf &&
    usedEvenCheck &&
    usedMathOnList &&
    usedMin &&
    usedMax &&
    hasPrint;

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
  ws: Blockly.WorkspaceSvg,
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
    if (t === "variables_set" && (v === "list" || v === "numbers"))
      hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers"))
      hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total"))
      hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total"))
      hasGetSum = true;
    if (t === "variables_set" && (v === "count" || v === "cnt"))
      hasSetCount = true;
    if (t === "variables_get" && (v === "count" || v === "cnt"))
      hasGetCount = true;
    if (
      t === "variables_set" &&
      (v === "avg" || v === "average" || v === "mean")
    )
      hasSetAvg = true;
    if (
      t === "variables_get" &&
      (v === "avg" || v === "average" || v === "mean")
    )
      hasGetAvg = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") {
      usedArithmetic = true;
      const op =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP")
          : undefined;
      if (String(op).toUpperCase().includes("DIVIDE")) usedDivide = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok =
    hasCount &&
    hasSum &&
    hasAvg &&
    usedListCreate &&
    usedForEach &&
    usedIf &&
    usedEvenCheck &&
    usedDivide &&
    hasSetList &&
    hasGetList &&
    hasSetSum &&
    hasGetSum &&
    hasSetCount &&
    hasGetCount &&
    hasSetAvg &&
    hasGetAvg &&
    hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedForEach &&
      usedIf &&
      usedEvenCheck &&
      usedDivide &&
      (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 36) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenMedian(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasCount = lines.some((l) => /(^|\b)count\s*[:=]?\s*5(\b|$)/i.test(l));
  const hasMedian = lines.some((l) =>
    /(^|\b)(median|медиана)\s*[:=]?\s*6(\b|$)/i.test(l),
  );

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

  const ok =
    hasCount &&
    hasMedian &&
    usedListCreate &&
    usedForEach &&
    usedIf &&
    usedEvenCheck &&
    usedLength &&
    usedGetIndex &&
    hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedForEach && usedIf && usedEvenCheck && usedLength && usedGetIndex;
    if (usedCore && count <= 32) stars = 3;
    else if (count <= 44) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListSumEvenPositions(
  ws: Blockly.WorkspaceSvg,
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
    if (t === "variables_set" && (v === "list" || v === "numbers"))
      hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers"))
      hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total"))
      hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total"))
      hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok =
    hasSum &&
    usedListCreate &&
    usedFor &&
    usedIf &&
    usedEvenCheck &&
    usedGetIndex &&
    hasSetList &&
    hasGetList &&
    hasSetSum &&
    hasGetSum &&
    hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedFor &&
      usedIf &&
      usedEvenCheck &&
      usedGetIndex &&
      (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 38) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSumArray(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const ok = lines.some((l) => /(^|\b)15(\b|$)/.test(l));

  // Эвристика по звёздам: либо SUM через math_on_list, либо суммирование в цикле forEach
  let usedMathOnList = false;
  let usedForEach = false;
  let usedListCreate = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      const t = (b as any).type;
      if (t === "lists_create_with") usedListCreate = true;
      if (t === "controls_forEach") usedForEach = true;
      if (t === "math_on_list") usedMathOnList = true;
    }
  } catch {}

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedListCreate && count <= 6) stars = 3;
    else if (usedForEach && usedListCreate && count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateMinMax(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const hasMin = lines.some(
    (l) => /min\s*[:=]\s*1/i.test(l) || l.trim() === "1",
  );
  const hasMax = lines.some(
    (l) => /max\s*[:=]\s*9/i.test(l) || l.trim() === "9",
  );
  const ok = hasMin && hasMax;

  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    if ((b as any).type === "math_on_list") {
      usedMathOnList = true;
      // в разных версиях Blockly используется поле OP или MODE
      const mode =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
          : undefined;
      if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
      if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedMin && usedMax && count <= 8) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCharFreq(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const need = { a: 3, b: 4, c: 1 } as Record<string, number>;
  const checks = Object.entries(need).map(([ch, n]) =>
    lines.some((l) => new RegExp(`${ch}\s*[:=]\s*${n}`, "i").test(l)),
  );
  const ok = checks.every(Boolean);

  // Эвристика: желательно использовать блоки словаря
  let usedDict = false;
  const dictBlocks = getNonShadowBlocks(ws);
  for (const b of dictBlocks) {
    const t = (b as any).type;
    if (
      t === "dict_create" ||
      t === "dict_set" ||
      t === "dict_get" ||
      t === "dict_has_key"
    ) {
      usedDict = true;
      break;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedDict && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

// ---------- Rendering ----------
function renderResult(
  feedbackEl: HTMLDivElement | null,
  starsEl: HTMLDivElement | null,
  ok: boolean,
  stars: number,
  failureHint: string,
) {
  if (starsEl) {
    starsEl.innerHTML = "";
    const total = 3;
    for (let i = 0; i < total; i++) {
      const span = document.createElement("span");
      span.textContent = i < stars ? "★" : "☆";
      span.style.color = i < stars ? "#f5a623" : "#999";
      span.style.fontSize = "18px";
      span.style.marginRight = "2px";
      starsEl.appendChild(span);
    }
  }

  if (feedbackEl) {
    const t = (window as any)._currentLocalizedStrings;
    if (ok) {
      feedbackEl.style.color = "#2e7d32";
      feedbackEl.textContent =
        stars === 3
          ? t?.TaskPerfect || "Отлично! Решение оптимально."
          : t?.TaskPassed || "Решение верное.";
    } else {
      feedbackEl.style.color = "#c62828";
      feedbackEl.textContent = failureHint;
    }
  }
}

export function setActiveTask(taskId: TaskId) {
  activeTaskId = taskId;
  activeDifficulty = tasks[taskId].difficulty;
  const lang = getAppLang();

  const titleEl = document.querySelector(
    "#taskSidebar .task-title",
  ) as HTMLElement | null;
  const descEl = document.querySelector(
    "#taskSidebar .task-desc",
  ) as HTMLElement | null;
  const hintEl = document.querySelector(
    "#taskSidebar .task-hint",
  ) as HTMLElement | null;
  const hintDetails = document.getElementById(
    "taskHintDetails",
  ) as HTMLDetailsElement | null;
  const feedbackEl = document.getElementById(
    "taskFeedback",
  ) as HTMLDivElement | null;
  const starsEl = document.getElementById("taskStars") as HTMLDivElement | null;
  const nextButton = document.getElementById(
    "nextTaskBtn",
  ) as HTMLButtonElement | null;
  const prevButton = document.getElementById(
    "prevTaskBtn",
  ) as HTMLButtonElement | null;

  const tdef = tasks[activeTaskId];
  if (titleEl) titleEl.textContent = tdef.title(lang);
  if (descEl) descEl.innerHTML = tdef.description(lang);
  if (hintEl) hintEl.textContent = tdef.hint(lang);
  if (hintDetails) hintDetails.open = false;
  if (feedbackEl) feedbackEl.textContent = "";
  if (starsEl) starsEl.innerHTML = "";
  const nextId = getNextTaskId(activeTaskId);
  if (nextButton)
    nextButton.disabled =
      nextId === null ? true : !FREE_TASK_NAV && !isSolved(activeTaskId);
  if (prevButton) prevButton.disabled = getPrevTaskId(activeTaskId) === null;

  const consoleInfo = document.getElementById(
    "consoleOutputInfoSection",
  ) as HTMLDivElement | null;
  const forLoopInfo = document.getElementById(
    "forLoopInfoSection",
  ) as HTMLDivElement | null;
  const whileLoopInfo = document.getElementById(
    "whileLoopInfoSection",
  ) as HTMLDivElement | null;
  const listInfo = document.getElementById(
    "listInfoSection",
  ) as HTMLDivElement | null;
  const sublistInfo = document.getElementById(
    "sublistInfoSection",
  ) as HTMLDivElement | null;
  const listFilterInfo = document.getElementById(
    "listFilterInfoSection",
  ) as HTMLDivElement | null;
  const dataTypesInfo = document.getElementById(
    "dataTypesInfoSection",
  ) as HTMLDivElement | null;
  const variableInfo = document.getElementById(
    "variableInfoSection",
  ) as HTMLDivElement | null;
  const concatInfo = document.getElementById(
    "concatInfoSection",
  ) as HTMLDivElement | null;
  const incDecInfo = document.getElementById(
    "incDecInfoSection",
  ) as HTMLDivElement | null;
  const conditionInfo = document.getElementById(
    "conditionInfoSection",
  ) as HTMLDivElement | null;
  const showDataTypes = activeTaskId === "add_2_7";
  const showVariableInfo =
    activeTaskId === "var_my_age" || activeTaskId === "calc_sum";
  const showConcatInfo = activeTaskId === "greet_concat";
  const showIncDecInfo = activeTaskId === "inc_counter";
  const showForLoopInfo =
    activeTaskId === "first_loop" || activeTaskId === "sum_1_to_n";
  const showWhileLoopInfo = activeTaskId === "guess_game";
  const showListInfo = activeTaskId === "list_foreach";
  const showSublistInfo = activeTaskId === "sublist_foreach";
  const showListFilterInfo =
    activeTaskId === "list_filter_even" ||
    activeTaskId === "list_filter_even_min_max" ||
    activeTaskId === "list_filter_even_avg" ||
    activeTaskId === "list_filter_even_median" ||
    activeTaskId === "list_sum_even_positions";
  const showConditionInfo =
    activeTaskId === "even_or_odd" ||
    activeTaskId === "time_of_day" ||
    activeTaskId === "first_condition";
  const showConsole =
    !showDataTypes &&
    !showVariableInfo &&
    !showConcatInfo &&
    !showIncDecInfo &&
    !showForLoopInfo &&
    !showWhileLoopInfo &&
    !showListInfo &&
    !showSublistInfo &&
    !showListFilterInfo &&
    !showConditionInfo;
  if (consoleInfo) consoleInfo.style.display = showConsole ? "" : "none";
  if (forLoopInfo) forLoopInfo.style.display = showForLoopInfo ? "" : "none";
  if (whileLoopInfo)
    whileLoopInfo.style.display = showWhileLoopInfo ? "" : "none";
  if (listInfo) listInfo.style.display = showListInfo ? "" : "none";
  if (sublistInfo) sublistInfo.style.display = showSublistInfo ? "" : "none";
  if (listFilterInfo)
    listFilterInfo.style.display = showListFilterInfo ? "" : "none";
  if (dataTypesInfo) dataTypesInfo.style.display = showDataTypes ? "" : "none";
  if (variableInfo) variableInfo.style.display = showVariableInfo ? "" : "none";
  if (concatInfo) concatInfo.style.display = showConcatInfo ? "" : "none";
  if (incDecInfo) incDecInfo.style.display = showIncDecInfo ? "" : "none";
  if (conditionInfo)
    conditionInfo.style.display = showConditionInfo ? "" : "none";
}

export function initTaskValidation(
  ws: Blockly.WorkspaceSvg,
  opts: InitTaskValidationOptions,
) {
  const { checkButton, feedbackEl, starsEl, nextButton, prevButton } = opts;
  if (!checkButton) return;

  // Сброс визуального результата
  const resetResult = () => {
    if (feedbackEl) feedbackEl.textContent = "";
    if (starsEl) starsEl.innerHTML = "";
  };

  checkButton.addEventListener("click", () => {
    void (async () => {
      // Требуем, чтобы пользователь сначала выполнил код через кнопку запуска
      const currentLines = getVisibleOutputLines();
      const t = (window as any)._currentLocalizedStrings;
      if (currentLines.length === 0) {
        const msg =
          t?.RunFirst ||
          (getAppLang() === "ru"
            ? "Сначала запустите код"
            : "Run the code first");
        renderResult(feedbackEl, starsEl, false, 0, msg);
        return;
      }

      const tdef = tasks[activeTaskId];
      const { ok, stars } = await tdef.validate(ws);
      const hint = tdef.hint(getAppLang());
      renderResult(feedbackEl, starsEl, ok, stars, hint);

      if (ok) {
        markSolved(activeTaskId, stars);
        if (nextButton)
          nextButton.disabled =
            getNextTaskId(activeTaskId) === null
              ? true
              : !FREE_TASK_NAV && !isSolved(activeTaskId);
      }
    })();
  });

  if (nextButton) {
    // Кнопка активируется только если текущая задача решена и есть следующая
    nextButton.disabled =
      getNextTaskId(activeTaskId) === null
        ? true
        : !FREE_TASK_NAV && !isSolved(activeTaskId);
    nextButton.addEventListener("click", () => {
      const next = getNextTaskId(activeTaskId);
      if (!next) return;
      ws.clear();
      setActiveTask(next);
      // после перехода — блокируем кнопку снова, пока новая задача не решена
      nextButton.disabled =
        getNextTaskId(next) === null ? true : !FREE_TASK_NAV && !isSolved(next);
      if (prevButton) prevButton.disabled = getPrevTaskId(next) === null;
      resetResult();
    });
  }

  if (prevButton) {
    // Кнопка предыдущей задачи активна, если есть предыдущая
    prevButton.disabled = getPrevTaskId(activeTaskId) === null;
    prevButton.addEventListener("click", () => {
      const prev = getPrevTaskId(activeTaskId);
      if (!prev) return;
      setActiveTask(prev);
      // после перехода — пересчитываем состояния навигации
      prevButton.disabled = getPrevTaskId(prev) === null;
      if (nextButton)
        nextButton.disabled =
          getNextTaskId(prev) === null
            ? true
            : !FREE_TASK_NAV && !isSolved(prev);
      resetResult();
    });
  }
}
