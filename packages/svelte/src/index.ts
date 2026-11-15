import { getContext, onMount, setContext } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { getDefaultShortcutter, toListenOptions, type UseShortcutOptions } from './shared';
import type { ShortcutHandler, Shortcutter } from '@shortcutter/core';

export type { UseShortcutOptions } from './shared';

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
export function useShortcut(
  shortcut: string,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): void {
  const shortcutter = getShortcutter();

  onMount(() =>
    options.enabled === false
      ? undefined
      : shortcutter.listen(shortcut, handler, toListenOptions(options)),
  );
}

/**
 * Attachment that registers `shortcut` while the element exists, and again when its
 * arguments change. Pass `shortcutter` to use an instance other than the shared one.
 *
 * @example
 * <div {@attach shortcut('Escape', close, { context: 'modal' })}>
 */
export function shortcut(
  keys: string,
  handler: ShortcutHandler,
  options: UseShortcutOptions & { shortcutter?: Shortcutter } = {},
): Attachment {
  const { shortcutter = getDefaultShortcutter(), ...rest } = options;

  return () =>
    rest.enabled === false ? undefined : shortcutter.listen(keys, handler, toListenOptions(rest));
}
