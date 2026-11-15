import { createContext, createElement, useContext, useEffect, useRef, type ReactNode } from 'react';
import { getDefaultShortcutter, type UseShortcutOptions } from './shared';
import type { ShortcutHandler, Shortcutter } from '@shortcutter/core';

export type { UseShortcutOptions } from './shared';

const ShortcutterContext = createContext<Shortcutter | null>(null);

/** Makes `shortcutter` the instance used by `useShortcut` and `useShortcutter` below it. */
export function ShortcutterProvider(props: { shortcutter: Shortcutter; children?: ReactNode }) {
  return createElement(ShortcutterContext.Provider, { value: props.shortcutter }, props.children);
}

/** The provided instance, or a shared one listening on `window`. Use it to switch contexts. */
export function useShortcutter(): Shortcutter {
  return useContext(ShortcutterContext) ?? getDefaultShortcutter();
}

/**
 * Registers `shortcut` while the component is mounted. The latest `handler` is always called,
 * so it does not need to be memoized.
 *
 * @example
 * useShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
 */
export function useShortcut(
  shortcut: string,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): void {
  const shortcutter = useShortcutter();
  const latest = useRef(handler);
  const { enabled = true, context, phases, ignoreInputs, preventDefault } = options;
  const phaseKey = typeof phases === 'string' ? phases : phases?.join('|');

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    return shortcutter.listen(shortcut, (event, detail) => latest.current(event, detail), {
      context,
      phases,
      ignoreInputs,
      preventDefault,
    });
    // `phases` is tracked through `phaseKey`, so a new array with the same phases is not a change.
  }, [shortcutter, shortcut, enabled, context, phaseKey, ignoreInputs, preventDefault]);
}
