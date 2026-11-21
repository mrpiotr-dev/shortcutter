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
import type { SequenceString, ShortcutHandler, ShortcutString, Shortcutter } from 'shortcutter';
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
