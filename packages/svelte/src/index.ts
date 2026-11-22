/**
 * Svelte 5 functions and attachments for shortcutter: shortcuts, sequences and held keys.
 *
 * @packageDocumentation
 * @module @shortcutter/svelte
 */
import { getContext, onMount, setContext } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createSubscriber } from 'svelte/reactivity';
import {
  getDefaultShortcutter,
  getSequences,
  toListenOptions,
  toSequenceOptions,
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
import { recordShortcut, type RecordOptions } from 'shortcutter/record';
import type { SequenceHandler } from 'shortcutter/sequences';

export type { UseSequenceOptions, UseShortcutOptions } from './shared';

const KEY = Symbol('shortcutter');

/** Makes `shortcutter` the instance used by descendants. Call it during component initialisation. */
export function setShortcutter(shortcutter: Shortcutter): void {
  setContext(KEY, shortcutter);
}

/** The provided instance, or a shared one listening on `window`. Call it during component initialisation. */
export function getShortcutter(): Shortcutter {
  return getContext<Shortcutter | undefined>(KEY) ?? getDefaultShortcutter();
}

/**
 * Registers `shortcut` while the component is mounted. Call it during component initialisation.
 *
 * @example
 * useShortcut('ControlOrMeta+K', () => (open = true), { preventDefault: true });
 */
export function useShortcut<S extends string>(
  shortcut: ShortcutString<S>,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): void {
  const shortcutter = getShortcutter();

  onMount(() =>
    options.enabled === false
      ? undefined
      : shortcutter.listen(shortcut as string, handler, toListenOptions(options)),
  );
}

/**
 * Attachment that registers `shortcut` while the element exists, and again when its
 * arguments change. Pass `shortcutter` to use an instance other than the shared one.
 *
 * @example
 * <div {@attach shortcut('Escape', close, { context: 'modal' })}>
 */
export function shortcut<S extends string>(
  keys: ShortcutString<S>,
  handler: ShortcutHandler,
  options: UseShortcutOptions & { shortcutter?: Shortcutter } = {},
): Attachment {
  const { shortcutter = getDefaultShortcutter(), ...rest } = options;

  return () =>
    rest.enabled === false
      ? undefined
      : shortcutter.listen(keys as string, handler, toListenOptions(rest));
}

/**
 * Registers a key sequence (`'G I'`) while the component is mounted, using `shortcutter/sequences`.
 * Call it during component initialisation.
 */
export function useSequence<S extends string>(
  sequence: SequenceString<S>,
  handler: SequenceHandler,
  options: UseSequenceOptions = {},
): void {
  const shortcutter = getShortcutter();

  onMount(() =>
    options.enabled === false
      ? undefined
      : getSequences(shortcutter).listen(sequence as string, handler, toSequenceOptions(options)),
  );
}

/**
 * Attachment that registers a key sequence while the element exists, and again when its
 * arguments change. Pass `shortcutter` to use an instance other than the shared one.
 *
 * @example
 * <nav {@attach sequence('G H', goHome)}>
 */
export function sequence<S extends string>(
  keys: SequenceString<S>,
  handler: SequenceHandler,
  options: UseSequenceOptions & { shortcutter?: Shortcutter } = {},
): Attachment {
  const { shortcutter = getDefaultShortcutter(), ...rest } = options;

  return () =>
    rest.enabled === false
      ? undefined
      : getSequences(shortcutter).listen(keys as string, handler, toSequenceOptions(rest));
}

/**
 * The keys held right now (sorted canonical names, e.g. `['k', 'shift']`). Reading `current` in a
 * template, `$derived` or `$effect` updates it when the keys change. Call it during component
 * initialisation.
 *
 * @example
 * const pressed = usePressedKeys();
 * const sprinting = $derived(pressed.current.includes('shift'));
 */
export function usePressedKeys(): { readonly current: string[] } {
  const shortcutter = getShortcutter();
  // Subscribes while something reactive reads `current`, so nothing runs during server rendering.
  const track = createSubscriber((update) => shortcutter.subscribe(() => update()));

  return {
    get current() {
      track();
      return shortcutter.pressed();
    },
  };
}

/**
 * The registered shortcuts (`shortcutter.shortcuts(filter)`), reactive: updates when shortcuts are
 * added or removed and when contexts change. For help screens. Call it during component
 * initialisation.
 *
 * @example
 * const shortcuts = useShortcuts({ active: true });
 * // {#each shortcuts.current as s}<li>{s.description}</li>{/each}
 */
export function useShortcuts(filter: ShortcutsFilter = {}): { readonly current: ShortcutInfo[] } {
  const shortcutter = getShortcutter();
  // Subscribes while something reactive reads `current`, so nothing runs during server rendering.
  const track = createSubscriber((update) => shortcutter.watch(update));

  return {
    get current() {
      track();
      return shortcutter.shortcuts(filter);
    },
  };
}

/**
 * The commands of a keymap from `shortcutter/keymap`, reactive: updates after `remap()`,
 * `disable()` and `reset()`. For settings screens.
 *
 * @example
 * const commands = useKeymap(keymap);
 */
export function useKeymap<Id extends string>(
  keymap: Keymap<Id>,
): { readonly current: KeymapEntry<Id>[] } {
  const track = createSubscriber((update) => keymap.subscribe(update));

  return {
    get current() {
      track();
      return keymap.commands();
    },
  };
}

export type Recorder = {
  /** Whether a recording is running. */
  readonly recording: boolean;
  /** The keys held while recording (canonical names), to show them live. */
  readonly keys: string[];
  /** Starts recording; resolves to the shortcut string, or `null` if cancelled. Cancels a running one. */
  start(): Promise<string | null>;
  /** Cancels the running recording. */
  cancel(): void;
};

/**
 * Records a shortcut from the keyboard with `shortcutter/record`, for "press a new shortcut"
 * buttons. `recording` and `keys` are reactive. A recording still running when the component is
 * destroyed is cancelled. Call it during component initialisation.
 *
 * @example
 * const recorder = useRecorder();
 * async function change() {
 *   const shortcut = await recorder.start();
 *   if (shortcut) keymap.remap('palette', shortcut);
 * }
 */
export function useRecorder(options: Omit<RecordOptions, 'signal' | 'onKeys'> = {}): Recorder {
  const shortcutter = getShortcutter();
  const updates = new Set<() => void>();
  const track = createSubscriber((update) => {
    updates.add(update);
    return () => void updates.delete(update);
  });
  let recording = false;
  let keys: string[] = [];
  let controller: AbortController | undefined;

  const set = (nextRecording: boolean, nextKeys: string[]) => {
    recording = nextRecording;
    keys = nextKeys;
    for (const update of updates) update();
  };

  onMount(() => () => controller?.abort());

  return {
    get recording() {
      track();
      return recording;
    },
    get keys() {
      track();
      return keys;
    },
    async start() {
      controller?.abort();

      const own = new AbortController();

      controller = own;
      set(true, []);

      try {
        return await recordShortcut(shortcutter, {
          ...options,
          signal: own.signal,
          onKeys: (held) => set(true, held),
        });
      } finally {
        if (controller === own) {
          controller = undefined;
          set(false, []);
        }
      }
    },
    cancel: () => controller?.abort(),
  };
}
