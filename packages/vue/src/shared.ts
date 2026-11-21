import { createShortcutter, type ListenOptions, type Shortcutter } from 'shortcutter';
import { createSequences, type SequenceOptions, type Sequences } from 'shortcutter/sequences';

export type UseShortcutOptions = ListenOptions & {
  /** Set to `false` to remove the shortcut without unmounting. Defaults to `true`. */
  enabled?: boolean;
};

let fallback: Shortcutter | undefined;

/** The instance adapters use when none is provided: created on first use, listening on `window`. */
export function getDefaultShortcutter(): Shortcutter {
  fallback ??= createShortcutter();
  return fallback;
}

export function toListenOptions({
  enabled: _enabled,
  ...options
}: UseShortcutOptions): ListenOptions {
  return options;
}

export type UseSequenceOptions = SequenceOptions & {
  /** Set to `false` to remove the sequence without unmounting. Defaults to `true`. */
  enabled?: boolean;
};

const sequencesByShortcutter = new WeakMap<Shortcutter, Sequences>();

/** One sequences instance per shortcutter, created on first use (default timeout). */
export function getSequences(shortcutter: Shortcutter): Sequences {
  let sequences = sequencesByShortcutter.get(shortcutter);

  if (!sequences) {
    sequences = createSequences(shortcutter);
    sequencesByShortcutter.set(shortcutter, sequences);
  }
  return sequences;
}

export function toSequenceOptions({
  enabled: _enabled,
  ...options
}: UseSequenceOptions): SequenceOptions {
  return options;
}
