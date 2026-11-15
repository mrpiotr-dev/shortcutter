import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from '../src/index';
import { createSequences } from '../src/sequences';
import { keyboard } from './keyboard';

function setup(timeout?: number) {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });
  const sequences = createSequences(shortcutter, { timeout });

  return { shortcutter, sequences, kb: keyboard(target), handler: vi.fn() };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('createSequences', () => {
  it('runs when the steps are pressed in order', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('G I', handler, { description: 'Go to the inbox' });
    kb.press('KeyG');
    expect(handler).not.toHaveBeenCalled();
    kb.press('KeyI');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![1]).toEqual({
      sequence: 'G I',
      context: 'default',
      description: 'Go to the inbox',
    });
  });

  it('ignores the wrong order and other keys in between', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('G I', handler);
    kb.press('KeyI');
    kb.press('KeyG');
    kb.press('KeyX');
    kb.press('KeyI');

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports modifiers in steps, without counting the modifier alone as a step', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('G Shift+P', handler);
    kb.press('KeyG');
    kb.down('ShiftLeft');
    kb.press('KeyP');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports wildcard steps and repeated keys', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('ArrowUp ArrowUp Digit*', handler);
    kb.press('ArrowUp');
    kb.press('ArrowUp');
    kb.press('Digit7');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('forgets steps older than the timeout', () => {
    vi.useFakeTimers();
    const { sequences, kb, handler } = setup(500);

    sequences.listen('G I', handler);
    kb.press('KeyG');
    vi.advanceTimersByTime(600);
    kb.press('KeyI');
    expect(handler).not.toHaveBeenCalled();

    kb.press('KeyG');
    vi.advanceTimersByTime(400);
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('starts over after a match', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('G G', handler);
    kb.press('KeyG');
    kb.press('KeyG');
    kb.press('KeyG');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('only runs in active contexts', () => {
    const { shortcutter, sequences, kb, handler } = setup();

    sequences.listen('G I', handler, { context: 'mail' });
    kb.press('KeyG');
    kb.press('KeyI');
    shortcutter.contexts.activate('mail');
    kb.press('KeyG');
    kb.press('KeyI');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores typing in fields unless asked, and can prevent the default action', () => {
    const input = document.createElement('input');
    document.body.append(input);
    const shortcutter = createShortcutter({ target: document, mac: false });
    const sequences = createSequences(shortcutter);
    const kb = keyboard(document);
    const ignored = vi.fn();
    const allowed = vi.fn();

    sequences.listen('G I', ignored);
    sequences.listen('G O', allowed, { ignoreInputs: false, preventDefault: true });
    kb.down('KeyG', {}, input);
    kb.up('KeyG', {}, input);
    kb.down('KeyI', {}, input);
    kb.up('KeyI', {}, input);
    kb.down('KeyG', {}, input);
    kb.up('KeyG', {}, input);
    const last = kb.down('KeyO', {}, input);

    expect(ignored).not.toHaveBeenCalled();
    expect(allowed).toHaveBeenCalledTimes(1);
    expect(last.defaultPrevented).toBe(true);
  });

  it('lists sequences with platform keys and drops removed ones', () => {
    const target = new EventTarget();
    const sequences = createSequences(createShortcutter({ target, mac: true }));
    const off = sequences.listen('G I', () => {}, { description: 'Inbox' });

    sequences.listen('ControlOrMeta+K ControlOrMeta+S', () => {}, { context: 'editor' });

    expect(sequences.sequences()).toEqual([
      {
        sequence: 'G I',
        steps: [['g'], ['i']],
        context: 'default',
        description: 'Inbox',
        active: true,
      },
      {
        sequence: 'ControlOrMeta+K ControlOrMeta+S',
        steps: [
          ['meta', 'k'],
          ['meta', 's'],
        ],
        context: 'editor',
        active: false,
      },
    ]);
    expect(sequences.sequences({ active: true })).toHaveLength(1);

    off();
    expect(sequences.sequences().map((info) => info.sequence)).toEqual([
      'ControlOrMeta+K ControlOrMeta+S',
    ]);
  });

  it('validates sequences and handlers', () => {
    const { sequences } = setup();

    sequences.listen('G I', () => {});
    expect(() => sequences.listen('g  i', () => {})).toThrow('already registered');
    expect(() => sequences.listen('G', () => {})).toThrow('at least two steps');
    // @ts-expect-error -- runtime guard
    expect(() => sequences.listen('G I')).toThrow('has to be a function');
  });

  it('stops after destroy()', () => {
    const { sequences, kb, handler } = setup();

    sequences.listen('G I', handler);
    sequences.destroy();
    kb.press('KeyG');
    kb.press('KeyI');

    expect(handler).not.toHaveBeenCalled();
    expect(sequences.sequences()).toEqual([]);
  });
});
