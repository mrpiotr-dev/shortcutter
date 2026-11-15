import { createContext, createEffect, onCleanup, useContext, type Accessor } from 'solid-js';
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

/**
 * Registers a key sequence (`'G I'`) for the lifetime of the current owner, using
 * `shortcutter/sequences`. The sequence and options may be accessors.
 *
 * @example
 * createSequence('G I', () => navigate('/inbox'), { description: 'Go to the inbox' });
 */
export function createSequence(
  sequence: string | Accessor<string>,
  handler: SequenceHandler,
  options: UseSequenceOptions | Accessor<UseSequenceOptions> = {},
): void {
  const shortcutter = useShortcutter();

  createEffect(() => {
    const opts = typeof options === 'function' ? options() : options;

    if (opts.enabled === false) return;

    const off = getSequences(shortcutter).listen(
      typeof sequence === 'function' ? sequence() : sequence,
      handler,
      toSequenceOptions(opts),
    );

    onCleanup(off);
  });
}
