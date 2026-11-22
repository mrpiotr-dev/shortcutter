/**
 * Optional keymap for customizable shortcuts: commands declared as data, user overrides as plain
 * JSON, and conflict checks for settings screens. Apps that do not import this entry do not ship it.
 *
 * @packageDocumentation
 * @module shortcutter/keymap
 */
import { combination, isWildcard, wildcardMatcher } from './keys';
import type { Phases, ShortcutHandler, Shortcutter } from './types';

export type KeymapCommand = {
  /** Default shortcut(s). An empty list means the command has no shortcut until the user adds one. */
  keys: string | readonly string[];
  /** Runs when one of the command's shortcuts is used. */
  run: ShortcutHandler;
  /** What the command does, for settings and help screens. */
  description?: string;
  /** Context the shortcuts are registered in. Defaults to the keymap's `context`. */
  context?: string;
  phases?: Phases;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
};

/**
 * The user's changes, by command id: the shortcuts that replace the defaults, `[]` for a disabled
 * command. Plain JSON, ready to store and to pass back as `overrides` on the next visit.
 */
export type KeymapOverrides = Record<string, string[]>;

export type KeymapOptions = {
  /** Overrides saved earlier. Unknown command ids are ignored. */
  overrides?: KeymapOverrides;
  /** Context for commands that name none. Defaults to `'default'`. */
  context?: string;
  /**
   * Whether two contexts can be active at the same time, so that the same keys in both conflict.
   * Defaults to: only the same context. For an app that always has `'global'` active next to the
   * others: `(a, b) => a === b || a === 'global' || b === 'global'`.
   */
  overlaps?: (a: string, b: string) => boolean;
};

/** A command as a settings screen shows it. */
export type KeymapEntry<Id extends string = string> = {
  id: Id;
  /** The shortcuts in use: the user's, or the defaults. */
  keys: string[];
  defaults: string[];
  description?: string;
  context: string;
  /** Whether the user changed the shortcuts of this command. */
  customized: boolean;
};

/** A shortcut that is already in use, found by `conflicts()`. */
export type KeymapConflict = {
  /** The shortcut in use, as registered, e.g. `'ControlOrMeta+K'`. */
  shortcut: string;
  context: string;
  /** The keymap command it belongs to; missing for shortcuts registered outside the keymap. */
  command?: string;
  description?: string;
};

/** Thrown by `remap()` when the new keys are in use and `force` is not set. */
export class KeymapConflictError extends Error {
  readonly conflicts: KeymapConflict[];

  constructor(shortcut: string, conflicts: KeymapConflict[]) {
    const [first] = conflicts;
    const owner = first!.command ? `"${first!.command}"` : 'another shortcut';

    super(`"${shortcut}" is already used by ${owner} in the "${first!.context}" context.`);
    this.name = 'KeymapConflictError';
    this.conflicts = conflicts;
  }
}

export type Keymap<Id extends string = string> = {
  /** Every command with its current and default shortcuts, in declaration order. */
  commands(): KeymapEntry<Id>[];
  /** The shortcuts the command uses right now. */
  keys(id: Id): string[];
  /**
   * Replaces the command's shortcuts. Throws a {@link KeymapConflictError} if one of them is in use
   * in an overlapping context. With `force`, a command with exactly the same keys in the same
   * context loses them instead; other overlaps are allowed.
   */
  remap(id: Id, keys: string | readonly string[], options?: { force?: boolean }): void;
  /** Removes all shortcuts of the command (WCAG 2.1.4: single-key shortcuts can be turned off). */
  disable(id: Id): void;
  /** Back to the defaults, for one command or for all of them. */
  reset(id?: Id): void;
  /** The user's changes as plain JSON, to store and restore with the `overrides` option. */
  overrides(): KeymapOverrides;
  /**
   * Shortcuts registered on the shortcutter that `shortcut` would clash with in `context` (the
   * keymap's default context if missing): the same keys, or a wildcard covering them. `except`
   * leaves out one command, typically the one being edited.
   */
  conflicts(shortcut: string, options?: { context?: string; except?: Id }): KeymapConflict[];
  /** What the browser or the OS does with `shortcut`, if it is one pages cannot override. */
  reserved(shortcut: string): string | undefined;
  /** Calls `listener` after every change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Removes every shortcut the keymap registered. */
  destroy(): void;
};

