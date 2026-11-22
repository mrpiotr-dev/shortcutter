/**
 * React hooks for shortcutter: shortcuts, sequences and held keys for the lifetime of a component.
 *
 * @packageDocumentation
 * @module @shortcutter/react
 */
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { recordShortcut, type RecordOptions } from 'shortcutter/record';
import {
  getDefaultShortcutter,
  getSequences,
  type UseSequenceOptions,
  type UseShortcutOptions,
} from './shared';
import type {
  SequenceString,
  ShortcutHandler,
  ShortcutInfo,
  ShortcutsFilter,
  ShortcutString,
  Shortcutter,
} from 'shortcutter';
import type { Keymap, KeymapEntry } from 'shortcutter/keymap';
import type { SequenceHandler } from 'shortcutter/sequences';

export type { UseSequenceOptions, UseShortcutOptions } from './shared';

const ShortcutterContext = createContext<Shortcutter | null>(null);

/** Makes `shortcutter` the instance used by `useShortcut` and `useShortcutter` below it. */
export function ShortcutterProvider(props: { shortcutter: Shortcutter; children?: ReactNode }) {
  return createElement(ShortcutterContext.Provider, { value: props.shortcutter }, props.children);
}

/** The provided instance, or a shared one listening on `window`. Use it to switch contexts. */
export function useShortcutter(): Shortcutter {
  return useContext(ShortcutterContext) ?? getDefaultShortcutter();
}

/**
 * Registers `shortcut` while the component is mounted. The latest `handler` is always called,
 * so it does not need to be memoized.
 *
 * @example
 * useShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
 */
export function useShortcut<S extends string>(
  shortcut: ShortcutString<S>,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): void {
  const shortcutter = useShortcutter();
  const latest = useRef(handler);
  const { enabled = true, description, context, phases, ignoreInputs, preventDefault } = options;
  const phaseKey = typeof phases === 'string' ? phases : phases?.join('|');

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    return shortcutter.listen(
      shortcut as string,
      (event, detail) => latest.current(event, detail),
      {
        description,
        context,
        phases,
        ignoreInputs,
        preventDefault,
      },
    );
    // `phases` is tracked through `phaseKey`, so a new array with the same phases is not a change.
  }, [
    shortcutter,
    shortcut,
    enabled,
    description,
    context,
    phaseKey,
    ignoreInputs,
    preventDefault,
  ]);
}

/**
 * Registers a key sequence (`'G I'`) while the component is mounted, using `shortcutter/sequences`.
 * The latest `handler` is always called.
 *
 * @example
 * useSequence('G I', () => navigate('/inbox'), { description: 'Go to the inbox' });
 */
export function useSequence<S extends string>(
  sequence: SequenceString<S>,
  handler: SequenceHandler,
  options: UseSequenceOptions = {},
): void {
  const shortcutter = useShortcutter();
  const latest = useRef(handler);
  const { enabled = true, description, context, ignoreInputs, preventDefault } = options;

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    return getSequences(shortcutter).listen(
      sequence as string,
      (event, detail) => latest.current(event, detail),
      {
        description,
        context,
        ignoreInputs,
        preventDefault,
      },
    );
  }, [shortcutter, sequence, enabled, description, context, ignoreInputs, preventDefault]);
}

const NONE: string[] = [];

/**
 * The keys held right now (sorted canonical names, e.g. `['k', 'shift']`), re-rendering when they
 * change. Empty during server rendering.
 *
 * @example
 * const pressed = usePressedKeys();
 * const sprinting = pressed.includes('shift');
 */
export function usePressedKeys(): string[] {
  const shortcutter = useShortcutter();
  const snapshot = useRef<string[]>(NONE);

  const subscribe = useCallback(
    (onChange: () => void) => shortcutter.subscribe(() => onChange()),
    [shortcutter],
  );
  // useSyncExternalStore needs the same array until the keys change.
  const getSnapshot = () => {
    const keys = shortcutter.pressed();

    if (keys.join('+') !== snapshot.current.join('+')) {
      snapshot.current = keys.length === 0 ? NONE : keys;
    }
    return snapshot.current;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => NONE);
}

