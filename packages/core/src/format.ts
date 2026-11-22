/**
 * Optional key labels for help screens and menus: `⌘K` on macOS, `Ctrl+K` elsewhere. Apps that do
 * not import this entry do not ship it.
 *
 * @packageDocumentation
 * @module shortcutter/format
 */
import { detectMac, isModifier, keyFromCode, own, parseShortcutKeys } from './keys';
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

type LayoutMapKeyboard = { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> };

/**
 * Labels for the user's keyboard layout, to pass as `labels` when shortcuts use physical keys
 * (`match: 'code'`, the default). On German QWERTZ the key registered as `Y` prints Z, so
 * `formatShortcut('Control+Y', { labels })` gives `Ctrl+Z`: the key the user has to press.
 *
 * Reads `navigator.keyboard.getLayoutMap()`, available in Chromium-based browsers. Elsewhere, in
 * iframes without permission and during SSR it resolves to `{}`, which keeps the default labels.
 * Digit keys keep their labels: on AZERTY they print `&`, `é`… but are still known as 1, 2…
 *
 * @example
 * const labels = await getLayoutLabels();
 * formatShortcut('Control+Y', { labels }); // 'Ctrl+Z' on QWERTZ, 'Ctrl+Y' on QWERTY
 */
export async function getLayoutLabels(): Promise<Record<string, string>> {
  const keyboard =
    typeof navigator === 'undefined'
      ? undefined
      : (navigator as Navigator & { keyboard?: LayoutMapKeyboard }).keyboard;

  if (!keyboard?.getLayoutMap) return {};

  try {
    const labels: Record<string, string> = {};

    for (const [code, printed] of await keyboard.getLayoutMap()) {
      const key = keyFromCode(code);

      if (key && !isModifier(key) && !/^digit/i.test(code) && printed.trim() !== '') {
        const upper = printed.toUpperCase();

        // 'ß'.toUpperCase() is 'SS': keep characters whose capital is not a single character.
        labels[key] = upper.length === printed.length ? upper : printed;
      }
    }

    return labels;
  } catch {
    // SecurityError in cross-origin iframes without the keyboard-map permission.
    return {};
  }
}
