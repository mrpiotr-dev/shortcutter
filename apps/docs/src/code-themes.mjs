// Bauhaus code themes: ink or paper text, cobalt keywords, red strings, yellow (dark) or ochre (light)
// constants, grey comments. Everything else stays plain, so the primaries keep their meaning.

/** @param {{ name: string, type: 'dark' | 'light', bg: string, fg: string, comment: string, keyword: string, string: string, constant: string, punctuation: string }} c */
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
          'variable.language',
        ],
        settings: { foreground: c.keyword },
      },
      {
        scope: ['string', 'string.template', 'punctuation.definition.string'],
        settings: { foreground: c.string },
      },
      {
        scope: ['constant', 'constant.numeric', 'constant.language', 'support.constant'],
        settings: { foreground: c.constant },
      },
      {
        scope: [
          'entity.name.function',
          'support.function',
          'meta.function-call entity.name.function',
        ],
        settings: { fontStyle: 'bold' },
      },
      {
        scope: ['entity.name.tag', 'support.class.component'],
        settings: { foreground: c.keyword },
      },
      { scope: ['entity.other.attribute-name'], settings: { foreground: c.constant } },
      {
        scope: ['punctuation', 'meta.brace', 'keyword.operator'],
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
  constant: '#f2be1a',
  punctuation: '#aaa496',
});

export const bauhausPaper = theme({
  name: 'bauhaus-paper',
  type: 'light',
  bg: '#e3ded2',
  fg: '#141414',
  comment: '#6b665c',
  keyword: '#2551b5',
  string: '#b52a17',
  constant: '#7a5c00',
  punctuation: '#4f4c45',
});
