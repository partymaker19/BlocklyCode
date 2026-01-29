/**
 * Локализованная версия плагина поиска по тулбоксу
 * Основано на @blockly/toolbox-search, но с полной поддержкой локализации
 */
import * as Blockly from "blockly/core";

/**
 * Класс для индексации и поиска блоков по тексту/типу.
 */
class BlockSearcher {
  private trigramsToBlocks = new Map<string, Set<string>>();

  /**
   * Заполняет кэш сопоставления «триграмма → набор типов блоков».
   *
   * Этот метод нужно вызвать перед blockTypesMatching(). Внутри он создаёт
   * временный workspace, инстанцирует указанные типы блоков, индексирует их
   * типы и читаемые тексты, а затем освобождает ресурсы.
   *
   * @param blockTypes Список типов блоков для индексации.
   */
  indexBlocks(blockTypes: string[]): void {
    const blockCreationWorkspace = new Blockly.Workspace();
    blockTypes.forEach((blockType) => {
      const block = blockCreationWorkspace.newBlock(blockType);
      this.indexBlockText(blockType.replace(/_/g, " "), blockType);
      block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
          this.indexDropdownOption(field, blockType);
          this.indexBlockText(field.getText(), blockType);
        });
      });
    });
    try {
      blockCreationWorkspace.dispose();
    } catch {}
  }

  /**
   * Если поле — dropdown, индексирует тексты всех опций.
   *
   * @param field Поле блока (может быть dropdown).
   * @param blockType Тип блока, с которым связываем найденные триграммы.
   */
  private indexDropdownOption(field: Blockly.Field, blockType: string): void {
    if (field instanceof Blockly.FieldDropdown) {
      // Поля переменных (FieldVariable) иногда не имеют выбранной переменной при
      // создании блока в временном воркспейсе, что приводит к ошибке при вызове
      // dropdownCreate/getOptions. Пропускаем такие поля и аккуратно обрабатываем
      // любые исключения при запросе опций.
      const isVariableField =
        (field as any) instanceof (Blockly as any).FieldVariable;
      if (isVariableField) return;
      try {
        field.getOptions(true).forEach((option) => {
          if (typeof option[0] === "string") {
            this.indexBlockText(option[0], blockType);
          } else if ("alt" in option[0]) {
            this.indexBlockText(option[0].alt, blockType);
          }
        });
      } catch (_e) {
        // Игнорируем ошибки получения опций (напр., для нестандартных полей)
      }
    }
  }

  /**
   * Возвращает список типов блоков, подходящих под строку поиска.
   *
   * @param query Текст, по которому ищем совпадения.
   * @returns Список типов блоков, подходящих под запрос.
   */
  blockTypesMatching(query: string): string[] {
    return [
      ...this.generateTrigrams(query)
        .map((trigram) => {
          return this.trigramsToBlocks.get(trigram) ?? new Set<string>();
        })
        .reduce((matches, current) => {
          return this.getIntersection(matches, current);
        })
        .values(),
    ];
  }

  /**
   * Генерирует триграммы для текста и привязывает их к типу блока.
   *
   * @param text Текст, из которого генерируем триграммы.
   * @param blockType Тип блока, с которым связываем триграммы.
   */
  private indexBlockText(text: string, blockType: string): void {
    this.generateTrigrams(text).forEach((trigram) => {
      const blockSet = this.trigramsToBlocks.get(trigram) ?? new Set<string>();
      blockSet.add(blockType);
      this.trigramsToBlocks.set(trigram, blockSet);
    });
  }

  /**
   * Генерирует список триграмм для строки.
   *
   * @param input Строка, из которой генерируем триграммы.
   * @returns Список триграмм.
   */
  private generateTrigrams(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    if (!normalizedInput) return [];
    if (normalizedInput.length <= 3) return [normalizedInput];

    const trigrams: string[] = [];
    for (let start = 0; start < normalizedInput.length - 3; start++) {
      trigrams.push(normalizedInput.substring(start, start + 3));
    }

    return trigrams;
  }

  /**
   * Возвращает пересечение двух множеств.
   *
   * @param a Первое множество.
   * @param b Второе множество.
   * @returns Пересечение множеств.
   */
  private getIntersection(a: Set<string>, b: Set<string>): Set<string> {
    return new Set([...a].filter((value) => b.has(value)));
  }
}

/**
 * Категория тулбокса с полем поиска и выводом подходящих блоков во flyout.
 * Поддерживает локализованные подписи/плейсхолдеры.
 */
export class LocalizedToolboxSearchCategory extends Blockly.ToolboxCategory {
  private static readonly START_SEARCH_SHORTCUT = "startSearch";
  static readonly SEARCH_CATEGORY_KIND = "search";
  private searchField?: HTMLInputElement;
  private blockSearcher = new BlockSearcher();

  /**
   * Создаёт экземпляр категории поиска.
   *
   * @param categoryDef Данные, необходимые для создания категории в тулбоксе.
   * @param parentToolbox Родительский тулбокс для этой категории.
   * @param opt_parent Родительская категория (если есть).
   */
  constructor(
    categoryDef: Blockly.utils.toolbox.CategoryInfo,
    parentToolbox: Blockly.IToolbox,
    opt_parent?: Blockly.ICollapsibleToolboxItem,
  ) {
    super(categoryDef, parentToolbox, opt_parent);
    this.initBlockSearcher();
    this.registerShortcut();
  }

