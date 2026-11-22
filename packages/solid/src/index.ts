/**
 * Solid primitives for shortcutter: shortcuts, sequences and held keys for the lifetime of an owner.
 *
 * @packageDocumentation
 * @module @shortcutter/solid
 */
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type Accessor,
} from 'solid-js';
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

/** `<ShortcutterContext.Provider value={shortcutter}>` makes it the instance used below. */
export const ShortcutterContext = createContext<Shortcutter>();

/** The provided instance, or a shared one listening on `window`. */
export function useShortcutter(): Shortcutter {
  return useContext(ShortcutterContext) ?? getDefaultShortcutter();
}

/**
 * Registers `shortcut` for the lifetime of the current owner (component or root). The shortcut
 * and options may be accessors; the shortcut is registered again when they change.
 *
 * @example
 * createShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
 */
export function createShortcut<S extends string>(
  shortcut: ShortcutString<S> | Accessor<string>,
  handler: ShortcutHandler,
  options: UseShortcutOptions | Accessor<UseShortcutOptions> = {},
): void {
  const shortcutter = useShortcutter();

  // Effects do not run during server rendering.
  createEffect(() => {
    const opts = typeof options === 'function' ? options() : options;

    if (opts.enabled === false) return;

    const off = shortcutter.listen(
      typeof shortcut === 'function' ? shortcut() : (shortcut as string),
      handler,
      toListenOptions(opts),
    );

    onCleanup(off);
  });
}

/**
 * Registers a key sequence (`'G I'`) for the lifetime of the current owner, using
 * `shortcutter/sequences`. The sequence and options may be accessors.
 *
 * @example
 * createSequence('G I', () => navigate('/inbox'), { description: 'Go to the inbox' });
 */
export function createSequence<S extends string>(
  sequence: SequenceString<S> | Accessor<string>,
  handler: SequenceHandler,
  options: UseSequenceOptions | Accessor<UseSequenceOptions> = {},
): void {
  const shortcutter = useShortcutter();

  createEffect(() => {
    const opts = typeof options === 'function' ? options() : options;

    if (opts.enabled === false) return;

    const off = getSequences(shortcutter).listen(
      typeof sequence === 'function' ? sequence() : (sequence as string),
      handler,
      toSequenceOptions(opts),
    );

    onCleanup(off);
  });
}

/**
 * The keys held right now (sorted canonical names, e.g. `['k', 'shift']`) as an accessor, updated
 * for the lifetime of the current owner. Empty during server rendering.
 *
 * @example
 * const pressed = createPressedKeys();
 * const sprinting = () => pressed().includes('shift');
 */
export function createPressedKeys(): Accessor<string[]> {
  const shortcutter = useShortcutter();
  const [keys, setKeys] = createSignal<string[]>([]);

  // onMount does not run during server rendering.
  onMount(() => {
    setKeys(shortcutter.pressed());
    onCleanup(shortcutter.subscribe((pressed) => setKeys(pressed)));
  });

  return keys;
}

/**
 * The registered shortcuts (`shortcutter.shortcuts(filter)`) as a signal, updated when shortcuts
 * are added or removed and when contexts change. For help screens. Empty during server rendering.
 *
 * @example
 * const shortcuts = createShortcuts({ active: true });
 * <For each={shortcuts()}>{(s) => <li>{s.description}</li>}</For>
 */
export function createShortcuts(filter: ShortcutsFilter = {}): Accessor<ShortcutInfo[]> {
  const shortcutter = useShortcutter();
  const [list, setList] = createSignal<ShortcutInfo[]>([]);

  // onMount does not run during server rendering.
  onMount(() => {
    const read = () => setList(shortcutter.shortcuts(filter));

    read();
    onCleanup(shortcutter.watch(read));
  });

  return list;
}

/**
 * The commands of a keymap from `shortcutter/keymap` as a signal, updated after `remap()`,
 * `disable()` and `reset()`. For settings screens.
 *
 * @example
 * const commands = createKeymapCommands(keymap);
 */
export function createKeymapCommands<Id extends string>(
  keymap: Keymap<Id>,
): Accessor<KeymapEntry<Id>[]> {
  const [commands, setCommands] = createSignal(keymap.commands());

  onMount(() => {
    setCommands(keymap.commands());
    onCleanup(keymap.subscribe(() => setCommands(keymap.commands())));
  });

  return commands;
}

export type Recorder = {
  /** Whether a recording is running. */
  recording: Accessor<boolean>;
  /** The keys held while recording (canonical names), to show them live. */
  keys: Accessor<string[]>;
  /** Starts recording; resolves to the shortcut string, or `null` if cancelled. Cancels a running one. */
  start(): Promise<string | null>;
  /** Cancels the running recording. */
  cancel(): void;
};

/**
 * Records a shortcut from the keyboard with `shortcutter/record`, for "press a new shortcut"
 * buttons. A recording still running when the owner is disposed is cancelled.
 *
 * @example
 * const recorder = createRecorder();
 * const change = async () => {
 *   const shortcut = await recorder.start();
 *   if (shortcut) keymap.remap('palette', shortcut);
 * };
 */
export function createRecorder(options: Omit<RecordOptions, 'signal' | 'onKeys'> = {}): Recorder {
  const shortcutter = useShortcutter();
  const [recording, setRecording] = createSignal(false);
  const [keys, setKeys] = createSignal<string[]>([]);
  let controller: AbortController | undefined;

  onCleanup(() => controller?.abort());

  return {
    recording,
    keys,
    async start() {
      controller?.abort();

      const own = new AbortController();

      controller = own;
      setRecording(true);
      setKeys([]);

      try {
        return await recordShortcut(shortcutter, {
          ...options,
          signal: own.signal,
          onKeys: (held) => setKeys(held),
        });
      } finally {
        if (controller === own) {
          controller = undefined;
          setRecording(false);
          setKeys([]);
        }
      }
    },
    cancel: () => controller?.abort(),
  };
}
