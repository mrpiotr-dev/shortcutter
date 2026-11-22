/**
 * Optional key labels for help screens and menus: `⌘K` on macOS, `Ctrl+K` elsewhere. Apps that do
 * not import this entry do not ship it.
 *
 * @packageDocumentation
 * @module shortcutter/format
 */
import { detectMac, isModifier, own, parseShortcutKeys } from './keys';
import type { ShortcutString } from './shortcut-types';

export type FormatOptions = {
  /** Format for macOS (`⌘K`) or for other platforms (`Ctrl+K`). Detected from `navigator` by default. */
  mac?: boolean;
  /**
   * Labels by canonical key name, used before the built-in ones: `{ meta: 'Win' }`,
   * `{ space: 'Leertaste' }`, `{ 'digit*': '1–9' }`.
   */
  labels?: Record<string, string>;
  /** Placed between keys by `formatShortcut()`. Defaults to `''` on macOS and `'+'` elsewhere. */
  separator?: string;
};

/** Modifier order in Apple menus: ⌃⌥⇧⌘. */
const MAC_MODIFIERS = ['control', 'alt', 'shift', 'meta'];
/** Modifier order on Windows and Linux: Ctrl+Meta+Alt+Shift. */
const OTHER_MODIFIERS = ['control', 'meta', 'alt', 'shift'];

const MAC_LABELS: Record<string, string> = {
  control: '⌃',
  alt: '⌥',
  shift: '⇧',
  meta: '⌘',
  enter: '↩',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  capslock: '⇪',
};

const OTHER_LABELS: Record<string, string> = {
  control: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
  enter: 'Enter',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
  capslock: 'Caps Lock',
};

const LABELS: Record<string, string> = {
  escape: 'Esc',
  space: 'Space',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  pageup: 'Page Up',
  pagedown: 'Page Down',
  contextmenu: 'Menu',
  printscreen: 'Print Screen',
  scrolllock: 'Scroll Lock',
  numlock: 'Num Lock',
  backquote: '`',
  backslash: '\\',
  intlbackslash: '\\',
  bracketleft: '[',
  bracketright: ']',
  comma: ',',
  equal: '=',
  minus: '-',
  period: '.',
  quote: "'",
  semicolon: ';',
  slash: '/',
  numpadadd: 'Num +',
  numpadsubtract: 'Num -',
  numpadmultiply: 'Num *',
  numpaddivide: 'Num /',
  numpaddecimal: 'Num .',
  numpadenter: 'Num Enter',
  numpadequal: 'Num =',
  'digit*': '0–9',
  'key*': 'A–Z',
  'arrow*': '←↑→↓',
  'f*': 'F1–F24',
  '*': 'Any key',
};

function label(key: string, mac: boolean, labels: Record<string, string> | undefined): string {
  const custom =
    (labels && own(labels, key)) ?? own(mac ? MAC_LABELS : OTHER_LABELS, key) ?? own(LABELS, key);

  if (custom !== undefined) return custom;
  if (key.length === 1 || /^f\d+$/.test(key)) return key.toUpperCase();
  if (/^numpad\d$/.test(key)) return `Num ${key.slice(6)}`;

  // Anything else as a capitalised name: 'home' → 'Home', a wildcard such as 'numpad*' → 'Numpad…'.
  return (key[0]!.toUpperCase() + key.slice(1)).replace(/\*/g, '…');
}

/**
 * One display label per key of a shortcut, modifiers first in the platform's order, e.g. for
 * rendering each key in a `<kbd>`: `['⌘', 'K']` on macOS, `['Ctrl', 'K']` elsewhere.
 *
 * Takes a shortcut string (`'ControlOrMeta+Shift+K'`) or a list of keys: the `keys` of a
 * `shortcuts()` entry, or `pressed()`. An empty list gives an empty list.
 *
 * @example
 * formatKeys('ControlOrMeta+Shift+K'); // ['⌘', '⇧', 'K'] on macOS, ['Ctrl', 'Shift', 'K'] elsewhere
 */
export function formatKeys<S extends string>(
  shortcut: ShortcutString<S> | readonly string[],
  options: FormatOptions = {},
): string[] {
  // No keys, e.g. pressed() while nothing is held: nothing to label. An empty string still throws.
  if (typeof shortcut !== 'string' && shortcut.length === 0) return [];

  const mac = options.mac ?? detectMac();
  const text: string = typeof shortcut === 'string' ? shortcut : shortcut.join('+');
  const keys = parseShortcutKeys(text, mac);
  const order = mac ? MAC_MODIFIERS : OTHER_MODIFIERS;

  return [
    ...order.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !isModifier(key)),
  ].map((key) => label(key, mac, options.labels));
}

/**
 * A shortcut as people read it: `⌘K` or `⌃⇧Tab` on macOS, `Ctrl+K` or `Ctrl+Shift+Tab` elsewhere.
 * Takes a shortcut string or the `keys` of a `shortcuts()` entry.
 *
 * @example
 * formatShortcut('ControlOrMeta+K'); // '⌘K' on macOS, 'Ctrl+K' elsewhere
 * formatShortcut('Shift+Arrow*', { mac: false }); // 'Shift+←↑→↓'
 */
export function formatShortcut<S extends string>(
  shortcut: ShortcutString<S> | readonly string[],
  options: FormatOptions = {},
): string {
  const mac = options.mac ?? detectMac();

  return formatKeys(shortcut, { ...options, mac }).join(options.separator ?? (mac ? '' : '+'));
}
