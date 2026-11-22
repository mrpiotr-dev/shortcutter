import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter, type ShortcutterOptions } from '../src/index';
import { keyboard } from './keyboard';
import { AZERTY, DVORAK, QWERTY, QWERTZ, RUSSIAN, type Layout } from './layouts';

function setup(layout: Layout, options: ShortcutterOptions = {}) {
  const target = new EventTarget();
  const sc = createShortcutter({ mac: false, ...options, target });
  const kb = keyboard(target, layout);

  /** Presses `codes` in order, then releases them in reverse. Returns nothing. */
  const chord = (...codes: string[]) => {
    for (const code of codes) kb.down(code);
    for (const code of [...codes].reverse()) kb.up(code);
  };

  return { sc, kb, chord };
}

describe("match: 'code' (default): physical keys", () => {
  it.each([
    ['QWERTY', QWERTY],
    ['QWERTZ', QWERTZ],
    ['AZERTY', AZERTY],
    ['Russian', RUSSIAN],
    ['Dvorak', DVORAK],
  ])('fires Control+Z on the key at the QWERTY Z position on %s', (_name, layout) => {
    const { sc, chord } = setup(layout);
    const handler = vi.fn();

    sc.listen('Control+Z', handler);
    chord('ControlLeft', 'KeyZ');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('keeps WASD in place on AZERTY, where those keys print Z, Q, S, D', () => {
    const { sc, chord } = setup(AZERTY);
    const handler = vi.fn();

    sc.listen('W', handler);
    chord('KeyW');

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]![1].shortcut).toBe('w');
  });
});

describe("match: 'key': printed letters", () => {
  it('fires Control+Z on the key labelled Z on QWERTZ, and not on the one labelled Y', () => {
    const { sc, chord } = setup(QWERTZ, { match: 'key' });
    const handler = vi.fn();

    sc.listen('Control+Z', handler);
    chord('ControlLeft', 'KeyZ'); // prints y
    expect(handler).not.toHaveBeenCalled();

    chord('ControlLeft', 'KeyY'); // prints z
    expect(handler).toHaveBeenCalledOnce();
  });

  it('follows AZERTY letters, including M on the semicolon key', () => {
    const { sc, chord } = setup(AZERTY, { match: 'key' });
    const selectAll = vi.fn();
    const m = vi.fn();

    sc.listen('Control+A', selectAll);
    sc.listen('M', m);

    chord('ControlLeft', 'KeyQ'); // prints a
    chord('Semicolon'); // prints m
    chord('KeyM'); // prints a comma: not M

    expect(selectAll).toHaveBeenCalledOnce();
    expect(m).toHaveBeenCalledOnce();
  });

  it('keeps digits physical on AZERTY, where the digit row prints symbols', () => {
    const { sc, chord } = setup(AZERTY, { match: 'key' });
    const handler = vi.fn();

    sc.listen('Control+1', handler);
    chord('ControlLeft', 'Digit1'); // prints &

    expect(handler).toHaveBeenCalledOnce();
  });

  it('follows Dvorak letters', () => {
    const { sc, chord } = setup(DVORAK, { match: 'key' });
    const handler = vi.fn();

    sc.listen('Control+K', handler);
    chord('ControlLeft', 'KeyK'); // prints t
    expect(handler).not.toHaveBeenCalled();

    chord('ControlLeft', 'KeyV'); // prints k
    expect(handler).toHaveBeenCalledOnce();
  });

  it('falls back to the physical key on a Cyrillic layout, so Control+C still copies', () => {
    const { sc, chord } = setup(RUSSIAN, { match: 'key' });
    const handler = vi.fn();

    sc.listen('Control+C', handler);
    chord('ControlLeft', 'KeyC'); // prints с (Cyrillic)

    expect(handler).toHaveBeenCalledOnce();
  });

  it('matches Shift+letter, where the printed letter is upper case', () => {
    const { sc, chord } = setup(QWERTZ, { match: 'key' });
    const handler = vi.fn();

    sc.listen('Shift+Z', handler);
    chord('ShiftLeft', 'KeyY'); // prints Z

    expect(handler).toHaveBeenCalledOnce();
  });

  it('reports printed names in pressed() and releases them on keyup', () => {
    const { sc, kb } = setup(QWERTZ, { match: 'key' });

    kb.down('ControlLeft');
    kb.down('KeyY');
    expect(sc.pressed()).toEqual(['control', 'z']);

    kb.up('ControlLeft');
    kb.up('KeyY');
    expect(sc.pressed()).toEqual([]);
  });

  it('releases a key by the name it was pressed with, even if it prints something else on keyup', () => {
    const { sc, kb } = setup(QWERTY, { match: 'key' });

    kb.down('KeyA');
    kb.up('KeyA', { key: 'ą' });

    expect(sc.pressed()).toEqual([]);
  });

  it('uses the letter a key printed before when a modifier makes it print none (Option on macOS)', () => {
    const { sc, kb, chord } = setup(QWERTZ, { match: 'key', mac: true });
    const handler = vi.fn();

    sc.listen('Alt+Z', handler);
    chord('KeyY'); // prints z: learned
    kb.down('AltLeft');
    kb.down('KeyY', { key: 'Ω' });
    kb.up('KeyY', { key: 'Ω' });
    kb.up('AltLeft');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses the physical key for dead keys', () => {
    const { sc, kb } = setup(QWERTY, { match: 'key' });

    kb.down('BracketLeft', { key: 'Dead' });
    expect(sc.pressed()).toEqual(['bracketleft']);
  });
});

describe('AltGr', () => {
  /** AltGr as Windows reports it: ControlLeft first, then AltRight, both flagged as AltGraph. */
  function altGr(kb: ReturnType<typeof keyboard>, code: string, key: string) {
    kb.down('ControlLeft');
    kb.down('AltRight', { altGraph: true });
    kb.down(code, { key, altGraph: true });
    kb.up(code, { key, altGraph: true });
    kb.up('AltRight', { altGraph: true });
    kb.up('ControlLeft');
  }

  it.each([['code' as const], ['key' as const]])(
    'does not fire Control+Alt shortcuts while typing with AltGr (match: %s)',
    (match) => {
      const { sc, kb } = setup(QWERTY, { match });
      const handler = vi.fn();

      sc.listen('Control+Alt+A', handler);
      altGr(kb, 'KeyA', 'ą'); // Polish programmer layout

      expect(handler).not.toHaveBeenCalled();
      expect(sc.pressed()).toEqual([]);
    },
  );

  it('still fires Control+Alt shortcuts pressed with the left Alt key', () => {
    const { sc, chord } = setup(QWERTY);
    const handler = vi.fn();

    sc.listen('Control+Alt+A', handler);
    chord('ControlLeft', 'AltLeft', 'KeyA');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('is not applied on macOS, where Option is Alt', () => {
    const { sc, kb } = setup(QWERTY, { mac: true });
    const handler = vi.fn();

    sc.listen('Control+Alt+A', handler);
    kb.down('ControlLeft');
    kb.down('AltLeft', { altGraph: true });
    kb.down('KeyA', { altGraph: true });

    expect(handler).toHaveBeenCalledOnce();
  });
});
