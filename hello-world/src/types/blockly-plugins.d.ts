declare module '@blockly/block-dynamic-connection' {
  export function decoratePreviewer(previewer?: any): any;
  export function overrideOldBlockDefinitions(Blockly?: any): void;
  export function finalizeConnections(e: any): void;
}

declare module '@blockly/field-grid-dropdown';