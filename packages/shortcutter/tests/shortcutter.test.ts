/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { describe, expect, it, vi } from 'vite-plus/test';
import { PHASES, useShortcutter } from '../src/index';

// Characterization tests: they pin the 0.2.0 runtime behavior (including its quirks)
// so the toolchain migration and later fixes can't change it silently.

function setup(phases: PHASES, keys = ['a', 's']) {
  const target = new EventTarget();
  const sc = useShortcutter({ eventTarget: target });
  const callback = vi.fn();
  const off = sc.listen('default', keys, callback, phases);

  const down = (code: string) => target.dispatchEvent(new KeyboardEvent('keydown', { code }));
  const up = (code: string) => target.dispatchEvent(new KeyboardEvent('keyup', { code }));
  const blur = () => target.dispatchEvent(new FocusEvent('blur'));
  const calls = () => callback.mock.calls.map(([, phase]) => phase as string);

  return { sc, target, callback, off, down, up, blur, calls };
}

describe('useShortcutter', () => {
  it('fires "down" when the exact combination becomes pressed', () => {
    const { down, calls } = setup(PHASES.DOWN);

    down('KeyA');
    expect(calls()).toEqual([]);

    down('KeyS');
    expect(calls()).toEqual(['down']);
  });

  it('fires "press" on repeated keydown of the same combination', () => {
    const { down, calls } = setup(PHASES.PRESS);

    down('KeyA');
    down('KeyS');
    down('KeyS');
    down('KeyS');

    expect(calls()).toEqual(['press', 'press']);
  });

  it('fires "up" when a key of the combination is released', () => {
    const { down, up, calls } = setup(PHASES.UP);

    down('KeyA');
    down('KeyS');
    up('KeyS');

    expect(calls()).toEqual(['up']);
  });

  it('passes the original event to the callback', () => {
    const { down, callback } = setup(PHASES.DOWN, ['a']);

    down('KeyA');

    expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
  });

  it('fires "up" for the previous combination when another key joins it', () => {
    const { down, calls } = setup(PHASES.DOWN_UP, ['a']);

    down('KeyA');
    down('KeyS');

    expect(calls()).toEqual(['down', 'up']);
  });

  it('re-fires "down" for the remaining combination after a key is released (0.2.0 quirk)', () => {
    const { down, up, calls } = setup(PHASES.DOWN_UP, ['a']);

    down('KeyA');
    down('KeyS');
    up('KeyS');

    expect(calls()).toEqual(['down', 'up', 'down']);
  });

  it('fires "up" and releases all keys on blur', () => {
    const { down, blur, calls } = setup(PHASES.DOWN_UP);

    down('KeyA');
    down('KeyS');
    blur();
    down('KeyA');

    expect(calls()).toEqual(['down', 'up']);
  });

  it('normalizes key order and event.code ("KeyA" -> "a")', () => {
    const { down, calls } = setup(PHASES.DOWN, ['s', 'A']);

    down('KeyS');
    down('KeyA');

    expect(calls()).toEqual(['down']);
  });

  it('uses lowercased event.code for non-letter keys', () => {
    const { down, calls } = setup(PHASES.DOWN, ['shiftleft', 'digit1']);

    down('ShiftLeft');
    down('Digit1');

    expect(calls()).toEqual(['down']);
  });

  it('stops firing after the returned unlisten function is called', () => {
    const { down, up, off, calls } = setup(PHASES.DOWN);

    off();
    down('KeyA');
    down('KeyS');
    up('KeyS');

    expect(calls()).toEqual([]);
  });

  it('defaults to "down|press" phases', () => {
    const target = new EventTarget();
    const sc = useShortcutter({ eventTarget: target });
    const callback = vi.fn();

    sc.listen('default', ['a'], callback);
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    target.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));

    expect(callback.mock.calls.map(([, phase]) => phase as string)).toEqual(['down', 'press']);
  });

  describe('contexts', () => {
    it('only fires shortcuts from active contexts', () => {
      const target = new EventTarget();
      const sc = useShortcutter({ eventTarget: target });
      const inDefault = vi.fn();
      const inModal = vi.fn();

      sc.listen('default', ['a'], inDefault, PHASES.DOWN);
      sc.listen('modal', ['a'], inModal, PHASES.DOWN);

      target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      target.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
      sc.setActiveContext('modal');
      target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

      expect(inDefault).toHaveBeenCalledTimes(1);
      expect(inModal).toHaveBeenCalledTimes(1);
    });

    it('auto-creates contexts on listen and exposes them via hasContext', () => {
      const sc = useShortcutter({ eventTarget: new EventTarget() });

      expect(sc.hasContext('editor')).toBe(false);
      sc.listen('editor', ['a'], () => {});
      expect(sc.hasContext('editor')).toBe(true);
    });

    it('returns active contexts as an array', () => {
      const sc = useShortcutter({ eventTarget: new EventTarget(), defaultContext: 'main' });

      expect(sc.getActiveContext()).toEqual(['main']);
    });

    it('throws when activating an unknown context', () => {
      const sc = useShortcutter({ eventTarget: new EventTarget() });

      expect(() => sc.setActiveContext('nope')).toThrow("Context 'nope' is not added.");
    });

    it('throws when registering the same shortcut twice in one phase', () => {
      const sc = useShortcutter({ eventTarget: new EventTarget() });

      sc.listen('default', ['a'], () => {}, PHASES.DOWN);

      expect(() => sc.listen('default', ['a'], () => {}, PHASES.DOWN)).toThrow(
        'Shortcut "a" is already added to "down" phase.',
      );
    });
  });
});