/** Shortcuts the browser or the OS keeps for itself: pages never receive them. */
const RESERVED: readonly [string, string, boolean?][] = [
  ['ControlOrMeta+W', 'Closes the tab'],
  ['ControlOrMeta+Shift+W', 'Closes the window'],
  ['ControlOrMeta+T', 'Opens a new tab'],
  ['ControlOrMeta+Shift+T', 'Reopens the last closed tab'],
  ['ControlOrMeta+N', 'Opens a new window'],
  ['ControlOrMeta+Shift+N', 'Opens a private window'],
  ['Control+Tab', 'Switches to the next tab'],
  ['Control+Shift+Tab', 'Switches to the previous tab'],
  // true: macOS only, false: Windows and Linux only.
  ['Meta+Q', 'Quits the browser', true],
  ['Meta+H', 'Hides the browser', true],
  ['Meta+M', 'Minimizes the window', true],
  ['Meta+Tab', 'Switches apps', true],
  ['Alt+F4', 'Closes the window', false],
  ['Alt+Tab', 'Switches apps', false],
  ['Meta+L', 'Locks the computer', false],
];

const list = (keys: string | readonly string[]): string[] =>
  typeof keys === 'string' ? [keys] : [...keys];

/**
 * Registers `commands` on `shortcutter` and lets users change their shortcuts.
 *
 * @example
 * const keymap = createKeymap(shortcutter, {
 *   undo: { keys: 'ControlOrMeta+Z', description: 'Undo', run: undo },
 *   palette: { keys: 'ControlOrMeta+K', description: 'Command palette', run: openPalette },
 * }, { overrides: JSON.parse(localStorage.getItem('keymap') ?? '{}') });
 *
 * keymap.remap('palette', 'ControlOrMeta+P');
 * localStorage.setItem('keymap', JSON.stringify(keymap.overrides()));
 */
