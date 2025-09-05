# Руководство по созданию блоков в Blockly

Это руководство объясняет структуру JSON для создания пользовательских блоков в Blockly. Мы рассмотрим каждое поле в определении блока и объясним его назначение.

## Основная структура блока

Блок в Blockly определяется с помощью JSON объекта со следующими основными полями:

```javascript
const myBlock = {
  type: 'my_block',           // Уникальный идентификатор блока
  message0: 'Мой блок %1',    // Текст блока с заполнителями для аргументов
  args0: [                    // Определение аргументов
    {
      type: 'input_value',   // Тип входа
      name: 'INPUT',          // Имя входа для доступа в генераторе
      check: 'String'         // Тип проверки (опционально)
    }
  ],
  output: 'String',           // Тип выходного значения (для блоков-выражений)
  // ИЛИ
  previousStatement: null,    // Разрешить соединение сверху (для блоков-операторов)
  nextStatement: null,        // Разрешить соединение снизу (для блоков-операторов)
  
  colour: 160,                // Цвет блока (0-360)
  tooltip: 'Описание блока',  // Всплывающая подсказка
  helpUrl: ''                 // URL справки
};
```

## Подробное описание полей

### Обязательные поля

| Поле | Описание |
|------|----------|
| `type` | Уникальный идентификатор блока. Используется для ссылки на блок в коде и генераторах. |
| `message0` | Текст, отображаемый на блоке. Может содержать заполнители `%1`, `%2` и т.д., которые заменяются элементами из `args0`. |

### Поля для определения внешнего вида

| Поле | Описание |
|------|----------|
| `colour` | Цвет блока в диапазоне 0-360 (как в HSV) или строка с шестнадцатеричным значением цвета. |
| `tooltip` | Текст всплывающей подсказки при наведении на блок. |
| `helpUrl` | URL-адрес страницы справки для блока. |

### Поля для определения соединений

Блоки могут быть двух основных типов: блоки-операторы (statements) и блоки-выражения (expressions).

**Для блоков-операторов:**

| Поле | Описание |
|------|----------|
| `previousStatement` | Тип соединения сверху или `null` для любого типа. |
| `nextStatement` | Тип соединения снизу или `null` для любого типа. |

**Для блоков-выражений:**

| Поле | Описание |
|------|----------|
| `output` | Тип выходного значения или `null` для любого типа. |

### Определение аргументов (args0)

Массив `args0` содержит объекты, определяющие аргументы блока, которые соответствуют заполнителям `%1`, `%2` и т.д. в `message0`.

#### Типы аргументов

1. **Поля ввода (input_value)**

```javascript
{
  type: 'input_value',  // Вход для подключения блока-выражения
  name: 'INPUT',        // Имя для доступа в генераторе
  check: 'String'       // Тип проверки (опционально)
}
```

2. **Поля для оператора (input_statement)**

```javascript
{
  type: 'input_statement',  // Вход для подключения блока-оператора
  name: 'DO',               // Имя для доступа в генераторе
  check: 'Action'           // Тип проверки (опционально)
}
```

3. **Текстовые поля (field_input)**

```javascript
{
  type: 'field_input',   // Текстовое поле для ввода
  name: 'TEXT',          // Имя для доступа в генераторе
  text: 'default'        // Значение по умолчанию
}
```

4. **Выпадающие списки (field_dropdown)**

```javascript
{
  type: 'field_dropdown',  // Выпадающий список
  name: 'DIRECTION',       // Имя для доступа в генераторе
  options: [              // Варианты выбора
    ['вверх', 'UP'],      // [отображаемый текст, значение]
    ['вниз', 'DOWN']
  ]
}
```

5. **Числовые поля (field_number)**

```javascript
{
  type: 'field_number',  // Числовое поле
  name: 'NUM',           // Имя для доступа в генераторе
  value: 0,              // Значение по умолчанию
  min: 0,                // Минимальное значение (опционально)
  max: 100,              // Максимальное значение (опционально)
  precision: 1           // Шаг изменения (опционально)
}
```

6. **Угловые поля (field_angle)**

```javascript
{
  type: 'field_angle',  // Поле для выбора угла
  name: 'ANGLE',        // Имя для доступа в генераторе
  angle: 90             // Значение по умолчанию
}
```

7. **Цветовые поля (field_colour)**

```javascript
{
  type: 'field_colour',  // Поле для выбора цвета
  name: 'COLOUR',        // Имя для доступа в генераторе
  colour: '#ff0000'      // Значение по умолчанию
}
```

