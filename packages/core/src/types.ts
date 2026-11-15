/**
 * When a handler runs:
 * - `down`: every key of the shortcut became pressed;
 * - `press`: the shortcut is held and the system repeats the key;
 * - `up`: the shortcut stopped being pressed (a key was released, another key joined, or the page lost
 *   focus, was left or was hidden).
 */
export type Phase = 'down' | 'press' | 'up';

/** One phase or a list of them, e.g. `'down'` or `['down', 'up']`. */
export type Phases = Phase | readonly Phase[];

export type ShortcutDetail = {
  phase: Phase;
  /** The keys actually held, in canonical form, e.g. `'arrowup+shift'`. */
  shortcut: string;
  /** The registered shortcut in canonical form, e.g. `'arrow*+shift'`. Same as `shortcut` without wildcards. */
  pattern: string;
  /** The context the shortcut was registered in. */
  context: string;
  /** The description given to `listen()`, if any. */
  description?: string;
};

/**
 * `event` is the `KeyboardEvent`, or for an `up` caused by releasing every key, the event that did it:
 * `blur`, `pagehide` or `visibilitychange`.
 */
export type ShortcutHandler = (event: KeyboardEvent | Event, detail: ShortcutDetail) => void;

/** Gets the keys held right now (sorted canonical names) each time they change. */
export type KeysListener = (pressed: string[], event: KeyboardEvent | Event) => void;

export type ShortcutterOptions = {
  /**
   * Where keyboard events are listened to. Defaults to `window` in browsers.
   * Without a target (e.g. during SSR) no listeners are attached and no shortcut fires.
   */
  target?: EventTarget;
  /** Aborting this signal has the same effect as calling `destroy()`. */
  signal?: AbortSignal;
  /** Context that is active from the start and used when `listen()` gets none. Defaults to `'default'`. */
  defaultContext?: string;
  /**
   * Skip handlers while typing in `<input>`, `<textarea>`, `<select>`, a contenteditable element,
   * or during IME composition. Defaults to `true`. Can be overridden per shortcut.
   */
  ignoreInputs?: boolean;
  /** Call `event.preventDefault()` when a handler runs. Defaults to `false`. Can be overridden per shortcut. */
  preventDefault?: boolean;
  /** Treat the platform as macOS (`ControlOrMeta` = Meta). Detected from `navigator` by default. */
  mac?: boolean;
};

export type ListenOptions = {
  /** What the shortcut does, for help screens built from `shortcuts()`. */
  description?: string;
  /** Context to register in. Defaults to the shortcutter's `defaultContext`. */
  context?: string;
  /** Phases to run the handler in. Defaults to `'down'`. */
  phases?: Phases;
  ignoreInputs?: boolean;
  preventDefault?: boolean;
};

export type UnlistenOptions = Pick<ListenOptions, 'context' | 'phases'>;

/** A registered shortcut, as listed by `shortcuts()`. */
export type ShortcutInfo = {
  /** The shortcut as passed to `listen()`, e.g. `'ControlOrMeta+K'`. */
  shortcut: string;
  /**
   * Canonical key names for this platform, modifiers first: `['meta', 'k']` on macOS,
   * `['control', 'k']` elsewhere. Wildcards stay as written, e.g. `'arrow*'`.
   */
  keys: string[];
  context: string;
  phases: Phase[];
  description?: string;
  /** Whether the shortcut's context is active, so the shortcut works right now. */
  active: boolean;
};

export type ShortcutsFilter = {
  /** Only shortcuts whose context is active (`true`) or inactive (`false`). */
  active?: boolean;
  /** Only shortcuts in this context. */
  context?: string;
};

export type Shortcutter = {
  /**
   * Runs `handler` when `shortcut` (e.g. `'ControlOrMeta+K'`, `'Shift+ArrowUp'`, `'Escape'`)
   * is used while `context` is active. Returns a function that removes the shortcut.
   * Throws if the same shortcut is already registered for one of the phases in that context.
   *
   * A key may contain `*`: `'Shift+Arrow*'`, `'Digit*'` (any digit), `'Key*'` (any letter),
   * `'F*'` (function keys), `'Control+*'` (any key). Each wildcard matches one key and never a
   * modifier. Within a context, an exact shortcut wins over wildcards for the same keys.
   */
  listen(shortcut: string, handler: ShortcutHandler, options?: ListenOptions): () => void;
  /** Removes a shortcut. Does nothing if it is not registered. */
  unlisten(shortcut: string, options?: UnlistenOptions): void;
  contexts: {
    /** Makes exactly these contexts active; handlers run in this order. Unknown names are allowed. */
    activate(...names: string[]): void;
    /** Names of the active contexts. */
    active(): string[];
    isActive(name: string): boolean;
  };
  /** Registered shortcuts in registration order, e.g. to build a keyboard help screen. */
  shortcuts(filter?: ShortcutsFilter): ShortcutInfo[];
  /** Canonical names of the keys pressed right now, sorted. */
  pressed(): string[];
  /**
   * Calls `listener` whenever the held keys change, with the new list. Returns an unsubscribe
   * function. Fits `useSyncExternalStore` in React, or any key visualizer.
   */
  subscribe(listener: KeysListener): () => void;
  /** Removes all event listeners. Registered shortcuts stop firing. Safe to call twice. */
  destroy(): void;
};