  /**
   * Инициализирует категорию поиска и поле ввода.
   *
   * @returns <div>, который будет отображаться в тулбоксе.
   */
  protected override createDom_(): HTMLDivElement {
    const dom = super.createDom_();
    this.searchField = document.createElement("input");
    this.searchField.type = "search";
    // Используем локализованный placeholder вместо жёстко заданного 'Search'
    this.searchField.placeholder =
      (Blockly as any).Msg.SEARCH_PLACEHOLDER || "Search";
    this.workspace_.RTL
      ? (this.searchField.style.marginRight = "8px")
      : (this.searchField.style.marginLeft = "8px");
    this.searchField.addEventListener("keyup", (event) => {
      if (event.key === "Escape") {
        this.parentToolbox_.clearSelection();
        return true;
      }

      this.matchBlocks();
    });
    this.rowContents_?.replaceChildren(this.searchField);
    return dom;
  }

  /**
   * Возвращает позицию категории поиска в родительском тулбоксе.
   *
   * @returns Индекс категории в родительском тулбоксе (с 0), либо -1, если
   *    определить невозможно (например, для вложенной категории).
   */
  private getPosition(): number {
    const categories = this.workspace_.options.languageTree?.contents || [];
    for (let i = 0; i < categories.length; i++) {
      if (
        categories[i].kind ===
        LocalizedToolboxSearchCategory.SEARCH_CATEGORY_KIND
      ) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Регистрирует шорткат для открытия категории поиска.
   */
  private registerShortcut(): void {
    const shortcut = Blockly.ShortcutRegistry.registry.createSerializedKey(
      Blockly.utils.KeyCodes.B,
      [Blockly.utils.KeyCodes.CTRL],
    );
    Blockly.ShortcutRegistry.registry.register({
      name: LocalizedToolboxSearchCategory.START_SEARCH_SHORTCUT,
      callback: () => {
        const position = this.getPosition();
        if (position < 0) return false;
        this.parentToolbox_.selectItemByPosition(position);
        return true;
      },
      keyCodes: [shortcut],
    });
  }

  /**
   * Возвращает список типов блоков, присутствующих в конфигурации тулбокса.
   *
   * @param schema Описание элемента тулбокса.
   * @param allBlocks Множество типов блоков, найденных при обходе.
   */
  private getAvailableBlocks(
    schema: Blockly.utils.toolbox.ToolboxItemInfo,
    allBlocks: Set<string>,
  ): void {
    if ("contents" in schema) {
      schema.contents.forEach((contents) => {
        this.getAvailableBlocks(contents, allBlocks);
      });
    } else if (schema.kind.toLowerCase() === "block") {
      if ("type" in schema && schema.type) {
        allBlocks.add(schema.type);
      }
    }
  }

  /**
   * Строит индекс BlockSearcher по доступным блокам.
   */
  private initBlockSearcher(): void {
    const availableBlocks = new Set<string>();
    this.workspace_.options.languageTree?.contents?.forEach((item) =>
      this.getAvailableBlocks(item, availableBlocks),
    );
    this.blockSearcher.indexBlocks([...availableBlocks]);
  }

  /**
   * Обрабатывает клик по категории поиска.
   *
   * @param e Событие клика.
   */
  override onClick(e: Event): void {
    super.onClick(e);
    e.preventDefault();
    e.stopPropagation();
    this.setSelected(this.parentToolbox_.getSelectedItem() === this);
  }

  /**
   * Обрабатывает изменение состояния выбора категории.
   *
   * @param isSelected Выбрана ли сейчас эта категория.
   */
  override setSelected(isSelected: boolean): void {
    super.setSelected(isSelected);
    if (!this.searchField) return;
    if (isSelected) {
      this.searchField.focus();
      this.matchBlocks();
    } else {
      this.searchField.value = "";
      this.searchField.blur();
    }
  }

  /**
   * Фильтрует доступные блоки по текущей строке поиска.
   */
  private matchBlocks(): void {
    const query = this.searchField?.value || "";

    this.flyoutItems_ = query
      ? this.blockSearcher.blockTypesMatching(query).map((blockType) => {
          return {
            kind: "block",
            type: blockType,
          };
        })
      : [];

    if (!this.flyoutItems_.length) {
      this.flyoutItems_.push({
        kind: "label",
        text:
          query.length < 3
            ? (Blockly as any).Msg.SEARCH_TYPE_TO_SEARCH ||
              "Type to search for blocks"
            : (Blockly as any).Msg.SEARCH_NO_MATCHING ||
              "No matching blocks found",
      });
    }
    this.parentToolbox_.refreshSelection();
  }

  /**
   * Освобождает ресурсы категории.
   */
  override dispose(): void {
    super.dispose();
    Blockly.ShortcutRegistry.registry.unregister(
      LocalizedToolboxSearchCategory.START_SEARCH_SHORTCUT,
    );
  }
}

// Регистрируем локализованную версию вместо оригинального плагина
Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  LocalizedToolboxSearchCategory.SEARCH_CATEGORY_KIND,
  LocalizedToolboxSearchCategory,
);
