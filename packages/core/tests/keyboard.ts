import type { Layout } from './layouts';

/** Extra fields on top of `KeyboardEventInit`: `altGraph` sets `getModifierState('AltGraph')`. */
type Init = KeyboardEventInit & { altGraph?: boolean };

/**
 * Simulates a keyboard the way browsers report it: modifier flags (ctrlKey, metaKey, …)
 * reflect the modifiers currently held. With a `layout`, `event.key` is the character that layout
 * prints for the physical key (`event.code`), shifted while Shift is held.
 */
export function keyboard(target: EventTarget, layout?: Layout) {
  const held = new Set<string>();
  const modifierOf = (code: string) => /^(Control|Shift|Alt|Meta)(Left|Right)$/.exec(code)?.[1];
  const flags = () => ({
    altKey: held.has('Alt'),
    ctrlKey: held.has('Control'),
    metaKey: held.has('Meta'),
    shiftKey: held.has('Shift'),
  });

  function send(type: 'keydown' | 'keyup', code: string, init: Init, on: EventTarget) {
    const { altGraph = false, ...rest } = init;
    const printed = layout?.[code]?.[held.has('Shift') ? 1 : 0];
    const event = new KeyboardEvent(type, {
      code,
      bubbles: true,
      cancelable: true,
      ...(printed === undefined ? {} : { key: printed }),
      ...flags(),
      ...rest,
    });

    // happy-dom reports AltGraph whenever Alt is held; browsers only do for the real AltGr key.
    Object.defineProperty(event, 'getModifierState', {
      value: (name: string) =>
        name === 'AltGraph'
          ? altGraph
          : ((
              {
                Alt: event.altKey,
                Control: event.ctrlKey,
                Meta: event.metaKey,
                Shift: event.shiftKey,
              } as Record<string, boolean>
            )[name] ?? false),
    });

    on.dispatchEvent(event);
    return event;
  }

  return {
    down(code: string, init: Init = {}, on: EventTarget = target) {
      const modifier = modifierOf(code);
      if (modifier) held.add(modifier);
      return send('keydown', code, init, on);
    },
    up(code: string, init: Init = {}, on: EventTarget = target) {
      const modifier = modifierOf(code);
      if (modifier) held.delete(modifier);
      return send('keyup', code, init, on);
    },
    /** keydown followed by keyup. */
    press(code: string) {
      this.down(code);
      this.up(code);
    },
    /** Releases a key without sending keyup, like when it is released outside the page. */
    lose(code: string) {
      const modifier = modifierOf(code);
      if (modifier) held.delete(modifier);
    },
    blur() {
      target.dispatchEvent(new FocusEvent('blur'));
    },
  };
}
