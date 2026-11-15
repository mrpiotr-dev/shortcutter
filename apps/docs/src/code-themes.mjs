// Bauhaus code themes built from the site palette. Each kind of token gets its own colour so an
// instance, its properties, the methods called on it and plain functions read apart:
// keywords cobalt, strings red, calls yellow/ochre, constants green, properties grey,
// variables plain ink/paper, parameters italic, punctuation and comments dimmed.

/**
 * @param {{ name: string, type: 'dark' | 'light', bg: string, fg: string, comment: string,
 *   keyword: string, string: string, call: string, constant: string, property: string,
 *   punctuation: string }} c
 */
function theme(c) {
  return {
    name: c.name,
    type: c.type,
    colors: {
      'editor.background': c.bg,
      'editor.foreground': c.fg,
    },
    tokenColors: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: c.comment, fontStyle: 'italic' },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'storage.modifier',
          'keyword.operator.new',
          'keyword.operator.expression',
          'variable.language',
          'entity.name.type',
          'support.type',
          'entity.name.tag',
          'support.class.component',
        ],
        settings: { foreground: c.keyword },
      },
      {
        scope: ['string', 'string.template', 'punctuation.definition.string'],
        settings: { foreground: c.string },
      },
      {
        scope: [
          'entity.name.function',
          'support.function',
          'meta.function-call entity.name.function',
          'variable.function',
        ],
        settings: { foreground: c.call },
      },
      {
        scope: [
          'constant',
          'constant.numeric',
          'constant.language',
          'support.constant',
          'entity.other.attribute-name',
        ],
        settings: { foreground: c.constant },
      },
      {
        scope: [
          'variable.other.property',
          'variable.other.object.property',
          'support.variable.property',
          'meta.object-literal.key',
          'meta.property.object',
          'variable.object.property',
        ],
        settings: { foreground: c.property },
      },
      {
        scope: [
          'variable',
          'variable.other.object',
          'variable.other.readwrite',
          'variable.other.constant',
        ],
        settings: { foreground: c.fg },
      },
      {
        scope: ['variable.parameter', 'meta.parameters variable'],
        settings: { foreground: c.fg, fontStyle: 'italic' },
      },
      {
        scope: [
          'punctuation',
          'meta.brace',
          'keyword.operator',
          'punctuation.accessor',
          'punctuation.separator',
        ],
        settings: { foreground: c.punctuation },
      },
    ],
  };
}

export const bauhausInk = theme({
  name: 'bauhaus-ink',
  type: 'dark',
  bg: '#1e1e1e',
  fg: '#eeeae1',
  comment: '#8f8a7f',
  keyword: '#7c9cf0',
  string: '#f07a66',
  call: '#f2be1a',
  constant: '#5cc28a',
  property: '#c2bba9',
  punctuation: '#8f8a7f',
});

export const bauhausPaper = theme({
  name: 'bauhaus-paper',
  type: 'light',
  bg: '#e3ded2',
  fg: '#141414',
  comment: '#6b665c',
  keyword: '#2551b5',
  string: '#b52a17',
  call: '#7a5c00',
  constant: '#1f6b3f',
  property: '#4f4c45',
  punctuation: '#6b665c',
});
