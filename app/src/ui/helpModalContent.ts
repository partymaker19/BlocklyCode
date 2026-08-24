// Модальные окна справки и поддержки: локализованное содержимое (RU/EN),
// открытие/закрытие, перетаскивание за заголовок. Вынесено из index.ts.
import { getAppLang } from "../localization";
import { makeModalDraggable } from "./modals";


// ===== Инициализация модального окна справки по созданию блоков =====
/**
 * Инициализирует модальное окно справки по созданию блоков
 * Добавляет обработчики событий для открытия и закрытия окна
 * Вставляет содержимое руководства напрямую вместо загрузки MD файла
 * Добавляет возможность перетаскивания модального окна
 */
export function initHelpModalLocal() {
  const blockHelpBtn = document.getElementById(
    "blockHelpBtn",
  ) as HTMLButtonElement | null;
  const helpModal = document.getElementById(
    "helpModal",
  ) as HTMLDivElement | null;
  const closeHelpModal = document.getElementById(
    "closeHelpModal",
  ) as HTMLSpanElement | null;
  const markdownContent = document.getElementById(
    "markdownContent",
  ) as HTMLDivElement | null;
  if (blockHelpBtn && helpModal && closeHelpModal && markdownContent) {
    // Открытие модального окна при клике на кнопку справки
    blockHelpBtn.addEventListener("click", () => {
      if (helpModal) {
        helpModal.style.display = "block";
        // Центрируем окно при открытии (сбрасываем возможные координаты после drag)
        const helpModalContent = document.getElementById(
          "helpModalContent",
        ) as HTMLDivElement | null;
        if (helpModalContent) {
          helpModalContent.style.left = "50%";
          helpModalContent.style.top = "50%";
          helpModalContent.style.transform = "translate(-50%, -50%)";
          // Сброс анимации на открытие, чтобы не мешала drag после клика на заголовок
          helpModalContent.style.animation = "";
        }
        // Локализованное содержимое руководства (RU/EN)
        const ru = `
<h1>Руководство по созданию пользовательских блоков</h1>

<h2>Структура JSON-описания блока</h2>

<p>Каждый блок определяется JSON-объектом со следующими основными полями:</p>

<h3>Обязательные поля</h3>

<ul>
<li><strong>type</strong>: Уникальный идентификатор блока (строка)</li>
<li><strong>message0</strong>: Текст, отображаемый на блоке (может содержать заполнители %1, %2 и т.д.)</li>
<li><strong>args0</strong>: Массив аргументов, соответствующих заполнителям в message0</li>
<li><strong>colour</strong>: Цвет блока (число от 0 до 360 или строка с HEX-кодом)</li>
<li><strong>tooltip</strong>: Всплывающая подсказка при наведении на блок</li>
<li><strong>helpUrl</strong>: URL страницы с дополнительной информацией</li>
<li><strong>inputsInline</strong>: Расположение входов (true — в линию, false — вертикально)</li>
<li><strong>previousStatement</strong>: Подключение сверху (true или тип соединения)</li>
<li><strong>nextStatement</strong>: Подключение снизу (true или тип соединения)</li>
<li><strong>output</strong>: Тип выходного значения блока (строка или null)</li>
</ul>

<h2>Примеры блоков</h2>

<h3>Блок с текстовым полем ввода</h3>

<pre><code>{
  "type": "example_input_text",
  "message0": "текстовое поле: %1",
  "args0": [
    { "type": "field_input", "name": "TEXT", "text": "значение по умолчанию" }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 160,
  "tooltip": "Пример блока с текстовым полем"
}
</code></pre>

<h3>Блок с числовым полем ввода</h3>

<pre><code>{
  "type": "example_input_number",
  "message0": "число: %1",
  "args0": [
    { "type": "field_number", "name": "NUM", "value": 42, "min": 0, "max": 100 }
  ],
  "output": "Number",
  "colour": 230,
  "tooltip": "Возвращает число"
}
</code></pre>

<h3>Блок с выпадающим списком</h3>

<pre><code>{
  "type": "example_dropdown",
  "message0": "выбрать %1",
  "args0": [
    { "type": "field_dropdown", "name": "CHOICE", "options": [["первый","FIRST"],["второй","SECOND"],["третий","THIRD"]] }
  ],
  "output": null,
  "colour": 290,
  "tooltip": "Выберите опцию"
}
</code></pre>

<h3>Блок с подключаемым значением</h3>

<pre><code>{
  "type": "example_input_value",
  "message0": "значение: %1",
  "args0": [
    { "type": "input_value", "name": "VALUE", "check": "Number" }
  ],
  "output": "Number",
  "colour": 120,
  "tooltip": "Принимает числовое значение"
}
</code></pre>

<h2>Функция init</h2>

<p>Вместо JSON-описания можно использовать функцию <code>init</code>, которая программно настраивает блок:</p>

<pre><code>Blockly.Blocks['example_block'] = {
  init: function() {
    this.setColour(120);
    this.appendDummyInput().appendField("Мой блок");
    this.appendValueInput("VALUE").setCheck("Number").appendField("со значением");
    this.setOutput(true, "Number");
    this.setTooltip("Описание блока");
  }
};
</code></pre>

<h2>Генераторы кода</h2>
<p>Генераторы определяют, какой код будет создан для каждого блока.</p>

<h3>JavaScript генератор</h3>
<pre><code>javascript.forBlock['example_block'] = function(block) {
  const value = javascript.valueToCode(block, 'VALUE', javascript.ORDER_ATOMIC);
  const code = \`Math.sqrt(\${value})\`;
  return [code, javascript.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Python генератор</h3>
<pre><code>python.forBlock['example_block'] = function(block) {
  const value = python.valueToCode(block, 'VALUE', python.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, python.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Lua генератор</h3>
<pre><code>lua.forBlock['example_block'] = function(block) {
  const value = lua.valueToCode(block, 'VALUE', lua.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, lua.ORDER_FUNCTION_CALL];
};
</code></pre>

<h2>Порядок операций</h2>
<p>При генерации кода важно учитывать приоритет операций. Для этого используются константы ORDER_*:</p>

<ul>
<li>ORDER_ATOMIC: Атомарные значения (числа, строки)</li>
<li>ORDER_FUNCTION_CALL: Вызов функции</li>
<li>ORDER_MULTIPLICATIVE: Умножение, деление</li>
<li>ORDER_ADDITIVE: Сложение, вычитание</li>
<li>ORDER_RELATIONAL: Сравнения (&lt;, &gt;, &lt;=, &gt;=)</li>
<li>ORDER_EQUALITY: Равенство (==, !=)</li>
<li>ORDER_LOGICAL_AND: Логическое И (&amp;&amp;)</li>
<li>ORDER_LOGICAL_OR: Логическое ИЛИ (||)</li>
<li>ORDER_NONE: Без приоритета (требуются скобки)</li>
</ul>

<h2>Советы по созданию блоков</h2>
<ol>
<li>Используйте понятные названия и описания</li>
<li>Выбирайте цвета в соответствии с категорией блока</li>
<li>Добавляйте подробные подсказки (tooltip)</li>
<li>Проверяйте типы входных значений</li>
<li>Тестируйте блоки с разными входными данными</li>
<li>Обрабатывайте краевые случаи в генераторах кода</li>
</ol>`;

        const en = `
<h1>Guide to Creating Custom Blocks</h1>

<h2>JSON Block Structure</h2>

<p>Each block is defined by a JSON object with the following fields:</p>

<h3>Required Fields</h3>

<ul>
<li><strong>type</strong>: Unique block identifier (string)</li>
<li><strong>message0</strong>: Text displayed on the block (may contain placeholders %1, %2, etc.)</li>
<li><strong>args0</strong>: Array of arguments matching placeholders in message0</li>
<li><strong>colour</strong>: Block color (number 0–360 or HEX string)</li>
<li><strong>tooltip</strong>: Tooltip shown on hover</li>
<li><strong>helpUrl</strong>: URL for additional information</li>
<li><strong>inputsInline</strong>: Inputs layout (true — inline, false — vertical)</li>
<li><strong>previousStatement</strong>: Connection at the top (true or connection type)</li>
<li><strong>nextStatement</strong>: Connection at the bottom (true or connection type)</li>
<li><strong>output</strong>: Output type (string or null)</li>
</ul>

<h2>Block Examples</h2>

<h3>Block with text input</h3>
<pre><code>{
  "type": "example_input_text",
  "message0": "text field: %1",
  "args0": [ { "type": "field_input", "name": "TEXT", "text": "default value" } ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 160,
  "tooltip": "Example block with a text field"
}
</code></pre>

<h3>Block with number input</h3>
<pre><code>{
  "type": "example_input_number",
  "message0": "number: %1",
  "args0": [ { "type": "field_number", "name": "NUM", "value": 42, "min": 0, "max": 100 } ],
  "output": "Number",
  "colour": 230,
  "tooltip": "Returns a number"
}
</code></pre>

<h3>Block with dropdown</h3>
<pre><code>{
  "type": "example_dropdown",
  "message0": "choose %1",
  "args0": [ { "type": "field_dropdown", "name": "CHOICE", "options": [["first","FIRST"],["second","SECOND"],["third","THIRD"]] } ],
  "output": null,
  "colour": 290,
  "tooltip": "Choose an option"
}
</code></pre>

<h3>Block with input value</h3>
<pre><code>{
  "type": "example_input_value",
  "message0": "value: %1",
  "args0": [ { "type": "input_value", "name": "VALUE", "check": "Number" } ],
  "output": "Number",
  "colour": 120,
  "tooltip": "Accepts a number"
}
</code></pre>

<h2>init function</h2>
<p>Instead of JSON you can use <code>init</code> function to programmatically configure a block:</p>

<pre><code>Blockly.Blocks['example_block'] = {
  init: function() {
    this.setColour(120);
    this.appendDummyInput().appendField("My block");
    this.appendValueInput("VALUE").setCheck("Number").appendField("with value");
    this.setOutput(true, "Number");
    this.setTooltip("Block description");
  }
};
</code></pre>

<h2>Code generators</h2>
<p>Generators define what code will be produced for a block.</p>

<h3>JavaScript generator</h3>
<pre><code>javascript.forBlock['example_block'] = function(block) {
  const value = javascript.valueToCode(block, 'VALUE', javascript.ORDER_ATOMIC);
  const code = \`Math.sqrt(\${value})\`;
  return [code, javascript.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Python generator</h3>
<pre><code>python.forBlock['example_block'] = function(block) {
  const value = python.valueToCode(block, 'VALUE', python.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, python.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Lua generator</h3>
<pre><code>lua.forBlock['example_block'] = function(block) {
  const value = lua.valueToCode(block, 'VALUE', lua.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, lua.ORDER_FUNCTION_CALL];
};
</code></pre>

<h2>Operator precedence</h2>
<p>When generating code, consider operator precedence via ORDER_* constants:</p>

<ul>
<li>ORDER_ATOMIC: atomic values (numbers, strings)</li>
<li>ORDER_FUNCTION_CALL: function call</li>
<li>ORDER_MULTIPLICATIVE: multiply, divide</li>
<li>ORDER_ADDITIVE: add, subtract</li>
<li>ORDER_RELATIONAL: comparisons (&lt;, &gt;, &lt;=, &gt;=)</li>
<li>ORDER_EQUALITY: equality (==, !=)</li>
<li>ORDER_LOGICAL_AND: logical AND (&amp;&amp;)</li>
<li>ORDER_LOGICAL_OR: logical OR (||)</li>
<li>ORDER_NONE: no precedence (needs parentheses)</li>
</ul>

<h2>Tips</h2>
<ol>
<li>Use clear names and descriptions</li>
<li>Pick colors matching the block category</li>
<li>Add helpful tooltips</li>
<li>Validate input types</li>
<li>Test with different inputs</li>
<li>Handle edge cases in generators</li>
</ol>`;

        const lang = getAppLang();
        markdownContent.innerHTML = lang === "ru" ? ru : en;
      }
    });

    // Закрытие модального окна при клике на крестик
    closeHelpModal.addEventListener("click", () => {
      if (helpModal) {
        helpModal.style.display = "none";
      }
    });

    // Закрытие модального окна при клике вне его содержимого
    window.addEventListener("click", (event) => {
      if (event.target === helpModal) {
        helpModal.style.display = "none";
      }
    });

    // Добавляем возможность перетаскивания модального окна
    const helpModalContent = document.getElementById("helpModalContent");
    const helpModalHeader = helpModalContent?.querySelector(".modal-header");

    if (helpModalContent && helpModalHeader) {
      makeModalDraggable(
        helpModalContent as HTMLElement,
        helpModalHeader as HTMLElement,
        "#closeHelpModal",
      );
    }
  }
}