export function createKeymap<Commands extends Record<string, KeymapCommand>>(
  shortcutter: Shortcutter,
  commands: Commands,
  options: KeymapOptions = {},
): Keymap<keyof Commands & string> {
  type Id = keyof Commands & string;

  const defaultContext = options.context ?? 'default';
  const overlaps = options.overlaps ?? ((a: string, b: string) => a === b);
  const mac = shortcutter.resolve('ControlOrMeta')[0] === 'meta';
  const ids = Object.keys(commands) as Id[];
  const current = new Map<Id, string[]>();
  const disposers = new Map<Id, (() => void)[]>();
  const listeners = new Set<() => void>();

  const canonical = (shortcut: string) => combination(shortcutter.resolve(shortcut));
  const contextOf = (id: Id) => commands[id]!.context ?? defaultContext;
  const defaults = (id: Id) => list(commands[id]!.keys);
  const same = (a: readonly string[], b: readonly string[]) =>
    a.map(canonical).sort().join(' ') === b.map(canonical).sort().join(' ');

  function command(id: string): KeymapCommand {
    if (!Object.prototype.hasOwnProperty.call(commands, id)) {
      throw new Error(`Unknown command "${id}".`);
    }
    return commands[id]!;
  }

  /** Registers the command's shortcuts, replacing the previous ones. Skips keys that are taken. */
  function apply(id: Id, keys: readonly string[]): void {
    for (const dispose of disposers.get(id) ?? []) dispose();

    const { run, description, phases, preventDefault, ignoreInputs } = commands[id]!;
    const registered: string[] = [];
    const handles: (() => void)[] = [];
    const seen = new Set<string>();

    for (const shortcut of keys) {
      const key = canonical(shortcut);

      if (seen.has(key)) continue;
      seen.add(key);

      try {
        handles.push(
          shortcutter.listen(shortcut, run, {
            context: contextOf(id),
            description,
            phases,
            preventDefault,
            ignoreInputs,
          }),
        );
        registered.push(shortcut);
      } catch {
        // Taken by a shortcut registered outside the keymap, e.g. from overrides saved earlier.
      }
    }

    disposers.set(id, handles);
    current.set(id, registered);
  }

  function changed(): void {
    for (const listener of listeners) listener();
  }

  /** Which command owns a registration, from its context and canonical keys. */
  function owner(context: string, key: string): Id | undefined {
    return ids.find(
      (id) => contextOf(id) === context && current.get(id)!.some((s) => canonical(s) === key),
    );
  }

  function conflicts(
    shortcut: string,
    { context = defaultContext, except }: { context?: string; except?: Id } = {},
  ): KeymapConflict[] {
    const keys = shortcutter.resolve(shortcut);
    const key = combination(keys);
    const found: KeymapConflict[] = [];

    for (const info of shortcutter.shortcuts()) {
      if (!overlaps(context, info.context)) continue;

      const other = combination(info.keys);
      const clash =
        other === key ||
        (info.keys.some(isWildcard) &&
          !keys.some(isWildcard) &&
          wildcardMatcher(info.keys)(keys)) ||
        (keys.some(isWildcard) && !info.keys.some(isWildcard) && wildcardMatcher(keys)(info.keys));

      if (!clash) continue;

      const id = owner(info.context, other);

      if (id !== undefined && id === except) continue;

      found.push({
        shortcut: info.shortcut,
        context: info.context,
        ...(id === undefined ? {} : { command: id }),
        ...(info.description === undefined ? {} : { description: info.description }),
      });
    }

    return found;
  }

  function remap(id: Id, keys: string | readonly string[], { force = false } = {}): void {
    command(id);

    const next = list(keys);
    const context = contextOf(id);
    /** Keys to take from other commands, applied only once every new shortcut has been checked. */
    const taken: [Id, string][] = [];

    for (const shortcut of next) {
      const found = conflicts(shortcut, { context, except: id });

      if (found.length === 0) continue;
      if (!force) throw new KeymapConflictError(shortcut, found);

      // The shortcutter allows one handler per keys and context, so a command with exactly these
      // keys in the same context loses them. Other overlaps are allowed with force.
      for (const conflict of found) {
        if (conflict.context !== context || canonical(conflict.shortcut) !== canonical(shortcut)) {
          continue;
        }
        // Force cannot take keys from a shortcut registered outside the keymap.
        if (conflict.command === undefined) throw new KeymapConflictError(shortcut, [conflict]);

        taken.push([conflict.command as Id, shortcut]);
      }
    }

    for (const [other, shortcut] of taken) {
      apply(
        other,
        current.get(other)!.filter((s) => canonical(s) !== canonical(shortcut)),
      );
    }

    apply(id, next);
    changed();
  }

  for (const id of ids) {
    const saved = options.overrides?.[id];

    apply(id, Array.isArray(saved) ? saved : defaults(id));
  }

  return {
    commands: () =>
      ids.map((id) => {
        const { description } = commands[id]!;

        return {
          id,
          keys: [...current.get(id)!],
          defaults: defaults(id),
          ...(description === undefined ? {} : { description }),
          context: contextOf(id),
          customized: !same(current.get(id)!, defaults(id)),
        };
      }),
    keys: (id) => (command(id), [...current.get(id)!]),
    remap,
    disable(id) {
      command(id);
      apply(id, []);
      changed();
    },
    reset(id) {
      for (const each of id === undefined ? ids : (command(id), [id])) apply(each, defaults(each));
      changed();
    },
    overrides() {
      const result: KeymapOverrides = {};

      for (const id of ids) {
        if (!same(current.get(id)!, defaults(id))) result[id] = [...current.get(id)!];
      }
      return result;
    },
    conflicts,
    reserved(shortcut) {
      const key = canonical(shortcut);

      return RESERVED.find(
        ([reserved, , macOnly]) =>
          (macOnly === undefined || macOnly === mac) && canonical(reserved) === key,
      )?.[1];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    destroy() {
      for (const handles of disposers.values()) for (const dispose of handles) dispose();
      disposers.clear();
      listeners.clear();
    },
  };
}
