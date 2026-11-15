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
 * Canonical key names of a shortcut in a readable order: modifiers first (Control, Meta, Alt,
 * Shift), then the other keys as written. `'k+ControlOrMeta'` → `['meta', 'k']` on macOS.
 * Wildcard keys such as `arrow*` are kept as patterns. Case-insensitive.
 */
export function parseShortcutKeys(shortcut: string, isMac: boolean): string[] {
  if (typeof shortcut !== 'string' || shortcut.trim() === '') {
    throw new Error('Shortcut has to be a non-empty string, e.g. "ControlOrMeta+K".');
  }

  const keys = shortcut.split('+').map((part) => {
    const name = part.trim().toLowerCase();

    if (name === '') {
      throw new Error(`Shortcut "${shortcut}" has an empty key. Use "Equal" for the + key.`);
    }
    if (name === CONTROL_OR_META) return isMac ? 'meta' : 'control';
    if (name.includes('*')) return name;

    return keyFromCode(ALIASES[name] ?? name);
  });
  const unique = [...new Set(keys)];

  return [
    ...DISPLAY_MODIFIERS.filter((key) => unique.includes(key)),
    ...unique.filter((key) => !isModifier(key)),
  ];
}

const DISPLAY_MODIFIERS: readonly Modifier[] = ['control', 'meta', 'alt', 'shift'];

/**
 * Normalizes a shortcut like `'ControlOrMeta+Shift+K'` to a canonical, order-independent
 * string (`'control+k+shift'` or `'k+meta+shift'` on macOS). Case-insensitive.
 */
export function parseShortcut(shortcut: string, isMac: boolean): string {
  return combination(parseShortcutKeys(shortcut, isMac));
}

export function isWildcard(key: string): boolean {
  return key.includes('*');
}

/** Wildcard groups that do not follow from plain globbing over canonical names. */
const WILDCARD_GROUPS: Record<string, RegExp> = {
  'key*': /^[a-z]$/, // letters are canonicalised from KeyA to a
  'digit*': /^[0-9]$/, // digits from Digit1 to 1
  'f*': /^f([1-9]|1[0-9]|2[0-4])$/, // function keys, not the letter F
};

function wildcardToRegExp(key: string): RegExp {
  const group = WILDCARD_GROUPS[key];

  if (group) return group;

  const source = key
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  return new RegExp(`^${source}$`);
}

/**
 * Builds a matcher for a shortcut with wildcard keys. Every wildcard matches exactly one held key
 * and never a modifier; the other keys must be held exactly, and nothing else may be held.
 */
export function wildcardMatcher(keys: readonly string[]): (pressed: readonly string[]) => boolean {
  const exact = keys.filter((key) => !isWildcard(key));
  const wildcards = keys.filter(isWildcard).map(wildcardToRegExp);

  return (pressed) => {
    if (pressed.length !== keys.length || !exact.every((key) => pressed.includes(key))) {
      return false;
    }

    const rest = pressed.filter((key) => !exact.includes(key));

    if (rest.some(isModifier)) return false;

    // Assign each remaining key to a different wildcard (tiny sets, so plain backtracking).
    const assign = (index: number, used: Set<number>): boolean =>
      index === rest.length ||
      wildcards.some(
        (wildcard, w) =>
          !used.has(w) && wildcard.test(rest[index]!) && assign(index + 1, new Set(used).add(w)),
      );

    return assign(0, new Set());
  };
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
