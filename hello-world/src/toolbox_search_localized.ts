/**
 * Localized version of the toolbox search plugin
 * Based on @blockly/toolbox-search but with full localization support
 */
import * as Blockly from 'blockly/core';

/**
 * A class that provides methods for indexing and searching blocks.
 */
class BlockSearcher {
  private blockCreationWorkspace = new Blockly.Workspace();
  private trigramsToBlocks = new Map<string, Set<string>>();

  /**
   * Populates the cached map of trigrams to the blocks they correspond to.
   *
   * This method must be called before blockTypesMatching(). Behind the
   * scenes, it creates a workspace, loads the specified block types on it,
   * indexes their types and human-readable text, and cleans up after
   * itself.
   *
   * @param blockTypes A list of block types to index.
   */
  indexBlocks(blockTypes: string[]) {
    const blockCreationWorkspace = new Blockly.Workspace();
    blockTypes.forEach((blockType) => {
      const block = blockCreationWorkspace.newBlock(blockType);
      this.indexBlockText(blockType.replace(/_/g, ' '), blockType);
      block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
          this.indexDropdownOption(field, blockType);
          this.indexBlockText(field.getText(), blockType);
        });
      });
    });
  }

  /**
   * Check if the field is a dropdown, and index every text in the option
   *
   * @param field We need to check the type of field
   * @param blockType The block type to associate the trigrams with.
   */
  private indexDropdownOption(field: Blockly.Field, blockType: string) {
    if (field instanceof Blockly.FieldDropdown) {
      // Поля переменных (FieldVariable) иногда не имеют выбранной переменной при
      // создании блока в временном воркспейсе, что приводит к ошибке при вызове
      // dropdownCreate/getOptions. Пропускаем такие поля и аккуратно обрабатываем
      // любые исключения при запросе опций.
      const isVariableField = (field as any) instanceof (Blockly as any).FieldVariable;
      if (isVariableField) return;
      try {
        field.getOptions(true).forEach((option) => {
          if (typeof option[0] === 'string') {
            this.indexBlockText(option[0], blockType);
          } else if ('alt' in option[0]) {
            this.indexBlockText(option[0].alt, blockType);
          }
        });
      } catch (_e) {
        // Игнорируем ошибки получения опций (напр., для нестандартных полей)
      }
    }
  }

  /**
   * Filters the available blocks based on the current query string.
   *
   * @param query The text to use to match blocks against.
   * @returns A list of block types matching the query.
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
   * Generates trigrams for the given text and associates them with the given
   * block type.
   *
   * @param text The text to generate trigrams of.
   * @param blockType The block type to associate the trigrams with.
   */
  private indexBlockText(text: string, blockType: string) {
    this.generateTrigrams(text).forEach((trigram) => {
      const blockSet = this.trigramsToBlocks.get(trigram) ?? new Set<string>();
      blockSet.add(blockType);
      this.trigramsToBlocks.set(trigram, blockSet);
    });
  }

  /**
   * Generates a list of trigrams for a given string.
   *
   * @param input The string to generate trigrams of.
   * @returns A list of trigrams of the given string.
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
   * Returns the intersection of two sets.
   *
   * @param a The first set.
   * @param b The second set.
   * @returns The intersection of the two sets.
   */
  private getIntersection(a: Set<string>, b: Set<string>): Set<string> {
    return new Set([...a].filter((value) => b.has(value)));
  }
}

/**
 * A toolbox category that provides a search field and displays matching blocks
 * in its flyout, with localization support.
 */
export class LocalizedToolboxSearchCategory extends Blockly.ToolboxCategory {
  private static readonly START_SEARCH_SHORTCUT = 'startSearch';
  static readonly SEARCH_CATEGORY_KIND = 'search';
  private searchField?: HTMLInputElement;
  private blockSearcher = new BlockSearcher();

