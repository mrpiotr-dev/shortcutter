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
  /** The matched shortcut in canonical form, e.g. `'control+k'`. */
  shortcut: string;
  /** The context the shortcut was registered in. */
  context: string;
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
  /** Context to register in. Defaults to the shortcutter's `defaultContext`. */
  context?: string;
  /** Phases to run the handler in. Defaults to `'down'`. */
  phases?: Phases;
  ignoreInputs?: boolean;
  preventDefault?: boolean;
};

export type UnlistenOptions = Pick<ListenOptions, 'context' | 'phases'>;

export type Shortcutter = {
  /**
   * Runs `handler` when `shortcut` (e.g. `'ControlOrMeta+K'`, `'Shift+ArrowUp'`, `'Escape'`)
   * is used while `context` is active. Returns a function that removes the shortcut.
   * Throws if the same shortcut is already registered for one of the phases in that context.
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
