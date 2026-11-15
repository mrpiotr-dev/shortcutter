import {
  MODIFIERS,
  combination,
  detectMac,
  isModifier,
  isModifierHeld,
  keyFromCode,
  parseShortcut,
} from './keys';
import type {
  ListenOptions,
  Phase,
  Phases,
  ShortcutHandler,
  Shortcutter,
  ShortcutterOptions,
  UnlistenOptions,
} from './types';

type Binding = {
  handler: ShortcutHandler;
  ignoreInputs: boolean;
  preventDefault: boolean;
};

const PHASE_NAMES: readonly Phase[] = ['down', 'press', 'up'];

function toPhases(phases: Phases): Phase[] {
  const list: readonly unknown[] = Array.isArray(phases) ? phases : [phases];

  if (list.length === 0) {
    throw new Error('At least one phase is required.');
  }

  for (const phase of list) {
    if (!PHASE_NAMES.includes(phase as Phase)) {
      throw new Error(`Unknown phase "${String(phase)}". Expected "down", "press" or "up".`);
    }
  }

  return [...new Set(list as Phase[])];
}

function isTyping(event: KeyboardEvent): boolean {
  if (event.isComposing) return true;

  const target = (event.composedPath?.()[0] ?? event.target) as Partial<HTMLElement> | null;

  return (
    !!target &&
    (target.isContentEditable === true ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  );
}

/**
 * Creates a shortcut manager listening on `options.target` (or `window`).
 *
 * @example
 * const shortcutter = createShortcutter();
 * shortcutter.listen('ControlOrMeta+K', () => openPalette(), { preventDefault: true });
 */
export function createShortcutter(options: ShortcutterOptions = {}): Shortcutter {
  const target: EventTarget | undefined =
    options.target ?? (typeof window === 'undefined' ? undefined : window);
  const defaultContext = options.defaultContext ?? 'default';
  const ignoreInputs = options.ignoreInputs ?? true;
  const preventDefault = options.preventDefault ?? false;
  const mac = options.mac ?? detectMac();

  /** context → `${combination}|${phase}` → binding */
  const registry = new Map<string, Map<string, Binding>>();
  const pressed = new Set<string>();
  let active: string[] = [defaultContext];

  function dispatch(keys: string, phase: Phase, event: KeyboardEvent | FocusEvent): void {
    if (keys === '') return;

    const typing = event.type === 'blur' ? false : isTyping(event as KeyboardEvent);

    // activate() replaces `active`, so a handler switching contexts does not affect this loop.
    for (const context of active) {
      const binding = registry.get(context)?.get(`${keys}|${phase}`);

      if (!binding || (typing && binding.ignoreInputs)) continue;
      if (binding.preventDefault) event.preventDefault();

      binding.handler(event, { phase, shortcut: keys, context });
    }
  }

  /**
   * Trusts the event's modifier flags over our own record: drops modifiers released where we could
   * not see it (keyup lost), and adds modifiers pressed before the page had focus (keydown lost).
   */
  function syncModifiers(event: KeyboardEvent, key: string): void {
    for (const modifier of MODIFIERS) {
      if (modifier === key) continue;

      if (isModifierHeld(event, modifier)) pressed.add(modifier);
      else pressed.delete(modifier);
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    const key = keyFromCode(event.code);

    if (!key) return;

    syncModifiers(event, key);

    const previous = combination(pressed);

    if (pressed.has(key)) {
      dispatch(previous, 'press', event);
      return;
    }

    pressed.add(key);
    dispatch(previous, 'up', event);
    dispatch(combination(pressed), 'down', event);
  }

  function onKeyUp(event: KeyboardEvent): void {
    const key = keyFromCode(event.code);

    syncModifiers(event, key);

    if (!pressed.has(key)) return;

    const previous = combination(pressed);

    pressed.delete(key);

    // macOS sends no keyup for other keys while Meta is held, so they would stay "pressed".
    if (key === 'meta') {
      for (const other of pressed) {
        if (!isModifier(other)) pressed.delete(other);
      }
    }

    dispatch(previous, 'up', event);
  }

  function onBlur(event: FocusEvent): void {
    const previous = combination(pressed);

    pressed.clear();
    dispatch(previous, 'up', event);
  }

  const listeners = new AbortController();
  const listenerOptions: AddEventListenerOptions = { signal: listeners.signal };

  target?.addEventListener('keydown', onKeyDown as EventListener, listenerOptions);
  target?.addEventListener('keyup', onKeyUp as EventListener, listenerOptions);
  target?.addEventListener('blur', onBlur as EventListener, listenerOptions);

  function destroy(): void {
    listeners.abort();
    pressed.clear();
  }

  if (options.signal?.aborted) {
    destroy();
  } else {
    options.signal?.addEventListener('abort', destroy, listenerOptions);
  }

  function listen(shortcut: string, handler: ShortcutHandler, opts: ListenOptions = {}) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for shortcut "${shortcut}" has to be a function.`);
    }

    const keys = parseShortcut(shortcut, mac);
    const phases = toPhases(opts.phases ?? 'down');
    const context = opts.context ?? defaultContext;
    const bindings = registry.get(context) ?? new Map<string, Binding>();
    const binding: Binding = {
      handler,
      ignoreInputs: opts.ignoreInputs ?? ignoreInputs,
      preventDefault: opts.preventDefault ?? preventDefault,
    };

    for (const phase of phases) {
      if (bindings.has(`${keys}|${phase}`)) {
        throw new Error(
          `Shortcut "${shortcut}" is already registered for the "${phase}" phase in the "${context}" context.`,
        );
      }
    }

    registry.set(context, bindings);
    phases.forEach((phase) => bindings.set(`${keys}|${phase}`, binding));

    return () => {
      for (const phase of phases) {
        // Leave it alone if someone registered the shortcut again in the meantime.
        if (bindings.get(`${keys}|${phase}`) === binding) bindings.delete(`${keys}|${phase}`);
      }
    };
  }

  function unlisten(shortcut: string, opts: UnlistenOptions = {}): void {
    const keys = parseShortcut(shortcut, mac);
    const bindings = registry.get(opts.context ?? defaultContext);

    for (const phase of toPhases(opts.phases ?? 'down')) {
      bindings?.delete(`${keys}|${phase}`);
    }
  }

  return {
    listen,
    unlisten,
    contexts: {
      activate(...names: string[]) {
        for (const name of names) {
          if (typeof name !== 'string' || name === '') {
            throw new Error('Context name has to be a non-empty string.');
          }
        }

        active = [...new Set(names)];
      },
      active: () => [...active],
      isActive: (name: string) => active.includes(name),
    },
    pressed: () => [...pressed].sort(),
    destroy,
  };
}