export function initSupportModalLocal() {
  const supportBtn = document.getElementById(
    "supportBtn",
  ) as HTMLButtonElement | null;
  const supportModal = document.getElementById(
    "supportModal",
  ) as HTMLDivElement | null;
  const closeSupportModal = document.getElementById(
    "closeSupportModal",
  ) as HTMLSpanElement | null;
  const closeSupportBtn = document.getElementById(
    "closeSupportBtn",
  ) as HTMLButtonElement | null;
  const copyCardBtn = document.getElementById(
    "copyCardBtn",
  ) as HTMLButtonElement | null;
  const supportCardNumberEl = document.getElementById(
    "supportCardNumber",
  ) as HTMLDivElement | null;
  const copyCardStatusEl = document.getElementById(
    "copyCardStatus",
  ) as HTMLDivElement | null;
  if (!supportModal || !supportBtn) return;
  supportBtn.addEventListener("click", () => {
    supportModal.style.display = "block";
  });
  const close = () => {
    supportModal.style.display = "none";
  };
  if (closeSupportModal) closeSupportModal.addEventListener("click", close);
  if (closeSupportBtn) closeSupportBtn.addEventListener("click", close);
  supportModal.addEventListener("click", (e) => {
    if (e.target === supportModal) close();
  });
  if (copyCardBtn && supportCardNumberEl) {
    copyCardBtn.addEventListener("click", async () => {
      const text = (
        supportCardNumberEl.getAttribute("data-card") ||
        supportCardNumberEl.textContent ||
        ""
      ).trim();
      try {
        await navigator.clipboard.writeText(text);
        if (copyCardStatusEl) {
          copyCardStatusEl.style.display = "block";
          setTimeout(() => {
            if (copyCardStatusEl) copyCardStatusEl.style.display = "none";
          }, 2000);
        }
      } catch {}
    });
  }
}
