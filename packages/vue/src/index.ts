/**
 * Vue composables for shortcutter: shortcuts, sequences and held keys for the lifetime of a component.
 *
 * @packageDocumentation
 * @module @shortcutter/vue
 */
import {
  inject,
  onMounted,
  onUnmounted,
  provide,
  readonly,
  shallowRef,
  toValue,
  watchEffect,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue';
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

/** Provide an instance app-wide with `app.provide(shortcutterKey, createShortcutter())`. */
export const shortcutterKey: InjectionKey<Shortcutter> = Symbol('shortcutter');

/** Makes `shortcutter` the instance used by descendants. Call it in `setup()`. */
export function provideShortcutter(shortcutter: Shortcutter): void {
  provide(shortcutterKey, shortcutter);
}

/** The provided instance, or a shared one listening on `window`. Call it in `setup()`. */
export function useShortcutter(): Shortcutter {
  return inject(shortcutterKey, null) ?? getDefaultShortcutter();
}

/**
 * Registers `shortcut` while the component is mounted. The shortcut and options may be refs or
 * getters; the shortcut is registered again when they change. Call it in `setup()`.
 *
 * @example
 * useShortcut('ControlOrMeta+K', () => (open.value = true), { preventDefault: true });
 */
export function useShortcut<S extends string>(
  shortcut: ShortcutString<S> | Exclude<MaybeRefOrGetter<string>, string>,
  handler: ShortcutHandler,
  options: MaybeRefOrGetter<UseShortcutOptions> = {},
): void {
  const shortcutter = useShortcutter();

  // Registering on mount keeps server rendering free of side effects. A watcher created in a
  // lifecycle hook belongs to the component, so Vue stops it (and runs onCleanup) on unmount.
  onMounted(() => {
    watchEffect((onCleanup) => {
      const opts = toValue(options);

      if (opts.enabled === false) return;

      onCleanup(
        shortcutter.listen(
          toValue(shortcut as MaybeRefOrGetter<string>),
          handler,
          toListenOptions(opts),
        ),
      );
    });
  });
}

/**
 * Registers a key sequence (`'G I'`) while the component is mounted, using `shortcutter/sequences`.
 * The sequence and options may be refs or getters. Call it in `setup()`.
 *
 * @example
 * useSequence('G I', () => router.push('/inbox'), { description: 'Go to the inbox' });
 */
export function useSequence<S extends string>(
  sequence: SequenceString<S> | Exclude<MaybeRefOrGetter<string>, string>,
  handler: SequenceHandler,
  options: MaybeRefOrGetter<UseSequenceOptions> = {},
): void {
  const shortcutter = useShortcutter();

  onMounted(() => {
    watchEffect((onCleanup) => {
      const opts = toValue(options);

      if (opts.enabled === false) return;

      onCleanup(
        getSequences(shortcutter).listen(
          toValue(sequence as MaybeRefOrGetter<string>),
          handler,
          toSequenceOptions(opts),
        ),
      );
    });
  });
}

/**
 * The keys held right now (sorted canonical names, e.g. `['k', 'shift']`) as a read-only ref,
 * updated while the component is mounted. Empty during server rendering. Call it in `setup()`.
 *
 * @example
 * const pressed = usePressedKeys();
 * const sprinting = computed(() => pressed.value.includes('shift'));
 */
export function usePressedKeys(): Readonly<ShallowRef<readonly string[]>> {
  const shortcutter = useShortcutter();
  const keys = shallowRef<readonly string[]>([]);
  let stop: (() => void) | undefined;

  // Subscribing on mount keeps server rendering free of side effects.
  onMounted(() => {
    keys.value = shortcutter.pressed();
    stop = shortcutter.subscribe((pressed) => (keys.value = pressed));
  });
  onUnmounted(() => stop?.());

  return readonly(keys);
}

/**
 * The registered shortcuts (`shortcutter.shortcuts(filter)`), updated when shortcuts are added or
 * removed and when contexts change. For help screens. Empty during server rendering.
 *
 * @example
 * const shortcuts = useShortcuts({ active: true });
 */
export function useShortcuts(
  filter: ShortcutsFilter = {},
): Readonly<ShallowRef<readonly ShortcutInfo[]>> {
  const shortcutter = useShortcutter();
  const list = shallowRef<readonly ShortcutInfo[]>([]);
  const read = () => (list.value = shortcutter.shortcuts(filter));
  let stop: (() => void) | undefined;

  onMounted(() => {
    read();
    stop = shortcutter.watch(read);
  });
  onUnmounted(() => stop?.());

  // Read-only through the type: Vue's readonly() would deep-freeze the entries' types.
  return list;
}

/**
 * The commands of a keymap from `shortcutter/keymap`, with their current and default shortcuts,
 * updated after `remap()`, `disable()` and `reset()`. For settings screens.
 *
 * @example
 * const commands = useKeymap(keymap);
 */
export function useKeymap<Id extends string>(
  keymap: Keymap<Id>,
): Readonly<ShallowRef<readonly KeymapEntry<Id>[]>> {
  const commands = shallowRef<readonly KeymapEntry<Id>[]>(keymap.commands());
  let stop: (() => void) | undefined;

  // Subscribing on mount: onUnmounted never runs during server rendering.
  onMounted(() => {
    commands.value = keymap.commands();
    stop = keymap.subscribe(() => (commands.value = keymap.commands()));
  });
  onUnmounted(() => stop?.());

  return commands;
}

export type Recorder = {
  /** Whether a recording is running. */
  recording: Readonly<Ref<boolean>>;
  /** The keys held while recording (canonical names), to show them live. */
  keys: Readonly<ShallowRef<readonly string[]>>;
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
 * async function change() {
 *   const shortcut = await recorder.start();
 *   if (shortcut) keymap.remap('palette', shortcut);
 * }
 */
export function useRecorder(options: Omit<RecordOptions, 'signal' | 'onKeys'> = {}): Recorder {
  const shortcutter = useShortcutter();
  const recording = shallowRef(false);
  const keys = shallowRef<readonly string[]>([]);
  let controller: AbortController | undefined;

  onUnmounted(() => controller?.abort());

  async function start(): Promise<string | null> {
    controller?.abort();

    const own = new AbortController();

    controller = own;
    recording.value = true;
    keys.value = [];

    try {
      return await recordShortcut(shortcutter, {
        ...options,
        signal: own.signal,
        onKeys: (held) => (keys.value = held),
      });
    } finally {
      if (controller === own) {
        controller = undefined;
        recording.value = false;
        keys.value = [];
      }
    }
  }

  return {
    recording: readonly(recording),
    keys: readonly(keys),
    start,
    cancel: () => controller?.abort(),
  };
}
