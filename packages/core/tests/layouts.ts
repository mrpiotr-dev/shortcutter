/**
 * What a few keyboard layouts print for each physical key (`KeyboardEvent.code`): `[plain, shifted]`.
 * Only the keys the tests use. Sources: the Windows/macOS layouts of the same names.
 */
export type Layout = Record<string, readonly [string, string]>;

const letters = 'abcdefghijklmnopqrstuvwxyz';

/** US QWERTY: every letter where its code says, digits with their shifted symbols. */
export const QWERTY: Layout = {
  ...Object.fromEntries(
    letters.split('').map((c) => [`Key${c.toUpperCase()}`, [c, c.toUpperCase()]]),
  ),
  Digit1: ['1', '!'],
  Digit2: ['2', '@'],
  Comma: [',', '<'],
  Semicolon: [';', ':'],
  Slash: ['/', '?'],
  Minus: ['-', '_'],
};

/** German QWERTZ: Y and Z swapped, ß where QWERTY has minus. */
export const QWERTZ: Layout = {
  ...QWERTY,
  KeyY: ['z', 'Z'],
  KeyZ: ['y', 'Y'],
  Minus: ['ß', '?'],
  Slash: ['-', '_'],
  Digit2: ['2', '"'],
};

/** French AZERTY: A/Q and Z/W swapped, M on the semicolon key, symbols on the digit row. */
export const AZERTY: Layout = {
  ...QWERTY,
  KeyA: ['q', 'Q'],
  KeyQ: ['a', 'A'],
  KeyZ: ['w', 'W'],
  KeyW: ['z', 'Z'],
  KeyM: [',', '?'],
  Semicolon: ['m', 'M'],
  Comma: [';', '.'],
  Digit1: ['&', '1'],
  Digit2: ['é', '2'],
};

/** Russian ЙЦУКЕН: Cyrillic on the letter keys. */
export const RUSSIAN: Layout = {
  ...QWERTY,
  KeyA: ['ф', 'Ф'],
  KeyC: ['с', 'С'],
  KeyK: ['л', 'Л'],
  KeyV: ['м', 'М'],
  KeyZ: ['я', 'Я'],
};

/** US Dvorak: letters on different positions, S on the semicolon key, Z on the slash key. */
export const DVORAK: Layout = {
  ...QWERTY,
  KeyC: ['j', 'J'],
  KeyK: ['t', 'T'],
  KeyV: ['k', 'K'],
  KeyX: ['q', 'Q'],
  KeyZ: [';', ':'],
  Semicolon: ['s', 'S'],
  Slash: ['z', 'Z'],
};
