import {
  inject,
  onMounted,
  provide,
  toValue,
  watchEffect,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';
import { getDefaultShortcutter, toListenOptions, type UseShortcutOptions } from './adapters/shared';
import type { ShortcutHandler, Shortcutter } from './types';

export type { UseShortcutOptions } from './adapters/shared';

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
