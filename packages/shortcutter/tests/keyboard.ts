/**
 * Simulates a keyboard the way browsers report it: modifier flags (ctrlKey, metaKey, …)
 * reflect the modifiers currently held.
 */
export function keyboard(target: EventTarget) {
  const held = new Set<string>();
  const modifierOf = (code: string) => /^(Control|Shift|Alt|Meta)(Left|Right)$/.exec(code)?.[1];
  const flags = () => ({
    altKey: held.has('Alt'),
    ctrlKey: held.has('Control'),
    metaKey: held.has('Meta'),
    shiftKey: held.has('Shift'),
  });

  function send(type: 'keydown' | 'keyup', code: string, init: KeyboardEventInit, on: EventTarget) {
    const event = new KeyboardEvent(type, {
      code,
      bubbles: true,
      cancelable: true,
      ...flags(),
      ...init,
    });

    on.dispatchEvent(event);
    return event;
  }

  return {
    down(code: string, init: KeyboardEventInit = {}, on: EventTarget = target) {
      const modifier = modifierOf(code);
      if (modifier) held.add(modifier);
      return send('keydown', code, init, on);
    },
    up(code: string, init: KeyboardEventInit = {}, on: EventTarget = target) {
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
