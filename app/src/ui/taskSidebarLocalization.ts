// Локализация статичных элементов панели задач: заголовки, кнопки,
// инфоблоки (консоль, циклы, списки и т.д.). Строки берутся из глобального
// (window)._currentLocalizedStrings с фолбэком на inline RU/EN тексты.
// Вынесено из index.ts.

export function localizeTaskSidebarStaticUI(lang: "ru" | "en") {
  const t = (window as any)._currentLocalizedStrings;

  const nextLabel =
    t?.NextTask || (lang === "ru" ? "Следующая задача" : "Next task");
  const prevLabel =
    t?.PrevTask || (lang === "ru" ? "Предыдущая задача" : "Previous task");
  const btn = document.getElementById("nextTaskBtn");
  if (btn) btn.textContent = `${nextLabel} →`;
  const prev = document.getElementById("prevTaskBtn");
  if (prev) prev.textContent = `← ${prevLabel}`;

  const solText = document.getElementById("taskSolutionBtnText");
  if (solText)
    (solText as HTMLElement).textContent = `ℹ️ ${
      t?.TaskSolutions || (lang === "ru" ? "Решение задач" : "Task Solutions")
    }`;

  const checkBtn = document.getElementById("checkTaskBtn");
  if (checkBtn)
    (checkBtn as HTMLElement).textContent =
      t?.CheckSolution ||
      (lang === "ru" ? "Проверить решение" : "Check solution");

  const hintSummary = document.getElementById("taskHintSummary");
  if (hintSummary)
    (hintSummary as HTMLElement).textContent =
      t?.TaskHintLabel || (lang === "ru" ? "Подсказка" : "Hint");

  const diffBasic = document.getElementById("taskDifficultyBasic");
  if (diffBasic)
    (diffBasic as HTMLElement).textContent =
      t?.TaskDifficultyBasic || (lang === "ru" ? "Основа" : "Basic");
  const diffAdvanced = document.getElementById("taskDifficultyAdvanced");
  if (diffAdvanced)
    (diffAdvanced as HTMLElement).textContent =
      t?.TaskDifficultyAdvanced || (lang === "ru" ? "Продвинутый" : "Advanced");

  const criteriaLabel = document.getElementById("taskStarsCriteriaLabel");
  if (criteriaLabel) {
    (criteriaLabel as HTMLElement).textContent =
      t?.StarsCriteria ||
      (lang === "ru" ? "Критерии звёзд:" : "Stars criteria:");
  }
  const starsOptimal =
    t?.StarsOptimal ||
    (lang === "ru"
      ? "оптимально (минимум блоков)"
      : "optimal (minimum blocks)");
  const starsGood = t?.StarsGood || (lang === "ru" ? "хорошо" : "good");
  const starsCorrect =
    t?.StarsCorrect || (lang === "ru" ? "решение верное" : "solution correct");
  const optimalEl = document.getElementById("taskStarsCriteriaOptimal");
  if (optimalEl)
    (optimalEl as HTMLElement).textContent = `★★★ — ${starsOptimal}`;
  const goodEl = document.getElementById("taskStarsCriteriaGood");
  if (goodEl) (goodEl as HTMLElement).textContent = `★★ — ${starsGood}`;
  const correctEl = document.getElementById("taskStarsCriteriaCorrect");
  if (correctEl) (correctEl as HTMLElement).textContent = `★ — ${starsCorrect}`;

  const consoleHeader = document.getElementById("consoleOutputHeader");
  if (consoleHeader)
    (consoleHeader as HTMLElement).textContent =
      t?.ConsoleOutputHeader ||
      (lang === "ru" ? "Вывод в консоль:" : "Console output:");

  const consoleDesc = document.getElementById("consoleOutputDescription");
  if (consoleDesc)
    (consoleDesc as HTMLElement).textContent =
      t?.ConsoleOutputDescription ||
      (lang === "ru"
        ? "Для вывода информации в консоль используйте следующие функции в зависимости от выбранного языка:"
        : "Use the following functions to print to the console depending on the selected language:");

  const consoleNote = document.getElementById("consoleOutputNote");
  if (consoleNote)
    (consoleNote as HTMLElement).textContent =
      t?.ConsoleOutputNote ||
      (lang === "ru"
        ? "Примечание: Результат вывода будет отображаться в окне вывода справа внизу."
        : "Note: The output will be shown in the output window at the bottom right.");

  const setText = (id: string, value: any) => {
    const el = document.getElementById(id);
    if (el && typeof value === "string")
      (el as HTMLElement).textContent = value;
  };

  setText("forLoopInfoHeader", t?.ForLoopInfoHeader);
  setText("forLoopIntroPrefix", t?.ForLoopIntroPrefix);
  setText("forLoopIntroMid", t?.ForLoopIntroMid);
  setText("forLoopIntroSuffix", t?.ForLoopIntroSuffix);
  setText("forLoopPartsHeader", t?.ForLoopPartsHeader);
  setText("forLoopStartLabel", t?.ForLoopStartLabel);
  setText("forLoopStartDesc", t?.ForLoopStartDesc);
  setText("forLoopEndLabel", t?.ForLoopEndLabel);
  setText("forLoopEndDesc", t?.ForLoopEndDesc);
  setText("forLoopStepLabel", t?.ForLoopStepLabel);
  setText("forLoopStepDesc", t?.ForLoopStepDesc);
  setText("forLoopBodyLabel", t?.ForLoopBodyLabel);
  setText("forLoopBodyDescPrefix", t?.ForLoopBodyDescPrefix);
  setText("forLoopBodyDescSuffix", t?.ForLoopBodyDescSuffix);
  setText("forLoopExampleHeader", t?.ForLoopExampleHeader);
  setText("forLoopErrorsHeader", t?.ForLoopErrorsHeader);
  setText("forLoopErr1Title", t?.ForLoopErr1Title);
  setText("forLoopErr1TextBefore", t?.ForLoopErr1TextBefore);
  setText("forLoopErr1TextMiddle", t?.ForLoopErr1TextMiddle);
  setText("forLoopErr1TextAfter", t?.ForLoopErr1TextAfter);
  setText("forLoopErr2Title", t?.ForLoopErr2Title);
  setText("forLoopErr2Text", t?.ForLoopErr2Text);
  setText("forLoopErr3Title", t?.ForLoopErr3Title);
  setText("forLoopErr3Text", t?.ForLoopErr3Text);
  setText("forLoopNote", t?.ForLoopNote);

  setText("whileLoopInfoHeader", t?.WhileLoopInfoHeader);
  setText("whileLoopIntroPrefix", t?.WhileLoopIntroPrefix);
  setText("whileLoopIntroSuffix", t?.WhileLoopIntroSuffix);
  setText("whileLoopPartsHeader", t?.WhileLoopPartsHeader);
  setText("whileLoopCondLabel", t?.WhileLoopCondLabel);
  setText("whileLoopCondDesc", t?.WhileLoopCondDesc);
  setText("whileLoopBodyLabel", t?.WhileLoopBodyLabel);
  setText("whileLoopBodyDesc", t?.WhileLoopBodyDesc);
  setText("whileLoopChangeLabel", t?.WhileLoopChangeLabel);
  setText("whileLoopChangeDesc", t?.WhileLoopChangeDesc);
  setText("whileLoopDiffHeader", t?.WhileLoopDiffHeader);
  setText("whileLoopDiffFor", t?.WhileLoopDiffFor);
  setText("whileLoopDiffWhile", t?.WhileLoopDiffWhile);
  setText("whileLoopExampleHeader", t?.WhileLoopExampleHeader);
  setText("whileJsCode", t?.WhileJsCode);
  setText("whilePyCode", t?.WhilePyCode);
  setText("whileLuaCode", t?.WhileLuaCode);
  setText("whilePhpCode", t?.WhilePhpCode);
  setText("whileLoopErrorsHeader", t?.WhileLoopErrorsHeader);
  setText("whileLoopErr1Title", t?.WhileLoopErr1Title);
  setText("whileLoopErr1Text", t?.WhileLoopErr1Text);
  setText("whileLoopErr2Title", t?.WhileLoopErr2Title);
  setText("whileLoopErr2TextBefore", t?.WhileLoopErr2TextBefore);
  setText("whileLoopErr3Title", t?.WhileLoopErr3Title);
  setText("whileLoopErr3Text", t?.WhileLoopErr3Text);
  setText("whileLoopNote", t?.WhileLoopNote);

  setText("listInfoHeader", t?.ListInfoHeader);
  setText("listInfoIntroBefore", t?.ListInfoIntroBefore);
  setText("listInfoIntroAfter", t?.ListInfoIntroAfter);
  setText("listInfoWhyHeader", t?.ListInfoWhyHeader);
  setText("listInfoWhy1", t?.ListInfoWhy1);
  setText("listInfoWhy2", t?.ListInfoWhy2);
  setText("listInfoWhy3", t?.ListInfoWhy3);
  setText("listInfoForEachHeader", t?.ListInfoForEachHeader);
  setText("listInfoForEachBefore", t?.ListInfoForEachBefore);
  setText("listInfoForEachBlockName", t?.ListInfoForEachBlockName);
  setText("listInfoForEachAfter", t?.ListInfoForEachAfter);
  setText("listInfoForEachMid", t?.ListInfoForEachMid);
  setText("listInfoForEachEnd", t?.ListInfoForEachEnd);
  setText("listInfoJsNote", t?.ListInfoJsNote);
  setText("listInfoExampleHeader", t?.ListInfoExampleHeader);
  setText("listInfoNoteBefore", t?.ListInfoNoteBefore);
  setText("listInfoNoteMid", t?.ListInfoNoteMid);
  setText("listInfoNoteAfter", t?.ListInfoNoteAfter);
  setText("listInfoNoteEnd", t?.ListInfoNoteEnd);

  setText("sublistInfoHeader", t?.SublistInfoHeader);
  setText("sublistInfoIntroBefore", t?.SublistInfoIntroBefore);
  setText("sublistInfoIntroStrong", t?.SublistInfoIntroStrong);
  setText("sublistInfoIntroAfter", t?.SublistInfoIntroAfter);
  setText("sublistInfoHowHeader", t?.SublistInfoHowHeader);
  setText("sublistInfoStep1", t?.SublistInfoStep1);
  setText("sublistInfoStep2", t?.SublistInfoStep2);
  setText("sublistInfoStep3", t?.SublistInfoStep3);
  setText("sublistInfoNote", t?.SublistInfoNote);
  setText("sublistLangHeader", t?.SublistLangHeader);
  setText("sublistIndexNote", t?.SublistIndexNote);
  setText("sublistJsHeader", t?.SublistJsHeader);
  setText("sublistJsCode", t?.SublistJsCode);
  setText("sublistJsExplain", t?.SublistJsExplain);
  setText("sublistPyHeader", t?.SublistPyHeader);
  setText("sublistPyCode", t?.SublistPyCode);
  setText("sublistPyExplain", t?.SublistPyExplain);
  setText("sublistLuaHeader", t?.SublistLuaHeader);
  setText("sublistLuaCode", t?.SublistLuaCode);
  setText("sublistLuaExplain", t?.SublistLuaExplain);
  setText("sublistPhpHeader", t?.SublistPhpHeader);
  setText("sublistPhpCode", t?.SublistPhpCode);
  setText("sublistPhpExplain", t?.SublistPhpExplain);
  setText("sublistAltNote", t?.SublistAltNote);
  setText("listFilterHeader", t?.ListFilterHeader);
  setText("listFilterIntro", t?.ListFilterIntro);
  setText("listFilterHowHeader", t?.ListFilterHowHeader);
  setText("listFilterStep1", t?.ListFilterStep1);
  setText("listFilterStep2", t?.ListFilterStep2);
  setText("listFilterStep3", t?.ListFilterStep3);
  setText("listFilterNote", t?.ListFilterNote);
  setText("listFilterLangHeader", t?.ListFilterLangHeader);
  setText("listFilterJsNote", t?.ListFilterJsNote);
  setText("listFilterJsCode", t?.ListFilterJsCode);
  setText("listFilterPyCode", t?.ListFilterPyCode);
  setText("listFilterLuaCode", t?.ListFilterLuaCode);
  setText("listFilterPhpCode", t?.ListFilterPhpCode);
  setText("listFilterMinMaxHeader", t?.ListFilterMinMaxHeader);
  setText("listFilterMinMaxText", t?.ListFilterMinMaxText);
  setText("listFilterMinMaxNewHeader", t?.ListFilterMinMaxNewHeader);
  setText("listFilterMinMaxPushText", t?.ListFilterMinMaxPushText);
  setText("listFilterMinMaxDotText", t?.ListFilterMinMaxDotText);
  setText("listFilterMinMaxApplyText", t?.ListFilterMinMaxApplyText);
  setText("listFilterMinMaxAppendText", t?.ListFilterMinMaxAppendText);
  setText("listFilterMinMaxJsCode", t?.ListFilterMinMaxJsCode);
  setText("listFilterMinMaxPyCode", t?.ListFilterMinMaxPyCode);

  setText("consoleJsLogTextCode", t?.ConsoleJsLogTextCode);
  setText("consoleJsLogNumberCode", t?.ConsoleJsLogNumberCode);
  setText("consoleJsLogTextVarCode", t?.ConsoleJsLogTextVarCode);
  setText("consoleJsTemplateCode", t?.ConsoleJsTemplateCode);
  setText("consolePyPrintTextCode", t?.ConsolePyPrintTextCode);
  setText("consolePyPrintNumberCode", t?.ConsolePyPrintNumberCode);
  setText("consolePyPrintTextVarCode", t?.ConsolePyPrintTextVarCode);
  setText("consolePyFStringCode", t?.ConsolePyFStringCode);
  setText("consoleLuaPrintTextCode", t?.ConsoleLuaPrintTextCode);
  setText("consoleLuaPrintNumberCode", t?.ConsoleLuaPrintNumberCode);
  setText("consoleLuaPrintTextVarCode", t?.ConsoleLuaPrintTextVarCode);
  setText("consoleLuaFormatCode", t?.ConsoleLuaFormatCode);
  setText("consolePhpEchoTextCode", t?.ConsolePhpEchoTextCode);
  setText("consolePhpEchoNumberCode", t?.ConsolePhpEchoNumberCode);
  setText("consolePhpEchoTextVarCode", t?.ConsolePhpEchoTextVarCode);

  const textDesc =
    t?.ConsoleTextDesc || (lang === "ru" ? "вывод текста" : "print text");
  const numberDesc =
    t?.ConsoleNumberDesc || (lang === "ru" ? "вывод числа" : "print number");
  const textVarDesc =
    t?.ConsoleTextVarDesc ||
    (lang === "ru" ? "вывод текста и значения" : "print text and value");
  const jsTemplateDesc =
    t?.ConsoleJsTemplateDesc ||
    (lang === "ru" ? "шаблонные строки" : "template strings");
  const pyFStringDesc =
    t?.ConsolePyFStringDesc ||
    (lang === "ru"
      ? "f-строки для форматирования"
      : "f-strings for formatting");
  const luaFormatDesc =
    t?.ConsoleLuaFormatDesc ||
    (lang === "ru" ? "форматирование строк" : "string formatting");

  setText("consoleJsLogTextDesc", textDesc);
  setText("consoleJsLogNumberDesc", numberDesc);
  setText("consoleJsLogTextVarDesc", textVarDesc);
  setText("consoleJsTemplateDesc", jsTemplateDesc);
  setText("consolePyPrintTextDesc", textDesc);
  setText("consolePyPrintNumberDesc", numberDesc);
  setText("consolePyPrintTextVarDesc", textVarDesc);
  setText("consolePyFStringDesc", pyFStringDesc);
  setText("consoleLuaPrintTextDesc", textDesc);
  setText("consoleLuaPrintNumberDesc", numberDesc);
  setText("consoleLuaPrintTextVarDesc", textVarDesc);
  setText("consoleLuaFormatDesc", luaFormatDesc);
  setText("consolePhpEchoTextDesc", textDesc);
  setText("consolePhpEchoNumberDesc", numberDesc);
  setText("consolePhpEchoTextVarDesc", textVarDesc);

  setText(
    "dataTypesHeader",
    t?.DataTypesHeader || (lang === "ru" ? "Типы данных:" : "Data types:"),
  );
  setText(
    "dataTypesDescription",
    t?.DataTypesDescription ||
      (lang === "ru"
        ? "Текст (строка) нужно оборачивать в кавычки, а числа — нет."
        : "Text (a string) requires quotes, but numbers do not."),
  );
  setText(
    "dataTypesExamplesHeader",
    t?.DataTypesExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText(
    "dataTypesKindsNote",
    t?.DataTypesKindsNote ||
      (lang === "ru"
        ? "В разных языках названия могут немного отличаться, но идея одинаковая."
        : "Names can vary a bit between languages, but the idea is the same."),
  );
  setText(
    "dataTypesBasicsHeader",
    t?.DataTypesBasicsHeader ||
      (lang === "ru" ? "Основные типы:" : "Core types:"),
  );
  setText("dataTypesStringLine", t?.DataTypesStringLine);
  setText("dataTypesNumberLine", t?.DataTypesNumberLine);
  setText("dataTypesFloatLine", t?.DataTypesFloatLine);
  setText("dataTypesBoolLine", t?.DataTypesBoolLine);
  setText("dataTypesExampleStringCode", t?.DataTypesExampleStringCode);
  setText("dataTypesExampleStringDesc", t?.DataTypesExampleStringDesc);
  setText("dataTypesExampleNumberCode", t?.DataTypesExampleNumberCode);
  setText("dataTypesExampleNumberDesc", t?.DataTypesExampleNumberDesc);
  setText("dataTypesExampleFloatCode", t?.DataTypesExampleFloatCode);
  setText("dataTypesExampleFloatDesc", t?.DataTypesExampleFloatDesc);
  setText("dataTypesExampleBooleanCode", t?.DataTypesExampleBooleanCode);
  setText("dataTypesExampleBooleanDesc", t?.DataTypesExampleBooleanDesc);
  setText("dataTypesExampleNullCode", t?.DataTypesExampleNullCode);
  setText("dataTypesExampleNullDesc", t?.DataTypesExampleNullDesc);
  setText("dataTypesExampleUndefinedCode", t?.DataTypesExampleUndefinedCode);
  setText("dataTypesExampleUndefinedDesc", t?.DataTypesExampleUndefinedDesc);
  setText("dataTypesExampleArrayCode", t?.DataTypesExampleArrayCode);
  setText("dataTypesExampleArrayDesc", t?.DataTypesExampleArrayDesc);
  setText("dataTypesExampleObjectCode", t?.DataTypesExampleObjectCode);
  setText("dataTypesExampleObjectDesc", t?.DataTypesExampleObjectDesc);
  setText(
    "dataTypesConsoleExamplesHeader",
    t?.DataTypesConsoleExamplesHeader ||
      (lang === "ru" ? "Примеры вывода:" : "Output examples:"),
  );
  setText("dataTypesConsoleTextCode", t?.DataTypesConsoleTextCode);
  setText("dataTypesConsoleNumberCode", t?.DataTypesConsoleNumberCode);
  setText("dataTypesConsoleErrorCode", t?.DataTypesConsoleErrorCode);
  setText("dataTypesConsoleTextDesc", t?.DataTypesConsoleOkDesc);
  setText("dataTypesConsoleNumberDesc", t?.DataTypesConsoleOkDesc);
  setText("dataTypesConsoleErrorDesc", t?.DataTypesConsoleErrorDesc);

  setText(
    "variableInfoHeader",
    t?.VariableInfoHeader ||
      (lang === "ru" ? "Что такое переменная?" : "What is a variable?"),
  );
  setText(
    "variableInfoText",
    t?.VariableInfoText ||
      (lang === "ru"
        ? "Переменная — это “коробка” с именем, в которой можно хранить значение (например, число). Это удобно, когда одно и то же значение нужно использовать много раз или менять в одном месте — тогда не надо искать и править число везде."
        : "A variable is like a named “box” that stores a value (for example, a number). It’s useful when you want to reuse the same value or change it in one place instead of editing it everywhere."),
  );
  setText(
    "variableInfoExamplesHeader",
    t?.VariableInfoExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("jsVarKindsHeader", t?.JsVarKindsHeader);
  setText("jsVarKindsIntro", t?.JsVarKindsIntro);
  setText("jsVarVarCode", t?.JsVarVarCode);
  setText("jsVarVarDesc", t?.JsVarVarDesc);
  setText("jsVarLetCode", t?.JsVarLetCode);
  setText("jsVarLetDesc", t?.JsVarLetDesc);
  setText("jsVarConstCode", t?.JsVarConstCode);
  setText("jsVarConstDesc", t?.JsVarConstDesc);
  setText("jsVarKindsNote", t?.JsVarKindsNote);
  setText("jsScopeHeader", t?.JsScopeHeader);
  setText("jsScopeIntro", t?.JsScopeIntro);
  setText("jsScopeFunctionLine", t?.JsScopeFunctionLine);
  setText("jsScopeBlockLine", t?.JsScopeBlockLine);
  setText("jsScopeExamplesHeader", t?.JsScopeExamplesHeader);
  setText("jsScopeVarTitle", t?.JsScopeVarTitle);
  setText("jsScopeVarExample", t?.JsScopeVarExample);
  setText("jsScopeVarExplain", t?.JsScopeVarExplain);
  setText("jsScopeLetTitle", t?.JsScopeLetTitle);
  setText("jsScopeLetExample", t?.JsScopeLetExample);
  setText("jsScopeLetExplain", t?.JsScopeLetExplain);
  setText("jsScopeTip", t?.JsScopeTip);

  setText(
    "concatInfoHeader",
    t?.ConcatInfoHeader ||
      (lang === "ru" ? "Конкатенация строк" : "String concatenation"),
  );
  setText(
    "concatInfoIntro",
    t?.ConcatInfoIntro ||
      (lang === "ru"
        ? "Конкатенация — это соединение строк в одну строку."
        : "Concatenation means joining strings into one string."),
  );
  setText(
    "concatInfoIdea",
    t?.ConcatInfoIdea ||
      (lang === "ru"
        ? "Идея простая: берём кусочки текста и “склеиваем” их вместе."
        : "The idea is simple: take parts and join them together."),
  );
  setText(
    "concatExamplesHeader",
    t?.ConcatExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("concatJsPlusDesc", t?.ConcatJsPlusDesc);
  setText("concatJsTemplateDesc", t?.ConcatJsTemplateDesc);
  setText("concatPyPlusDesc", t?.ConcatPyPlusDesc);
  setText("concatPyFStringDesc", t?.ConcatPyFStringDesc);
  setText("concatLuaDotsDesc", t?.ConcatLuaDotsDesc);
  setText("concatLuaFormatDesc", t?.ConcatLuaFormatDesc);
  setText("concatPhpDotsDesc", t?.ConcatPhpDotsDesc);
  setText("concatPhpInterpDesc", t?.ConcatPhpInterpDesc);
  setText(
    "concatInfoNote",
    t?.ConcatInfoNote ||
      (lang === "ru"
        ? "Примечание: если “склеиваете” строку и число, иногда нужно сначала превратить число в строку."
        : "Note: when joining a string and a number, you may need to convert the number to a string first."),
  );

  setText(
    "incDecInfoHeader",
    t?.IncDecInfoHeader ||
      (lang === "ru" ? "Инкремент и декремент" : "Increment and decrement"),
  );
  setText(
    "incDecInfoIntro",
    t?.IncDecInfoIntro ||
      (lang === "ru"
        ? "Инкремент — это увеличение значения на 1, декремент — уменьшение на 1."
        : "Increment means increasing a value by 1, decrement means decreasing it by 1."),
  );
  setText(
    "incDecExamplesHeader",
    t?.IncDecExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("incDecJsIncDesc", t?.IncDecIncDesc);
  setText("incDecJsDecDesc", t?.IncDecDecDesc);
  setText("incDecPyIncDesc", t?.IncDecIncDesc);
  setText("incDecPyDecDesc", t?.IncDecDecDesc);
  setText("incDecLuaIncDesc", t?.IncDecIncDesc);
  setText("incDecLuaDecDesc", t?.IncDecDecDesc);
  setText("incDecPhpIncDesc", t?.IncDecPhpIncDesc);
  setText("incDecPhpDecDesc", t?.IncDecPhpDecDesc);
  setText(
    "incDecInfoNote",
    t?.IncDecInfoNote ||
      (lang === "ru"
        ? "В Blockly это обычно делается так: берём текущее значение переменной, прибавляем 1 и снова присваиваем в ту же переменную."
        : "In Blockly you usually do it like this: take the current value, add 1, and assign it back to the same variable."),
  );

  setText(
    "conditionInfoHeader",
    t?.ConditionInfoHeader ||
      (lang === "ru"
        ? "Условные конструкции (if/else)"
        : "Conditional statements (if/else)"),
  );
  setText(
    "conditionInfoIntro",
    t?.ConditionInfoIntro ||
      (lang === "ru"
        ? "Условный оператор if/else позволяет программе принимать решения. Сначала вычисляется логическое выражение (условие), затем в зависимости от результата выполняется одна ветка кода (if) или другая (else). Так можно реагировать на разные ситуации — например, выводить сообщение только при выполнении нужного условия."
        : "The if/else statement lets a program make decisions. First a boolean expression (condition) is evaluated; depending on the result, either the if-branch or the else-branch runs. This lets you react to different situations — for example, only print a message when some requirement is met."),
  );
  setText(
    "conditionInfoExamplesHeader",
    t?.ConditionInfoExamplesHeader ||
      (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("conditionJsIfDesc", t?.ConditionJsIfDesc);
  setText("conditionJsIfElseDesc", t?.ConditionJsIfElseDesc);
  setText("conditionPyIfDesc", t?.ConditionPyIfDesc);
  setText("conditionPyIfElseDesc", t?.ConditionPyIfElseDesc);
  setText("conditionLuaIfDesc", t?.ConditionLuaIfDesc);
  setText("conditionLuaIfElseDesc", t?.ConditionLuaIfElseDesc);
  setText("conditionPhpIfDesc", t?.ConditionPhpIfDesc);
  setText("conditionPhpIfElseDesc", t?.ConditionPhpIfElseDesc);
  setText(
    "conditionInfoOpsHeader",
    t?.ConditionInfoOpsHeader ||
      (lang === "ru" ? "Операторы сравнения" : "Comparison operators"),
  );
  setText(
    "conditionInfoOpsIntro",
    t?.ConditionInfoOpsText ||
      (lang === "ru"
        ? "Операторы сравнения возвращают логическое значение: true (истина) или false (ложь)."
        : "Comparison operators return a boolean value: true or false."),
  );
  setText(
    "condOpGtDesc",
    t?.CondOpGtDesc || (lang === "ru" ? "больше" : "greater than"),
  );
  setText(
    "condOpLtDesc",
    t?.CondOpLtDesc || (lang === "ru" ? "меньше" : "less than"),
  );
  setText(
    "condOpGteDesc",
    t?.CondOpGteDesc ||
      (lang === "ru" ? "больше или равно" : "greater or equal"),
  );
  setText(
    "condOpLteDesc",
    t?.CondOpLteDesc || (lang === "ru" ? "меньше или равно" : "less or equal"),
  );
  setText(
    "condOpEqDesc",
    t?.CondOpEqDesc ||
      (lang === "ru" ? "сравнение: равно" : "comparison: equal"),
  );
  setText(
    "condOpNeqDesc",
    t?.CondOpNeqDesc ||
      (lang === "ru" ? "сравнение: не равно" : "comparison: not equal"),
  );
  setText(
    "condOpNeqLuaDesc",
    t?.CondOpNeqLuaDesc ||
      (lang === "ru" ? "не равно (в Lua)" : "not equal (in Lua: ~=)"),
  );
  setText(
    "condOpEqNote",
    t?.CondOpEqNote ||
      (lang === "ru"
        ? "Важно: == — это сравнение, а = — присваивание (например, x = 5). А != означает “не равно” (в Lua — ~=)."
        : "Important: == means comparison, while = means assignment (e.g., x = 5). And != means “not equal” (in Lua it is ~=)."),
  );
  setText(
    "conditionInfoNote",
    t?.ConditionInfoNote ||
      (lang === "ru"
        ? "Если нужно “ничего не делать” — просто оставьте ветку else пустой или не добавляйте её."
        : "If you need to “do nothing”, leave the else branch empty or omit it."),
  );
}
