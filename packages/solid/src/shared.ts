import { createShortcutter, type ListenOptions, type Shortcutter } from '@shortcutter/core';

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
