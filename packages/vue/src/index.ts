import {
  inject,
  onMounted,
  provide,
  toValue,
  watchEffect,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';
import {
  getDefaultShortcutter,
  getSequences,
  toListenOptions,
  toSequenceOptions,
  type UseSequenceOptions,
  type UseShortcutOptions,
} from './shared';
import type { ShortcutHandler, Shortcutter } from 'shortcutter';
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
export function useShortcut(
  shortcut: MaybeRefOrGetter<string>,
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

      onCleanup(shortcutter.listen(toValue(shortcut), handler, toListenOptions(opts)));
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
export function useSequence(
  sequence: MaybeRefOrGetter<string>,
  handler: SequenceHandler,
  options: MaybeRefOrGetter<UseSequenceOptions> = {},
): void {
  const shortcutter = useShortcutter();

  onMounted(() => {
    watchEffect((onCleanup) => {
      const opts = toValue(options);

      if (opts.enabled === false) return;

      onCleanup(
        getSequences(shortcutter).listen(toValue(sequence), handler, toSequenceOptions(opts)),
      );
    });
  });
}
