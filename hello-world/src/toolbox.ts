/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Удалён импорт локализации, так как локали теперь применяются в index.ts

/*
This toolbox contains nearly every single built-in block that Blockly offers,
in addition to the custom block 'add_text' this sample app adds.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

/**
 * Get localized toolbox configuration
 */
export function getLocalizedToolbox() {
  return {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: 'Logic',
        categorystyle: 'logic_category',
        contents: [
          {
            kind: 'block',
            type: 'controls_if',
          },
          {
            kind: 'block',
            type: 'logic_compare',
          },
          {
            kind: 'block',
            type: 'logic_operation',
          },
          {
            kind: 'block',
            type: 'logic_negate',
          },
          {
            kind: 'block',
            type: 'logic_boolean',
          },
          {
            kind: 'block',
            type: 'logic_null',
          },
          {
            kind: 'block',
            type: 'logic_ternary',
          },
        ],
      },
      {
        kind: 'category',
        name: 'Loops',
        categorystyle: 'loop_category',
        contents: [
          {
            kind: 'block',
            type: 'controls_repeat_ext',
            inputs: {
              TIMES: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 10,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'controls_repeat',
          },
          {
            kind: 'block',
            type: 'controls_whileUntil',
          },
          {
            kind: 'block',
            type: 'controls_for',
            inputs: {
              FROM: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 10,
                  },
                },
              },
              BY: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'controls_forEach',
          },
          {
            kind: 'block',
            type: 'controls_flow_statements',
          },
        ],
      },
      {
        kind: 'category',
        name: 'Math',
        categorystyle: 'math_category',
        contents: [
          {
            kind: 'block',
            type: 'math_number',
            fields: {
              NUM: 123,
            },
          },
          {
            kind: 'block',
            type: 'math_arithmetic',
          },
          {
            kind: 'block',
            type: 'math_single',
          },
          {
            kind: 'block',
            type: 'math_trig',
          },
          {
            kind: 'block',
            type: 'math_constant',
          },
          {
            kind: 'block',
            type: 'math_number_property',
          },
          {
            kind: 'block',
            type: 'math_change',
            inputs: {
              DELTA: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'math_round',
          },
          {
            kind: 'block',
            type: 'math_on_list',
          },
          {
            kind: 'block',
            type: 'math_modulo',
          },
          {
            kind: 'block',
            type: 'math_constrain',
            inputs: {
              LOW: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 1,
                  },
                },
              },
              HIGH: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 100,
                  },
                },
              },
              VALUE: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 50,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'math_random_int',
            inputs: {
              FROM: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 100,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'math_random_float',
          },
        ],
      },
      {
        kind: 'category',
        name: 'Text',
        categorystyle: 'text_category',
        contents: [
          {
            kind: 'block',
            type: 'text',
          },
          {
            kind: 'block',
            type: 'text_join',
          },
          {
            kind: 'block',
            type: 'text_append',
          },
          {
            kind: 'block',
            type: 'text_length',
          },
          {
            kind: 'block',
            type: 'text_isEmpty',
          },
          {
            kind: 'block',
            type: 'text_indexOf',
          },
          {
            kind: 'block',
            type: 'text_charAt',
          },
          {
            kind: 'block',
            type: 'text_getSubstring',
          },
          {
            kind: 'block',
            type: 'text_changeCase',
          },
          {
            kind: 'block',
            type: 'text_trim',
          },
          {
            kind: 'block',
            type: 'text_count',
          },
          {
            kind: 'block',
            type: 'text_replace',
            inputs: {
              FROM: {
                shadow: {
                  type: 'text',
                },
              },
              TO: {
                shadow: {
                  type: 'text',
                },
              },
              TEXT: {
                shadow: {
                  type: 'text',
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'text_reverse',
            inputs: {
              TEXT: {
                shadow: {
                  type: 'text',
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'add_text',
            inputs: {
              TEXT: {
                shadow: {
                  type: 'text',
                  fields: {
                    TEXT: 'abc',
                  },
                },
              },
            },
          },
        ],
      },
      {
        kind: 'category',
        name: 'Lists',
        categorystyle: 'list_category',
        contents: [
          {
            kind: 'block',
            type: 'lists_create_with',
          },
          {
            kind: 'block',
            type: 'lists_create_with',
          },
          {
            kind: 'block',
            type: 'lists_repeat',
            inputs: {
              NUM: {
                shadow: {
                  type: 'math_number',
                  fields: {
                    NUM: 5,
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'lists_length',
          },
          {
            kind: 'block',
            type: 'lists_isEmpty',
          },
          {
            kind: 'block',
            type: 'lists_indexOf',
          },
          {
            kind: 'block',
            type: 'lists_getIndex',
          },
          {
            kind: 'block',
            type: 'lists_setIndex',
          },
          {
            kind: 'block',
            type: 'lists_getSublist',
          },
          {
            kind: 'block',
            type: 'lists_split',
            inputs: {
              DELIM: {
                shadow: {
                  type: 'text',
                  fields: {
                    TEXT: ',',
                  },
                },
              },
            },
          },
          {
            kind: 'block',
            type: 'lists_sort',
          },
          {
            kind: 'block',
            type: 'lists_reverse',
          },
        ],
      },
      {
        kind: 'sep',
      },
      {
        kind: 'category',
        name: 'Variables',
        categorystyle: 'variable_category',
        custom: 'VARIABLE',
      },
      {
        kind: 'category',
        name: 'Functions',
        categorystyle: 'procedure_category',
        custom: 'PROCEDURE',
      },
    ],
  };
}

// Backward compatibility
export const toolbox = getLocalizedToolbox();
