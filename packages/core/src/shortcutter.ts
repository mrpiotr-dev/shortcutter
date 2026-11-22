import {
  MODIFIERS,
  combination,
  detectMac,
  isModifier,
  isModifierHeld,
  isTyping,
  isWildcard,
  keyFromCode,
  parseShortcutKeys,
  wildcardMatcher,
} from './keys';
import type {
  KeysListener,
  ListenOptions,
  Phase,
  PhaseListener,
  Phases,
  ShortcutHandler,
  ShortcutInfo,
  ShortcutsFilter,
  Shortcutter,
  ShortcutterOptions,
  UnlistenOptions,
} from './types';

/** One listen() call: what shortcuts() reports. */
type Registration = {
  shortcut: string;
  keys: string[];
  pattern: string;
  context: string;
  phases: Phase[];
  description?: string;
};

type Binding = {
  handler: ShortcutHandler;
  ignoreInputs: boolean;
  preventDefault: boolean;
  registration: Registration;
  /** Set for shortcuts with wildcard keys. */
  matches?: (pressed: readonly string[]) => boolean;
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
  const byKey = options.match === 'key';

  /** context → `${pattern}|${phase}` → binding (exact and wildcard shortcuts alike) */
  const registry = new Map<string, Map<string, Binding>>();
  /** context → wildcard bindings, checked when no exact shortcut matches */
  const wildcards = new Map<string, Set<Binding>>();
  const registrations = new Set<Registration>();
  const pressed = new Set<string>();
  /** `event.code` → the name it was pressed as, so its keyup releases the same name. */
  const names = new Map<string, string>();
  /** `match: 'key'`: the letter each physical key printed last time, for presses that print none. */
  const learned = new Map<string, string>();
  const subscribers = new Set<KeysListener>();
  const observers = new Set<PhaseListener>();
  let active: string[] = [defaultContext];

  /** Tells subscribers about a change of the held keys (`before` is the combination before it). */
  function notify(before: string, event: KeyboardEvent | Event): void {
    if (combination(pressed) === before) return;

    const keys = [...pressed].sort();

    for (const listener of subscribers) listener(keys, event);
  }

  function dispatch(keys: string, phase: Phase, event: KeyboardEvent | Event): void {
    if (keys === '') return;

    for (const observer of observers) observer(event, { phase, shortcut: keys });

    const typing = event.type.startsWith('key') && isTyping(event as KeyboardEvent);
    const held = keys.split('+');

    const run = (binding: Binding, context: string) => {
      if (typing && binding.ignoreInputs) return;
      if (binding.preventDefault) event.preventDefault();

      const { pattern, description } = binding.registration;

      binding.handler(event, { phase, shortcut: keys, pattern, context, description });
    };

    // activate() replaces `active`, so a handler switching contexts does not affect this loop.
    for (const context of active) {
      const exact = registry.get(context)?.get(`${keys}|${phase}`);

      if (exact) {
        run(exact, context);
        continue;
      }

      for (const binding of wildcards.get(context) ?? []) {
        if (binding.registration.phases.includes(phase) && binding.matches!(held)) {
          run(binding, context);
        }
      }
    }
  }

  /**
   * AltGr types characters (`@`, `ą`, `€`). Windows reports it as Control+Alt, so without this a
   * `Control+Alt+…` shortcut would fire while typing. macOS has no AltGr: Option is Alt there.
   */
  function isAltGraph(event: KeyboardEvent): boolean {
    return !mac && event.ctrlKey && event.altKey && event.getModifierState?.('AltGraph') === true;
  }

  /**
   * The canonical name of the key behind `event`: its physical position (`match: 'code'`), or the
   * Latin letter it prints (`match: 'key'`), see {@link ShortcutterOptions.match}.
   */
  function nameOf(event: KeyboardEvent): string {
    const physical = keyFromCode(event.code);

    if (!byKey || isModifier(physical)) return physical;

    const printed = event.key?.length === 1 ? event.key.toLowerCase() : '';

    if (/^[a-z]$/.test(printed)) {
      learned.set(event.code, printed);
      return printed;
    }

    const known = learned.get(event.code);

    if (known) return known;

    // Punctuation on a letter key (`,` where QWERTY has M, on AZERTY) must not take that letter's
    // name, because the letter is printed by another key. Other scripts keep the physical name.
    if (/^[a-z]$/.test(physical) && printed && !event.altKey && /[^\p{L}\p{M}]/u.test(printed)) {
      return printed;
    }

    return physical;
  }

  /**
   * Trusts the event's modifier flags over our own record: drops modifiers released where we could
   * not see it (keyup lost), and adds modifiers pressed before the page had focus (keydown lost).
   * Under AltGr, Control and Alt are not counted.
   */
  function syncModifiers(event: KeyboardEvent, key: string): void {
    const altGraph = isAltGraph(event);

    for (const modifier of MODIFIERS) {
      if (altGraph && (modifier === 'control' || modifier === 'alt')) pressed.delete(modifier);
      else if (modifier === key) continue;
      else if (isModifierHeld(event, modifier)) pressed.add(modifier);
      else pressed.delete(modifier);
    }
  }

  /** Forgets the names of keys that are no longer pressed. */
  function forget(): void {
    for (const [code, name] of names) {
      if (!pressed.has(name)) names.delete(code);
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    const key = names.get(event.code) ?? nameOf(event);

    if (!key) return;

    const before = combination(pressed);

    syncModifiers(event, key);

    if (isAltGraph(event) && (key === 'control' || key === 'alt')) {
      notify(before, event);
      return;
    }

    const previous = combination(pressed);

    if (pressed.has(key)) {
      notify(before, event);
      dispatch(previous, 'press', event);
      return;
    }

    pressed.add(key);
    names.set(event.code, key);
    notify(before, event);
    dispatch(previous, 'up', event);
    dispatch(combination(pressed), 'down', event);
  }

  function onKeyUp(event: KeyboardEvent): void {
    const key = names.get(event.code) ?? nameOf(event);
    const before = combination(pressed);

    syncModifiers(event, key);

    if (!pressed.has(key)) {
      notify(before, event);
      return;
    }

    const previous = combination(pressed);

    pressed.delete(key);

    // macOS sends no keyup for other keys while Meta is held, so they would stay "pressed".
    if (key === 'meta') {
      for (const other of pressed) {
        if (!isModifier(other)) pressed.delete(other);
      }
    }

    forget();
    notify(before, event);
    dispatch(previous, 'up', event);
  }

  /**
   * Releases every key when their keyups can no longer reach us: the window lost focus, the page is
   * being left (pagehide, also when it goes into the back/forward cache) or the tab was hidden.
   */
  function onRelease(event: Event): void {
    if (event.type === 'visibilitychange' && document.visibilityState !== 'hidden') return;

    const previous = combination(pressed);

    pressed.clear();
    names.clear();
    notify(previous, event);
    dispatch(previous, 'up', event);
  }

  const listeners = new AbortController();
  const listenerOptions: AddEventListenerOptions = { signal: listeners.signal };

  target?.addEventListener('keydown', onKeyDown as EventListener, listenerOptions);
  target?.addEventListener('keyup', onKeyUp as EventListener, listenerOptions);
  target?.addEventListener('blur', onRelease, listenerOptions);

  if (target && typeof window !== 'undefined') {
    window.addEventListener('pagehide', onRelease, listenerOptions);
    document.addEventListener('visibilitychange', onRelease, listenerOptions);
  }

  function destroy(): void {
    listeners.abort();
    pressed.clear();
    names.clear();
    subscribers.clear();
    observers.clear();
  }

  if (options.signal?.aborted) {
    destroy();
  } else {
    options.signal?.addEventListener('abort', destroy, listenerOptions);
  }

  function isPressed(shortcut: string): boolean {
    const keys = parseShortcutKeys(shortcut, mac);

    return keys.every((key) =>
      isWildcard(key)
        ? [...pressed].some((held) => wildcardMatcher([key])([held]))
        : pressed.has(key),
    );
  }

  /** Removes one phase of a binding, and the binding's registration once no phase is left. */
  function remove(context: string, key: string, phase: Phase, only?: Binding): void {
    const bindings = registry.get(context);
    const binding = bindings?.get(key);

    if (!binding || (only && binding !== only)) return;

    bindings!.delete(key);

    const registration = binding.registration;

    registration.phases = registration.phases.filter((other) => other !== phase);
    if (registration.phases.length === 0) {
      registrations.delete(registration);
      wildcards.get(context)?.delete(binding);
    }
  }

  function listen(shortcut: string, handler: ShortcutHandler, opts: ListenOptions = {}) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for shortcut "${shortcut}" has to be a function.`);
    }

    const keys = parseShortcutKeys(shortcut, mac);
    const pattern = combination(keys);
    const phases = toPhases(opts.phases ?? 'down');
    const context = opts.context ?? defaultContext;
    const bindings = registry.get(context) ?? new Map<string, Binding>();

    for (const phase of phases) {
      if (bindings.has(`${pattern}|${phase}`)) {
        throw new Error(
          `Shortcut "${shortcut}" is already registered for the "${phase}" phase in the "${context}" context.`,
        );
      }
    }

    const registration: Registration = {
      shortcut,
      keys,
      pattern,
      context,
      phases: [...phases],
      description: opts.description,
    };
    const binding: Binding = {
      handler,
      ignoreInputs: opts.ignoreInputs ?? ignoreInputs,
      preventDefault: opts.preventDefault ?? preventDefault,
      registration,
      matches: keys.some(isWildcard) ? wildcardMatcher(keys) : undefined,
    };

    registry.set(context, bindings);
    phases.forEach((phase) => bindings.set(`${pattern}|${phase}`, binding));
    registrations.add(registration);

    if (binding.matches) {
      const set = wildcards.get(context) ?? new Set<Binding>();

      wildcards.set(context, set.add(binding));
    }

    return () => {
      // `only`: leave it alone if someone registered the shortcut again in the meantime.
      for (const phase of phases) remove(context, `${pattern}|${phase}`, phase, binding);
    };
  }

  function unlisten(shortcut: string, opts: UnlistenOptions = {}): void {
    const pattern = combination(parseShortcutKeys(shortcut, mac));
    const context = opts.context ?? defaultContext;

    for (const phase of toPhases(opts.phases ?? 'down'))
      remove(context, `${pattern}|${phase}`, phase);
  }

  function shortcuts(filter: ShortcutsFilter = {}): ShortcutInfo[] {
    const list: ShortcutInfo[] = [];

    for (const { shortcut, keys, context, phases, description } of registrations) {
      const isActive = active.includes(context);

      if (filter.active !== undefined && filter.active !== isActive) continue;
      if (filter.context !== undefined && filter.context !== context) continue;

      list.push({
        shortcut,
        keys: [...keys],
        context,
        phases: [...phases],
        ...(description === undefined ? {} : { description }),
        active: isActive,
      });
    }

    return list;
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
    shortcuts,
    resolve: (shortcut: string) => parseShortcutKeys(shortcut, mac),
    isPressed,
    pressed: () => [...pressed].sort(),
    subscribe(listener: KeysListener) {
      if (typeof listener !== 'function') {
        throw new Error('Listener has to be a function.');
      }

      subscribers.add(listener);
      return () => void subscribers.delete(listener);
    },
    observe(listener: PhaseListener) {
      if (typeof listener !== 'function') {
        throw new Error('Listener has to be a function.');
      }

      observers.add(listener);
      return () => void observers.delete(listener);
    },
    destroy,
  };
}
