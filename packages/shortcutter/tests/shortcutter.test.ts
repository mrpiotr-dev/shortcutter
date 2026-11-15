/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { describe, expect, it, vi } from 'vite-plus/test';
import { useShortcutter, type Phases } from '../src/index';

// Characterization tests: they pin the 0.2.0 runtime behavior (including its quirks)
// so the toolchain migration and later fixes can't change it silently.

function setup(phases: Phases, keys = ['a', 's']) {
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
    const { down, calls } = setup('down');

    down('KeyA');
    expect(calls()).toEqual([]);

    down('KeyS');
    expect(calls()).toEqual(['down']);
  });

  it('fires "press" on repeated keydown of the same combination', () => {
    const { down, calls } = setup('press');

    down('KeyA');
    down('KeyS');
    down('KeyS');
    down('KeyS');

    expect(calls()).toEqual(['press', 'press']);
  });

  it('fires "up" when a key of the combination is released', () => {
    const { down, up, calls } = setup('up');

    down('KeyA');
    down('KeyS');
    up('KeyS');

    expect(calls()).toEqual(['up']);
  });

  it('passes the original event to the callback', () => {
    const { down, callback } = setup('down', ['a']);

    down('KeyA');

    expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
  });

  it('fires "up" for the previous combination when another key joins it', () => {
    const { down, calls } = setup(['down', 'up'], ['a']);

    down('KeyA');
    down('KeyS');

    expect(calls()).toEqual(['down', 'up']);
  });

  it('re-fires "down" for the remaining combination after a key is released (0.2.0 quirk)', () => {
    const { down, up, calls } = setup(['down', 'up'], ['a']);

    down('KeyA');
    down('KeyS');
    up('KeyS');

    expect(calls()).toEqual(['down', 'up', 'down']);
  });

  it('fires "up" and releases all keys on blur', () => {
    const { down, blur, calls } = setup(['down', 'up']);

    down('KeyA');
    down('KeyS');
    blur();
    down('KeyA');

    expect(calls()).toEqual(['down', 'up']);
  });

  it('normalizes key order and event.code ("KeyA" -> "a")', () => {
    const { down, calls } = setup('down', ['s', 'A']);

    down('KeyS');
    down('KeyA');

    expect(calls()).toEqual(['down']);
  });

  it('uses lowercased event.code for non-letter keys', () => {
    const { down, calls } = setup('down', ['shiftleft', 'digit1']);

    down('ShiftLeft');
    down('Digit1');

    expect(calls()).toEqual(['down']);
  });

  it('stops firing after the returned unlisten function is called', () => {
    const { down, up, off, calls } = setup('down');

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

  describe('teardown', () => {
    it('stops firing after destroy()', () => {
      const { sc, down, calls } = setup('down', ['a']);

      sc.destroy();
      down('KeyA');

      expect(calls()).toEqual([]);
    });

    it('can be destroyed more than once', () => {
      const { sc } = setup('down');

      sc.destroy();
      expect(() => sc.destroy()).not.toThrow();
    });

    it('stops firing when the provided signal aborts', () => {
      const target = new EventTarget();
      const controller = new AbortController();
      const sc = useShortcutter({ eventTarget: target, signal: controller.signal });
      const callback = vi.fn();

      sc.listen('default', ['a'], callback, 'down');
      target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      target.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
      controller.abort();
      target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('never listens when the provided signal is already aborted', () => {
      const target = new EventTarget();
      const sc = useShortcutter({ eventTarget: target, signal: AbortSignal.abort() });
      const callback = vi.fn();

      sc.listen('default', ['a'], callback, 'down');
      target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('contexts', () => {
    it('only fires shortcuts from active contexts', () => {
      const target = new EventTarget();
      const sc = useShortcutter({ eventTarget: target });
      const inDefault = vi.fn();
      const inModal = vi.fn();

      sc.listen('default', ['a'], inDefault, 'down');
      sc.listen('modal', ['a'], inModal, 'down');

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

      sc.listen('default', ['a'], () => {}, 'down');

      expect(() => sc.listen('default', ['a'], () => {}, 'down')).toThrow(
        'Shortcut "a" is already added to "down" phase.',
      );
    });
  });
});
