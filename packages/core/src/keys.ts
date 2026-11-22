/**
 * Modifiers are matched regardless of side: ShiftLeft and ShiftRight are both `shift`. Listed in
 * the order shortcuts show them: Control, Meta, Alt, Shift.
 */
export const MODIFIERS = ['control', 'meta', 'alt', 'shift'] as const;

export type Modifier = (typeof MODIFIERS)[number];

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
 * `record[key]` for own properties only: names such as `constructor` or `__proto__` must not reach
 * `Object.prototype` (found by the property-based tests).
 */
export function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

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
  // ctrlKey is the only flag not named after its modifier (altKey, metaKey, shiftKey).
  return event[`${modifier === 'control' ? 'ctrl' : modifier}Key`];
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

    return keyFromCode(own(ALIASES, name) ?? name);
  });
  const unique = [...new Set(keys)];

  return [
    ...MODIFIERS.filter((key) => unique.includes(key)),
    ...unique.filter((key) => !isModifier(key)),
  ];
}

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

/**
 * Whether `text` matches `pattern`, where `*` stands for any run of characters. Two pointers with
 * one saved position, so at most O(pattern × text) steps: unlike a regex built from the pattern
 * (`^a.*b.*c.*$`), many stars cannot make it backtrack for seconds (ReDoS). Shortcut strings can
 * come from user data, such as saved keymap overrides.
 */
function glob(pattern: string, text: string): boolean {
  let p = 0;
  let t = 0;
  let star = -1;
  let resume = 0;

  while (t < text.length) {
    if (pattern[p] === '*') {
      star = p++;
      resume = t;
    } else if (pattern[p] === text[t]) {
      p++;
      t++;
    } else if (star === -1) {
      return false;
    } else {
      // Let the last star take one more character and retry from there.
      p = star + 1;
      t = ++resume;
    }
  }

  while (pattern[p] === '*') p++;

  return p === pattern.length;
}

function wildcardTest(key: string): (name: string) => boolean {
  const group = own(WILDCARD_GROUPS, key);

  return group ? (name) => group.test(name) : (name) => glob(key, name);
}

/**
 * Builds a matcher for a shortcut with wildcard keys. Every wildcard matches exactly one held key
 * and never a modifier; the other keys must be held exactly, and nothing else may be held.
 */
export function wildcardMatcher(keys: readonly string[]): (pressed: readonly string[]) => boolean {
  const exact = keys.filter((key) => !isWildcard(key));
  const wildcards = keys.filter(isWildcard).map(wildcardTest);

  return (pressed) => {
    if (pressed.length !== keys.length || !exact.every((key) => pressed.includes(key))) {
      return false;
    }

    const rest = pressed.filter((key) => !exact.includes(key));

    if (rest.some(isModifier)) return false;

    // Give each remaining key its own wildcard: a bipartite matching (Kuhn's augmenting paths),
    // polynomial in the number of keys, where trying every assignment would be factorial.
    const owner: (number | undefined)[] = [];
    const place = (key: number, tried: Set<number>): boolean =>
      wildcards.some((matches, w) => {
        if (tried.has(w) || !matches(rest[key]!)) return false;
        tried.add(w);
        if (owner[w] !== undefined && !place(owner[w]!, tried)) return false;
        owner[w] = key;
        return true;
      });

    return rest.every((_, key) => place(key, new Set()));
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

/** Whether a key event comes from typing: a form field, contenteditable or IME composition. */
export function isTyping(event: KeyboardEvent): boolean {
  if (event.isComposing) return true;

  const target = (event.composedPath?.()[0] ?? event.target) as Partial<HTMLElement> | null;

  return (
    !!target &&
    (target.isContentEditable === true ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  );
}
