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
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  getDefaultShortcutter,
  getSequences,
  type UseSequenceOptions,
  type UseShortcutOptions,
} from './shared';
import type { SequenceString, ShortcutHandler, ShortcutString, Shortcutter } from 'shortcutter';
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