/**
 * Keeps a snapshot until `read()` returns something different (compared as JSON), so
 * useSyncExternalStore gets the same array while nothing changed.
 */
function useStableSnapshot<T>(read: () => T, empty: T): () => T {
  const snapshot = useRef<{ json: string; value: T }>({
    json: JSON.stringify(empty),
    value: empty,
  });

  return () => {
    const value = read();
    const json = JSON.stringify(value);

    if (json !== snapshot.current.json) snapshot.current = { json, value };
    return snapshot.current.value;
  };
}

const NO_SHORTCUTS: ShortcutInfo[] = [];

/**
 * The registered shortcuts (`shortcutter.shortcuts(filter)`), re-rendering when shortcuts are added
 * or removed and when contexts change. For help screens. Empty during server rendering.
 *
 * @example
 * const shortcuts = useShortcuts({ active: true });
 * return <ul>{shortcuts.map((s) => <li key={s.shortcut}>{s.description}</li>)}</ul>;
 */
export function useShortcuts(filter: ShortcutsFilter = {}): ShortcutInfo[] {
  const shortcutter = useShortcutter();
  const { active, context } = filter;
  const subscribe = useCallback(
    (onChange: () => void) => shortcutter.watch(onChange),
    [shortcutter],
  );
  const getSnapshot = useStableSnapshot(
    () => shortcutter.shortcuts({ active, context }),
    NO_SHORTCUTS,
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => NO_SHORTCUTS);
}

/**
 * The commands of a keymap from `shortcutter/keymap`, with their current and default shortcuts,
 * re-rendering after `remap()`, `disable()` and `reset()`. For settings screens.
 *
 * @example
 * const commands = useKeymap(keymap);
 */
export function useKeymap<Id extends string>(keymap: Keymap<Id>): KeymapEntry<Id>[] {
  const subscribe = useCallback((onChange: () => void) => keymap.subscribe(onChange), [keymap]);
  const getSnapshot = useStableSnapshot(() => keymap.commands(), [] as KeymapEntry<Id>[]);

  return useSyncExternalStore(subscribe, getSnapshot, () => keymap.commands());
}

export type Recorder = {
  /** Whether a recording is running. */
  recording: boolean;
  /** The keys held while recording (canonical names), to show them live. */
  keys: string[];
  /** Starts recording; resolves to the shortcut string, or `null` if cancelled. Cancels a running one. */
  start(): Promise<string | null>;
  /** Cancels the running recording. */
  cancel(): void;
};

/**
 * Records a shortcut from the keyboard with `shortcutter/record`, for "press a new shortcut"
 * buttons. A recording still running when the component unmounts is cancelled.
 *
 * @example
 * const recorder = useRecorder();
 * const change = async () => {
 *   const shortcut = await recorder.start();
 *   if (shortcut) keymap.remap('palette', shortcut);
 * };
 */
export function useRecorder(options: Omit<RecordOptions, 'signal' | 'onKeys'> = {}): Recorder {
  const shortcutter = useShortcutter();
  const [recording, setRecording] = useState(false);
  const [keys, setKeys] = useState<string[]>(NONE);
  const controller = useRef<AbortController | undefined>(undefined);
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => () => controller.current?.abort(), []);

  const cancel = useCallback(() => controller.current?.abort(), []);
  const start = useCallback(async () => {
    controller.current?.abort();

    const own = new AbortController();

    controller.current = own;
    setRecording(true);
    setKeys(NONE);

    try {
      return await recordShortcut(shortcutter, {
        ...latest.current,
        signal: own.signal,
        onKeys: setKeys,
      });
    } finally {
      if (controller.current === own) {
        controller.current = undefined;
        setRecording(false);
        setKeys(NONE);
      }
    }
  }, [shortcutter]);

  return { recording, keys, start, cancel };
}
