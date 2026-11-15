import { useContexts } from './contexts';
import { useController } from './controller';
import { normalizeKeyCode } from './helpers';
import type { Phase, Phases, ShortcutCallback } from './types';

export type ShortcutterConfig = {
  /**
   * Where keyboard events are listened to. Defaults to `window` in browsers.
   * Without a target (e.g. during SSR) no listeners are attached and no shortcut fires.
   */
  eventTarget?: EventTarget;
  /** Name of the context created and activated on start. Defaults to `'default'`. */
  defaultContext?: string;
  /** Aborting this signal has the same effect as calling `destroy()`. */
  signal?: AbortSignal;
};

/**
 * Creates a shortcut manager bound to `eventTarget` (or `window`).
 */
export function useShortcutter(config: ShortcutterConfig = {}) {
  const eventTarget: EventTarget | undefined =
    config.eventTarget ?? (typeof window === 'undefined' ? undefined : window);
  const defaultContext = config.defaultContext ?? 'default';

  const contexts = useContexts();
  const keysRecorder = useController();

  contexts.add(defaultContext);
  contexts.setActive(defaultContext);

  const listeners = new AbortController();
  const options: AddEventListenerOptions = { signal: listeners.signal };

  eventTarget?.addEventListener('keydown', onkeydown as EventListener, options);
  eventTarget?.addEventListener('keyup', onkeyup as EventListener, options);
  eventTarget?.addEventListener('blur', onblur as EventListener, options);

  function destroy(): void {
    listeners.abort();
    keysRecorder.releaseAll();
  }

  if (config.signal?.aborted) {
    destroy();
  } else {
    config.signal?.addEventListener('abort', destroy, options);
  }

  const invokeClbck = (keys: readonly string[], event: Event, phase: Phase) => {
    contexts.getActive().forEach((context) => {
      const ctx = contexts.get(context);

      if (ctx?.has(keys, phase)) {
        ctx.get(keys, phase)?.(event, phase);
      }
    });
  };

  function onkeydown(event: KeyboardEvent): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    keysRecorder.press(normalizeKeyCode(event.code));

    const nextCombination = keysRecorder.getPressed().join('+');

    if (previousCombination !== nextCombination) {
      if (previousCombination.length) {
        invokeClbck(previousCombination.split('+'), event, 'up');
      }

      invokeClbck(nextCombination.split('+'), event, 'down');
    } else {
      invokeClbck(previousCombination.split('+'), event, 'press');
    }
  }

  function onkeyup(event: KeyboardEvent): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    keysRecorder.release(normalizeKeyCode(event.code));

    const nextCombination = keysRecorder.getPressed().join('+');

    if (previousCombination.length) {
      invokeClbck(previousCombination.split('+'), event, 'up');
    }
    if (nextCombination.length) {
      invokeClbck(nextCombination.split('+'), event, 'down');
    }
  }

  function onblur(event: FocusEvent): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    if (previousCombination.length) {
      invokeClbck(previousCombination.split('+'), event, 'up');
    }

    keysRecorder.releaseAll();
  }

  return {
    listen: (
      context: string,
      keys: readonly string[],
      callback: ShortcutCallback,
      phases?: Phases,
    ) => {
      const ctx = contexts.has(context) ? contexts.get(context) : contexts.add(context);

      ctx?.add(keys, callback, phases);

      return () => ctx?.remove(keys, phases);
    },
    unlisten: (context: string, keys: readonly string[], phases?: Phases) => {
      const ctx = contexts.get(context);

      ctx?.remove(keys, phases);
    },
    hasContext: (name: string) => contexts.has(name),
    getActiveContext: () => contexts.getActive(),
    setActiveContext: (name: string) => contexts.setActive(name),
    /** Removes all event listeners. Registered shortcuts stop firing. Safe to call twice. */
    destroy,
  } as const;
}
