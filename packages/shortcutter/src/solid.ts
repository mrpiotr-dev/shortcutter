import { createContext, createEffect, onCleanup, useContext, type Accessor } from 'solid-js';
import { getDefaultShortcutter, toListenOptions, type UseShortcutOptions } from './adapters/shared';
import type { ShortcutHandler, Shortcutter } from './types';

export type { UseShortcutOptions } from './adapters/shared';

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
export function createShortcut(
  shortcut: string | Accessor<string>,
  handler: ShortcutHandler,
  options: UseShortcutOptions | Accessor<UseShortcutOptions> = {},
): void {
  const shortcutter = useShortcutter();

  // Effects do not run during server rendering.
  createEffect(() => {
    const opts = typeof options === 'function' ? options() : options;

    if (opts.enabled === false) return;

    const off = shortcutter.listen(
      typeof shortcut === 'function' ? shortcut() : shortcut,
      handler,
      toListenOptions(opts),
    );

    onCleanup(off);
  });
}
