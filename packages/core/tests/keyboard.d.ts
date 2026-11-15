/**
 * Simulates a keyboard the way browsers report it: modifier flags (ctrlKey, metaKey, …)
 * reflect the modifiers currently held.
 */
export declare function keyboard(target: EventTarget): {
  down(code: string, init?: KeyboardEventInit, on?: EventTarget): KeyboardEvent;
  up(code: string, init?: KeyboardEventInit, on?: EventTarget): KeyboardEvent;
  /** keydown followed by keyup. */
  press(code: string): void;
  /** Releases a key without sending keyup, like when it is released outside the page. */
  lose(code: string): void;
  blur(): void;
};