8. **Флажки (field_checkbox)**

```javascript
{
  type: 'field_checkbox',  // Поле-флажок
  name: 'CHECKED',         // Имя для доступа в генераторе
  checked: true            // Значение по умолчанию
}
```

9. **Изображения (field_image)**

```javascript
{
  type: 'field_image',     // Поле с изображением
  src: 'path/to/img.png',  // Путь к изображению
  width: 16,               // Ширина
  height: 16,              // Высота
  alt: '*'                 // Альтернативный текст
}
```

### Дополнительные сообщения

Блок может содержать несколько строк текста с помощью полей `message1`, `message2` и т.д., с соответствующими массивами аргументов `args1`, `args2` и т.д.

```javascript
const complexBlock = {
  type: 'complex_block',
  message0: 'если %1',
  args0: [
    {
      type: 'input_value',
      name: 'CONDITION',
      check: 'Boolean'
    }
  ],
  message1: 'то %1',
  args1: [
    {
      type: 'input_statement',
      name: 'DO'
    }
  ],
  message2: 'иначе %1',
  args2: [
    {
      type: 'input_statement',
      name: 'ELSE'
    }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210
};
```

### Функция init

Функция `init` позволяет динамически настраивать блок при его создании:

```javascript
const myBlock = {
  type: 'my_block',
  // ... другие поля ...
  
  init: function(this: Blockly.Block) {
    this.setColour(160);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Описание блока');
    this.setHelpUrl('');
    // Другие настройки блока
  }
};
```

## Генераторы кода

Генераторы кода определяют, как блок преобразуется в код конкретного языка программирования.

### JavaScript генератор

```javascript
forBlock['my_block'] = function(block, generator) {
  const value = generator.valueToCode(block, 'INPUT', Order.NONE) || "''";
  const code = `console.log(${value});
`;
  return code;
};
```

### Python генератор

```javascript
forBlock['my_block'] = function(block, generator) {
  const value = generator.valueToCode(block, 'INPUT', PythonOrder.NONE) || "''";
  const code = `print(${value})
`;
  return code;
};
```

### Lua генератор

```javascript
forBlock['my_block'] = function(block, generator) {
  const value = generator.valueToCode(block, 'INPUT', LuaOrder.NONE) || "''";
  const code = `print(${value})
`;
  return code;
};
```

## Регистрация блоков

После определения блоков их нужно зарегистрировать в Blockly:

```javascript
// Создание определений блоков из JSON массива
const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  myBlock,
  anotherBlock
]);

// Регистрация блоков в Blockly
Blockly.common.defineBlocks(blocks);
```

## Пример полного определения блока

```javascript
const addText = {
  type: 'add_text',
  message0: 'вывести текст %1',
  args0: [
    {
      type: 'input_value',
      name: 'TEXT',
      check: ['String', 'Number'],
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 160,
  tooltip: 'Выводит текст в консоль',
  helpUrl: '',
  
  init: function(this: Blockly.Block) {
    this.setColour(160);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Выводит текст в консоль');
    this.setHelpUrl('');
  }
};

// Генератор JavaScript
forBlock['add_text'] = function(block, generator) {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const code = `console.log(${text});
`;
  return code;
};

// Генератор Python
forBlock['add_text'] = function(block, generator) {
  const text = generator.valueToCode(block, 'TEXT', PythonOrder.NONE) || "''";
  const code = `print(${text})
`;
  return code;
};

// Генератор Lua
forBlock['add_text'] = function(block, generator) {
  const text = generator.valueToCode(block, 'TEXT', LuaOrder.NONE) || "''";
  const code = `print(${text})
`;
  return code;
};
```

## Примеры блоков

В файле `block_examples.json` в этой же директории вы найдете готовые примеры блоков, которые можно использовать как шаблоны для создания собственных блоков. Эти примеры включают:

- Текстовый блок
- Числовой блок
- Блок с выпадающим списком
- Блок условия (if)
- Блок условия с веткой иначе (if-else)
- Блок повторения (for)
- Блок функции
- Блок параметра функции
- Блок возврата значения
- Блоки для работы с переменными

Каждый пример содержит полное определение блока и генератор кода для JavaScript.

## Заключение

Создание пользовательских блоков в Blockly требует понимания структуры JSON определений и написания соответствующих генераторов кода. Этот гайд охватывает основные аспекты создания блоков, но для более сложных случаев рекомендуется обратиться к [официальной документации Blockly](https://developers.google.com/blockly/guides/create-custom-blocks/overview).