  /**
   * Initializes a LocalizedToolboxSearchCategory.
   *
   * @param categoryDef The information needed to create a category in the
   *     toolbox.
   * @param parentToolbox The parent toolbox for the category.
   * @param opt_parent The parent category or null if the category does not have
   *     a parent.
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
   * Initializes the search field toolbox category.
   *
   * @returns The <div> that will be displayed in the toolbox.
   */
  protected override createDom_(): HTMLDivElement {
    const dom = super.createDom_();
    this.searchField = document.createElement('input');
    this.searchField.type = 'search';
    // Use localized placeholder instead of hardcoded 'Search'
    this.searchField.placeholder = (Blockly as any).Msg.SEARCH_PLACEHOLDER || 'Search';
    this.workspace_.RTL
      ? (this.searchField.style.marginRight = '8px')
      : (this.searchField.style.marginLeft = '8px');
    this.searchField.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.parentToolbox_.clearSelection();
        return true;
      }

      this.matchBlocks();
    });
    this.rowContents_?.replaceChildren(this.searchField);
    return dom;
  }

  /**
   * Returns the numerical position of this category in its parent toolbox.
   *
   * @returns The zero-based index of this category in its parent toolbox, or -1
   *    if it cannot be determined, e.g. if this is a nested category.
   */
  private getPosition() {
    const categories = this.workspace_.options.languageTree?.contents || [];
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].kind === LocalizedToolboxSearchCategory.SEARCH_CATEGORY_KIND) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Registers a shortcut for displaying the toolbox search category.
   */
  private registerShortcut() {
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
   * Returns a list of block types that are present in the toolbox definition.
   *
   * @param schema A toolbox item definition.
   * @param allBlocks The set of all available blocks that have been encountered
   *     so far.
   */
  private getAvailableBlocks(
    schema: Blockly.utils.toolbox.ToolboxItemInfo,
    allBlocks: Set<string>,
  ) {
    if ('contents' in schema) {
      schema.contents.forEach((contents) => {
        this.getAvailableBlocks(contents, allBlocks);
      });
    } else if (schema.kind.toLowerCase() === 'block') {
      if ('type' in schema && schema.type) {
        allBlocks.add(schema.type);
      }
    }
  }

  /**
   * Builds the BlockSearcher index based on the available blocks.
   */
  private initBlockSearcher() {
    const availableBlocks = new Set<string>();
    this.workspace_.options.languageTree?.contents?.forEach((item) =>
      this.getAvailableBlocks(item, availableBlocks),
    );
    this.blockSearcher.indexBlocks([...availableBlocks]);
  }

  /**
   * Handles a click on this toolbox category.
   *
   * @param e The click event.
   */
  override onClick(e: Event) {
    super.onClick(e);
    e.preventDefault();
    e.stopPropagation();
    this.setSelected(this.parentToolbox_.getSelectedItem() === this);
  }

  /**
   * Handles changes in the selection state of this category.
   *
   * @param isSelected Whether or not the category is now selected.
   */
  override setSelected(isSelected: boolean) {
    super.setSelected(isSelected);
    if (!this.searchField) return;
    if (isSelected) {
      this.searchField.focus();
      this.matchBlocks();
    } else {
      this.searchField.value = '';
      this.searchField.blur();
    }
  }

  /**
   * Filters the available blocks based on the current query string.
   */
  private matchBlocks() {
    const query = this.searchField?.value || '';

    this.flyoutItems_ = query
      ? this.blockSearcher.blockTypesMatching(query).map((blockType) => {
          return {
            kind: 'block',
            type: blockType,
          };
        })
      : [];

    if (!this.flyoutItems_.length) {
      this.flyoutItems_.push({
        kind: 'label',
        text:
          query.length < 3
            ? (Blockly as any).Msg.SEARCH_TYPE_TO_SEARCH || 'Type to search for blocks'
            : (Blockly as any).Msg.SEARCH_NO_MATCHING || 'No matching blocks found',
      });
    }
    this.parentToolbox_.refreshSelection();
  }

  /**
   * Disposes of this category.
   */
  override dispose() {
    super.dispose();
    Blockly.ShortcutRegistry.registry.unregister(
      LocalizedToolboxSearchCategory.START_SEARCH_SHORTCUT,
    );
  }
}

// Register our localized version instead of the original
Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  LocalizedToolboxSearchCategory.SEARCH_CATEGORY_KIND,
  LocalizedToolboxSearchCategory,
);