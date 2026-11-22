import { describe, expect, it } from 'vite-plus/test';
import {
  combination,
  keyFromCode,
  parseShortcut,
  parseShortcutKeys,
  wildcardMatcher,
} from '../src/keys';

describe('keyFromCode', () => {
  it.each([
    ['KeyA', 'a'],
    ['Digit1', '1'],
    ['ShiftLeft', 'shift'],
    ['ShiftRight', 'shift'],
    ['ControlLeft', 'control'],
    ['AltRight', 'alt'],
    ['MetaLeft', 'meta'],
    ['OSLeft', 'meta'],
    ['ArrowUp', 'arrowup'],
    ['Escape', 'escape'],
    ['Numpad1', 'numpad1'],
    ['F12', 'f12'],
    ['Space', 'space'],
  ])('%s → %s', (code, key) => {
    expect(keyFromCode(code)).toBe(key);
  });
});

describe('parseShortcut', () => {
  it('treats Object.prototype names as plain keys', () => {
    expect(parseShortcut('constructor', false)).toBe('constructor');
    expect(parseShortcut('Control+__proto__', false)).toBe('__proto__+control');
  });

  it('is case- and order-insensitive', () => {
    expect(parseShortcut('Control+Shift+K', false)).toBe('control+k+shift');
    expect(parseShortcut('k+SHIFT+control', false)).toBe('control+k+shift');
  });

  it('resolves ControlOrMeta per platform', () => {
    expect(parseShortcut('ControlOrMeta+K', false)).toBe('control+k');
    expect(parseShortcut('ControlOrMeta+K', true)).toBe('k+meta');
  });

  it.each([
    ['Ctrl+Esc', 'control+escape'],
    ['Cmd+Return', 'enter+meta'],
    ['Command+Del', 'delete+meta'],
    ['Option+Up', 'alt+arrowup'],
    ['ShiftLeft+KeyA', 'a+shift'],
    ['Digit1', '1'],
    [' Shift + 1 ', '1+shift'],
  ])('accepts aliases and event.code names: %s', (shortcut, expected) => {
    expect(parseShortcut(shortcut, false)).toBe(expected);
  });

  it('dedupes keys', () => {
    expect(parseShortcut('Shift+ShiftLeft+A', false)).toBe('a+shift');
  });

  it.each(['', '  ', 'Control+', 'Control++K'])('rejects %j', (shortcut) => {
    expect(() => parseShortcut(shortcut, false)).toThrow();
  });
});

describe('combination', () => {
  it('sorts and dedupes', () => {
    expect(combination(['s', 'a', 's'])).toBe('a+s');
    expect(combination([])).toBe('');
  });
});

describe('parseShortcutKeys', () => {
  it('orders modifiers first and keeps the written order of other keys', () => {
    expect(parseShortcutKeys('K+Shift+ControlOrMeta+J', true)).toEqual(['meta', 'shift', 'k', 'j']);
    expect(parseShortcutKeys('Alt+Control+Escape', false)).toEqual(['control', 'alt', 'escape']);
  });

  it('keeps wildcards as written (lowercased)', () => {
    expect(parseShortcutKeys('Shift+Arrow*', false)).toEqual(['shift', 'arrow*']);
  });
});

describe('wildcardMatcher', () => {
  it('escapes regular-expression characters in globs', () => {
    const matches = wildcardMatcher(['bracket(*']);

    expect(matches(['bracket(left'])).toBe(true);
    expect(matches(['bracketleft'])).toBe(false);
  });

  it('can match several wildcards to different keys', () => {
    const matches = wildcardMatcher(['digit*', 'key*']);

    expect(matches(['1', 'a'])).toBe(true);
    expect(matches(['1', '2'])).toBe(false);
  });
});
