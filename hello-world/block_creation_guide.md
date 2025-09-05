# Руководство по созданию пользовательских блоков

## Структура JSON-описания блока

Каждый блок определяется JSON-объектом со следующими основными полями:

### Обязательные поля

- **type**: Уникальный идентификатор блока (строка)
- **message0**: Текст, отображаемый на блоке (может содержать заполнители %1, %2 и т.д.)
- **args0**: Массив аргументов, соответствующих заполнителям в message0

### Дополнительные поля

- **colour**: Цвет блока (число от 0 до 360 или строка с HEX-кодом)
- **tooltip**: Всплывающая подсказка при наведении на блок
- **helpUrl**: URL страницы с дополнительной информацией
- **inputsInline**: Расположение входов (true - в линию, false - вертикально)
- **previousStatement**: Позволяет подключать блок сверху (true или тип соединения)
- **nextStatement**: Позволяет подключать блок снизу (true или тип соединения)
- **output**: Тип выходного значения блока (строка или null)

## Примеры блоков

### Блок с текстовым полем ввода

```json
{
  "type": "example_input_text",
  "message0": "текстовое поле: %1",
  "args0": [
    {
      "type": "field_input",
      "name": "TEXT",
      "text": "значение по умолчанию"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 160,
  "tooltip": "Пример блока с текстовым полем"
}
```

### Блок с числовым полем ввода

```json
{
  "type": "example_input_number",
  "message0": "число: %1",
  "args0": [
    {
      "type": "field_number",
      "name": "NUM",
      "value": 42,
      "min": 0,
      "max": 100
    }
  ],
  "output": "Number",
  "colour": 230,
  "tooltip": "Возвращает число"
}
```

### Блок с выпадающим списком

```json
{
  "type": "example_dropdown",
  "message0": "выбрать %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "CHOICE",
      "options": [
        ["первый", "FIRST"],
        ["второй", "SECOND"],
        ["третий", "THIRD"]
      ]
    }
  ],
  "output": null,
  "colour": 290,
  "tooltip": "Выберите опцию"
}
```

### Блок с подключаемым значением

```json
{
  "type": "example_input_value",
  "message0": "значение: %1",
  "args0": [
    {
      "type": "input_value",
      "name": "VALUE",
      "check": "Number"
    }
  ],
  "output": "Number",
  "colour": 120,
  "tooltip": "Принимает числовое значение"
}
```

## Функция init

Вместо JSON-описания можно использовать функцию `init`, которая программно настраивает блок:

```javascript
Blockly.Blocks['example_block'] = {
  init: function() {
    this.setColour(120);
    this.appendDummyInput()
        .appendField("Мой блок");
    this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("со значением");
    this.setOutput(true, "Number");
    this.setTooltip("Описание блока");
  }
};
```

## Генераторы кода

Генераторы определяют, какой код будет создан для каждого блока.

### JavaScript генератор

```javascript
javascript.forBlock['example_block'] = function(block) {
  const value = javascript.valueToCode(block, 'VALUE', javascript.ORDER_ATOMIC);
  const code = `Math.sqrt(${value})`;
  return [code, javascript.ORDER_FUNCTION_CALL];
};
```

### Python генератор

```python
python.forBlock['example_block'] = function(block) {
  const value = python.valueToCode(block, 'VALUE', python.ORDER_ATOMIC);
  const code = `math.sqrt(${value})`;
  return [code, python.ORDER_FUNCTION_CALL];
};
```

### Lua генератор

```lua
lua.forBlock['example_block'] = function(block) {
  const value = lua.valueToCode(block, 'VALUE', lua.ORDER_ATOMIC);
  const code = `math.sqrt(${value})`;
  return [code, lua.ORDER_FUNCTION_CALL];
};
```

## Порядок операций

При генерации кода важно учитывать приоритет операций. Для этого используются константы ORDER_*:

- ORDER_ATOMIC: Атомарные значения (числа, строки)
- ORDER_FUNCTION_CALL: Вызов функции
- ORDER_MULTIPLICATIVE: Умножение, деление
- ORDER_ADDITIVE: Сложение, вычитание
- ORDER_RELATIONAL: Сравнения (<, >, <=, >=)
- ORDER_EQUALITY: Равенство (==, !=)
- ORDER_LOGICAL_AND: Логическое И (&&)
- ORDER_LOGICAL_OR: Логическое ИЛИ (||)
- ORDER_NONE: Без приоритета (требуются скобки)

## Советы по созданию блоков

1. Используйте понятные названия и описания
2. Выбирайте цвета в соответствии с категорией блока
3. Добавляйте подробные подсказки (tooltip)
4. Проверяйте типы входных значений
5. Тестируйте блоки с разными входными данными
6. Обрабатывайте краевые случаи в генераторах кода