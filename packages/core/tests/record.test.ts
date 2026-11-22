import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter, type ShortcutterOptions } from '../src/index';
import { RECORDING_CONTEXT, recordShortcut } from '../src/record';
import { keyboard } from './keyboard';
import { QWERTZ } from './layouts';

function setup(options: ShortcutterOptions = {}) {
  const target = new EventTarget();
  const sc = createShortcutter({ mac: false, ...options, target });
  const kb = keyboard(target, options.match === 'key' ? QWERTZ : undefined);

  return { sc, kb };
}

describe('recordShortcut', () => {
  it('resolves to the first combination with a non-modifier key', async () => {
    const { sc, kb } = setup();
    const recording = recordShortcut(sc);

    kb.down('ShiftLeft'); // modifiers alone are not recorded
    kb.down('ControlLeft');
    kb.down('KeyK');

    await expect(recording).resolves.toBe('ControlOrMeta+Shift+K');
  });

  it('records Meta as ControlOrMeta on macOS, and keeps Control as Control there', async () => {
    const { sc, kb } = setup({ mac: true });

    const withMeta = recordShortcut(sc);
    kb.down('MetaLeft');
    kb.down('KeyK');
    await expect(withMeta).resolves.toBe('ControlOrMeta+K');
    kb.up('KeyK');
    kb.up('MetaLeft');

    const withControl = recordShortcut(sc);
    kb.down('ControlLeft');
    kb.down('KeyK');
    await expect(withControl).resolves.toBe('Control+K');
  });

  it('keeps the exact modifier with controlOrMeta: false', async () => {
    const { sc, kb } = setup();
    const recording = recordShortcut(sc, { controlOrMeta: false });

    kb.down('ControlLeft');
    kb.down('Digit1');

    await expect(recording).resolves.toBe('Control+1');
  });

  it('names other keys after their code', async () => {
    const { sc, kb } = setup();
    const recording = recordShortcut(sc);

    kb.down('AltLeft');
    kb.down('ArrowUp');

    await expect(recording).resolves.toBe('Alt+ArrowUp');
  });

  it("records the printed letter with match: 'key'", async () => {
    const { sc, kb } = setup({ match: 'key' });
    const recording = recordShortcut(sc);

    kb.down('ControlLeft');
    kb.down('KeyY'); // prints z on QWERTZ

    await expect(recording).resolves.toBe('ControlOrMeta+Z');
  });

  it('cancels with Escape, or records Escape with cancelKey: null', async () => {
    const { sc, kb } = setup();

    const cancelled = recordShortcut(sc);
    kb.press('Escape');
    await expect(cancelled).resolves.toBeNull();

    const recorded = recordShortcut(sc, { cancelKey: null });
    kb.press('Escape');
    await expect(recorded).resolves.toBe('Escape');
  });

  it('cancels when the signal aborts, also before it starts', async () => {
    const { sc } = setup();
    const controller = new AbortController();
    const recording = recordShortcut(sc, { signal: controller.signal });

    controller.abort();
    await expect(recording).resolves.toBeNull();
    await expect(recordShortcut(sc, { signal: controller.signal })).resolves.toBeNull();
  });

  it('pauses other shortcuts and restores the active contexts', async () => {
    const { sc, kb } = setup();
    const handler = vi.fn();

    sc.listen('Control+K', handler);
    sc.contexts.activate('default', 'editor');

    const recording = recordShortcut(sc);
    expect(sc.contexts.active()).toEqual([RECORDING_CONTEXT]);

    kb.down('ControlLeft');
    kb.down('KeyK');
    await recording;
    expect(handler).not.toHaveBeenCalled();
    expect(sc.contexts.active()).toEqual([RECORDING_CONTEXT]); // keys still held

    kb.up('KeyK');
    kb.up('ControlLeft');
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
    expect(sc.contexts.active()).toEqual(['default', 'editor']);
  });

  it('prevents the default action of keys pressed while recording, unless told not to', async () => {
    const { sc, kb } = setup();

    const recording = recordShortcut(sc);
    const event = kb.down('KeyS');
    await recording;
    expect(event.defaultPrevented).toBe(true);
    kb.up('KeyS');

    const relaxed = recordShortcut(sc, { preventDefault: false });
    const other = kb.down('KeyS');
    await relaxed;
    expect(other.defaultPrevented).toBe(false);
  });

  it('reports the held keys while recording', async () => {
    const { sc, kb } = setup();
    const onKeys = vi.fn();
    const recording = recordShortcut(sc, { onKeys });

    kb.down('ShiftLeft');
    kb.down('KeyA');
    await recording;
    kb.up('KeyA');

    expect(onKeys.mock.calls.map(([keys]) => keys)).toEqual([['shift'], ['a', 'shift']]);
  });

  it('keeps the original contexts when a new recording starts before the last one restored them', async () => {
    const { sc, kb } = setup();
    const handler = vi.fn();

    sc.listen('Control+J', handler);

    const first = recordShortcut(sc);
    kb.down('ControlLeft');
    kb.down('KeyK');
    await first;
    kb.up('KeyK');
    kb.up('ControlLeft'); // restore is queued, not run yet

    const second = recordShortcut(sc);
    await Promise.resolve(); // the queued restore must not end the second recording's pause
    expect(sc.contexts.active()).toEqual([RECORDING_CONTEXT]);

    kb.down('ControlLeft');
    kb.down('KeyJ');
    await expect(second).resolves.toBe('ControlOrMeta+J');
    expect(handler).not.toHaveBeenCalled();

    kb.up('KeyJ');
    kb.up('ControlLeft');
    await Promise.resolve();
    expect(sc.contexts.active()).toEqual(['default']);
  });
});
