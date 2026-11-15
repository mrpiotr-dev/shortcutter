import { describe, expect, it } from 'vite-plus/test';
import { combination, keyFromCode, parseShortcut } from '../src/keys';

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
