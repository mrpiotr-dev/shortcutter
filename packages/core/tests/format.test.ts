import { afterEach, describe, expect, it } from 'vite-plus/test';
import { formatKeys, formatShortcut, getLayoutLabels } from '../src/format';
import { createShortcutter } from '../src/index';

const mac = { mac: true };
const other = { mac: false };

describe('formatShortcut', () => {
  it('labels Object.prototype names as plain keys', () => {
    expect(formatShortcut('Control+constructor' as string, other)).toBe('Ctrl+Constructor');
    expect(formatShortcut('__proto__' as string, { ...other, labels: {} })).toBe('__proto__');
  });

  it('uses symbols without a separator on macOS', () => {
    expect(formatShortcut('ControlOrMeta+K', mac)).toBe('⌘K');
    expect(formatShortcut('Shift+Alt+Control+Meta+K', mac)).toBe('⌃⌥⇧⌘K');
    expect(formatShortcut('Meta+Enter', mac)).toBe('⌘↩');
    expect(formatShortcut('Shift+Backspace', mac)).toBe('⇧⌫');
  });

  it('uses names joined with + elsewhere', () => {
    expect(formatShortcut('ControlOrMeta+K', other)).toBe('Ctrl+K');
    expect(formatShortcut('k+shift+ctrl', other)).toBe('Ctrl+Shift+K');
    expect(formatShortcut('Meta+Alt+Delete', other)).toBe('Meta+Alt+Delete');
    expect(formatShortcut('Escape', other)).toBe('Esc');
  });

  it('labels named keys, punctuation, numpad and function keys', () => {
    expect(formatKeys('ArrowUp+ArrowDown+ArrowLeft+ArrowRight', other)).toEqual([
      '↑',
      '↓',
      '←',
      '→',
    ]);
    expect(formatKeys('Slash+Comma+BracketLeft+Backquote', other)).toEqual(['/', ',', '[', '`']);
    expect(formatKeys('Numpad7+NumpadAdd+F12+Digit1+Space', other)).toEqual([
      'Num 7',
      'Num +',
      'F12',
      '1',
      'Space',
    ]);
    expect(formatKeys('PageDown+Home', other)).toEqual(['Page Down', 'Home']);
  });

  it('labels wildcards', () => {
    expect(formatShortcut('Shift+Arrow*', other)).toBe('Shift+←↑→↓');
    expect(formatKeys('Digit*+Key*+F*', other)).toEqual(['0–9', 'A–Z', 'F1–F24']);
    expect(formatShortcut('Control+*', mac)).toBe('⌃Any key');
    expect(formatShortcut('Numpad*', other)).toBe('Numpad…');
  });

  it('takes the keys listed by shortcuts()', () => {
    const sc = createShortcutter({ target: new EventTarget(), mac: true });

    sc.listen('Shift+ControlOrMeta+P', () => {});
    const [info] = sc.shortcuts();

    expect(formatShortcut(info!.keys, mac)).toBe('⇧⌘P');
    expect(formatKeys(['control', 'k'], other)).toEqual(['Ctrl', 'K']);
  });

  it('accepts custom labels and separators', () => {
    expect(formatShortcut('Meta+Space', { mac: false, labels: { meta: 'Win' } })).toBe('Win+Space');
    expect(formatShortcut('Control+Shift+K', { mac: false, separator: ' + ' })).toBe(
      'Ctrl + Shift + K',
    );
    expect(formatShortcut('ControlOrMeta+K', { mac: true, separator: ' ' })).toBe('⌘ K');
  });

  it('formats an empty key list, e.g. pressed() with nothing held, as nothing', () => {
    expect(formatKeys([], mac)).toEqual([]);
    expect(formatShortcut([], other)).toBe('');
  });

  it('throws on an invalid shortcut, like listen()', () => {
    // @ts-expect-error -- runtime guard for JS users
    expect(() => formatShortcut('', other)).toThrow();
  });
});

describe('getLayoutLabels', () => {
  const stub = (keyboard: unknown) =>
    Object.defineProperty(navigator, 'keyboard', { value: keyboard, configurable: true });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'keyboard');
  });

  it('labels physical keys with what the layout prints (QWERTZ)', async () => {
    stub({
      getLayoutMap: async () =>
        new Map([
          ['KeyY', 'z'],
          ['KeyZ', 'y'],
          ['Minus', 'ß'],
          ['Digit1', '1'],
          ['ShiftLeft', ''],
        ]),
    });

    const labels = await getLayoutLabels();

    expect(labels).toEqual({ y: 'Z', z: 'Y', minus: 'ß' });
    expect(formatShortcut('Control+Y', { ...other, labels })).toBe('Ctrl+Z');
  });

  it('keeps digit labels, which print symbols on AZERTY', async () => {
    stub({ getLayoutMap: async () => new Map([['Digit1', '&']]) });

    expect(await getLayoutLabels()).toEqual({});
  });

  it('resolves to no labels without the Keyboard API or when it is refused', async () => {
    expect(await getLayoutLabels()).toEqual({});

    stub({
      getLayoutMap: async () => {
        throw new DOMException('Not allowed', 'SecurityError');
      },
    });
    expect(await getLayoutLabels()).toEqual({});
  });
});
