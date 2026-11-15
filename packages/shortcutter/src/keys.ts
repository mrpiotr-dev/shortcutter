/** Modifiers are matched regardless of side: ShiftLeft and ShiftRight are both `shift`. */
export const MODIFIERS = ['alt', 'control', 'meta', 'shift'] as const;

export type Modifier = (typeof MODIFIERS)[number];

const MODIFIER_FLAGS: Record<Modifier, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'> = {
  alt: 'altKey',
  control: 'ctrlKey',
  meta: 'metaKey',
  shift: 'shiftKey',
};

/** Friendly names accepted in shortcut strings, mapped to canonical key names. */
const ALIASES: Record<string, string> = {
  ctrl: 'control',
  option: 'alt',
  cmd: 'meta',
  command: 'meta',
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};

const CONTROL_OR_META = 'controlormeta';

/**
 * Turns a `KeyboardEvent.code` into the canonical key name used for matching:
 * `KeyA` → `a`, `Digit1` → `1`, `ShiftRight` → `shift`, `ArrowUp` → `arrowup`.
 */
export function keyFromCode(code: string): string {
  const key = code.toLowerCase();

  if (/^key[a-z]$/.test(key)) return key.slice(3);
  if (/^digit[0-9]$/.test(key)) return key.slice(5);
  if (key === 'osleft' || key === 'osright') return 'meta';

  const side = /^(alt|control|meta|shift)(left|right)$/.exec(key);

  return side ? side[1]! : key;
}

export function isModifier(key: string): key is Modifier {
  return (MODIFIERS as readonly string[]).includes(key);
}

/** Whether the event still reports `modifier` as held (catches keyups the OS swallowed). */
export function isModifierHeld(event: KeyboardEvent, modifier: Modifier): boolean {
  return event[MODIFIER_FLAGS[modifier]];
}

/**
 * Normalizes a shortcut like `'ControlOrMeta+Shift+K'` to a canonical, order-independent
 * string (`'control+k+shift'` or `'k+meta+shift'` on macOS). Case-insensitive.
 */
export function parseShortcut(shortcut: string, isMac: boolean): string {
  if (typeof shortcut !== 'string' || shortcut.trim() === '') {
    throw new Error('Shortcut has to be a non-empty string, e.g. "ControlOrMeta+K".');
  }

  const keys = shortcut.split('+').map((part) => {
    const name = part.trim().toLowerCase();

    if (name === '') {
      throw new Error(`Shortcut "${shortcut}" has an empty key. Use "Equal" for the + key.`);
    }
    if (name === CONTROL_OR_META) return isMac ? 'meta' : 'control';

    return keyFromCode(ALIASES[name] ?? name);
  });

  return combination(keys);
}

/** Canonical form of a set of keys: unique and sorted, joined with `+`. */
export function combination(keys: Iterable<string>): string {
  return [...new Set(keys)].sort().join('+');
}

export function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? '';

  return /mac|iphone|ipad|ipod/i.test(platform);
}
