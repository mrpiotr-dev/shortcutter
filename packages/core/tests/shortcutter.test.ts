import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter, type ShortcutterOptions } from '../src/index';
import { keyboard } from './keyboard';

function setup(options: ShortcutterOptions = {}) {
  const target = options.target ?? new EventTarget();
  const sc = createShortcutter({ mac: false, ...options, target });
  const kb = keyboard(target);
  const handler = vi.fn();
  const phases = () => handler.mock.calls.map(([, detail]) => detail.phase as string);

  return { sc, kb, handler, phases, target };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createShortcutter', () => {
  describe('phases', () => {
    it('fires "down" once when the whole combination is pressed (default phase)', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('Control+K', handler);
      kb.down('ControlLeft');
      expect(phases()).toEqual([]);

      kb.down('KeyK');
      kb.down('KeyK', { repeat: true });
      kb.up('KeyK');

      expect(phases()).toEqual(['down']);
    });

    it('fires "press" on key repeat and "up" on release', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('A', handler, { phases: ['down', 'press', 'up'] });
      kb.down('KeyA');
      kb.down('KeyA', { repeat: true });
      kb.down('KeyA', { repeat: true });
      kb.up('KeyA');

      expect(phases()).toEqual(['down', 'press', 'press', 'up']);
    });

    it('fires "up" when another key joins the combination', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('A', handler, { phases: ['down', 'up'] });
      kb.down('KeyA');
      kb.down('KeyS');

      expect(phases()).toEqual(['down', 'up']);
    });

    it('does not fire "down" again for keys left after a release (0.2 did)', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('A', handler, { phases: ['down', 'up'] });
      kb.down('KeyA');
      kb.down('KeyS');
      kb.up('KeyS');

      expect(phases()).toEqual(['down', 'up']);
    });

    it('rejects unknown and empty phases', () => {
      const { sc, handler } = setup();

      // @ts-expect-error -- runtime guard for JS users and 0.2 strings
      expect(() => sc.listen('A', handler, { phases: 'down|up' })).toThrow(
        'Unknown phase "down|up"',
      );
      expect(() => sc.listen('A', handler, { phases: [] })).toThrow('At least one phase');
    });
  });

  describe('keys', () => {
    it('matches left and right modifiers alike', () => {
      const { sc, kb, handler } = setup();

      sc.listen('Shift+A', handler);
      kb.down('ShiftRight');
      kb.down('KeyA');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('maps ControlOrMeta to Control outside macOS', () => {
      const { sc, kb, handler } = setup({ mac: false });

      sc.listen('ControlOrMeta+K', handler);
      kb.down('MetaLeft');
      kb.down('KeyK');
      expect(handler).not.toHaveBeenCalled();

      kb.up('KeyK');
      kb.up('MetaLeft');
      kb.down('ControlLeft');
      kb.down('KeyK');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('maps ControlOrMeta to Meta on macOS', () => {
      const { sc, kb, handler } = setup({ mac: true });

      sc.listen('ControlOrMeta+K', handler);
      kb.down('MetaLeft');
      kb.down('KeyK');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('passes the event and details to the handler', () => {
      const { sc, kb, handler } = setup();

      sc.listen('Shift+Digit1', handler, { context: 'default' });
      kb.down('ShiftLeft');
      const event = kb.down('Digit1');

      expect(handler).toHaveBeenCalledWith(event, {
        phase: 'down',
        shortcut: '1+shift',
        context: 'default',
      });
    });

    it('reports pressed keys', () => {
      const { sc, kb } = setup();

      kb.down('ShiftLeft');
      kb.down('KeyA');

      expect(sc.pressed()).toEqual(['a', 'shift']);
    });

    it('recovers when macOS swallows keyups while Meta is held', () => {
      const { sc, kb, handler } = setup({ mac: true });

      sc.listen('K', handler);
      kb.down('MetaLeft');
      kb.down('KeyK');
      kb.up('MetaLeft'); // no keyup for K arrives on macOS
      kb.down('KeyK');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(sc.pressed()).toEqual(['k']);
    });

    it('counts a modifier whose keydown was lost (e.g. held before the page had focus)', () => {
      const { sc, kb, handler } = setup({ mac: true });

      sc.listen('ControlOrMeta+K', handler);
      kb.down('KeyK', { metaKey: true }); // no MetaLeft keydown before it

      expect(handler).toHaveBeenCalledTimes(1);
      expect(sc.pressed()).toEqual(['k', 'meta']);
    });

    it('drops a modifier whose keyup was lost (e.g. released in another window)', () => {
      const { sc, kb, handler } = setup();

      sc.listen('K', handler);
      kb.down('ControlLeft');
      kb.lose('ControlLeft'); // released without a keyup reaching us
      kb.down('KeyK');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('reports the held keys whenever they change', () => {
      const { sc, kb } = setup();
      const seen: string[][] = [];

      sc.subscribe((keys) => seen.push(keys));
      kb.down('ShiftLeft');
      kb.down('KeyA');
      kb.down('KeyA', { repeat: true }); // no change: not reported
      kb.up('KeyA');
      kb.up('ShiftLeft');

      expect(seen).toEqual([['shift'], ['a', 'shift'], ['shift'], []]);
    });

    it('reports keys released by blur and passes the event', () => {
      const { sc, kb } = setup();
      const listener = vi.fn();

      kb.down('KeyA');
      sc.subscribe(listener);
      kb.blur();

      expect(listener).toHaveBeenCalledWith([], expect.objectContaining({ type: 'blur' }));
    });

    it('stops after unsubscribing or destroy()', () => {
      const { sc, kb } = setup();
      const first = vi.fn();
      const second = vi.fn();

      sc.subscribe(first)();
      sc.subscribe(second);
      sc.destroy();
      kb.down('KeyA');

      expect(first).not.toHaveBeenCalled();
      expect(second).not.toHaveBeenCalled();
    });

    it('requires a function', () => {
      const { sc } = setup();

      // @ts-expect-error -- runtime guard
      expect(() => sc.subscribe()).toThrow('has to be a function');
    });
  });

  describe('leaving the page', () => {
    it('releases all keys and fires "up" on pagehide (e.g. a shortcut navigated away)', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('D', handler, { phases: ['down', 'up'] });
      kb.down('KeyD');
      window.dispatchEvent(new Event('pagehide'));

      expect(phases()).toEqual(['down', 'up']);
      expect(sc.pressed()).toEqual([]);
    });

    it('releases all keys when the tab is hidden', () => {
      const { sc, kb } = setup();
      const visibility = vi.spyOn(document, 'visibilityState', 'get');

      kb.down('KeyA');
      visibility.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(sc.pressed()).toEqual(['a']);

      visibility.mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(sc.pressed()).toEqual([]);
      visibility.mockRestore();
    });
  });

  describe('blur', () => {
    it('fires "up" and releases all keys', () => {
      const { sc, kb, handler, phases } = setup();

      sc.listen('A+S', handler, { phases: ['down', 'up'] });
      kb.down('KeyA');
      kb.down('KeyS');
      kb.blur();

      expect(phases()).toEqual(['down', 'up']);
      expect(sc.pressed()).toEqual([]);
    });
  });

  describe('registration', () => {
    it('throws when the same shortcut is registered twice for a phase in one context', () => {
      const { sc } = setup();

      sc.listen('Control+K', () => {});

      expect(() => sc.listen('k+ctrl', () => {})).toThrow(
        'Shortcut "k+ctrl" is already registered for the "down" phase in the "default" context.',
      );
      expect(() => sc.listen('Control+K', () => {}, { phases: 'up' })).not.toThrow();
      expect(() => sc.listen('Control+K', () => {}, { context: 'modal' })).not.toThrow();
    });

    it('does not register anything when one of the phases is taken', () => {
      const { sc, kb, handler } = setup();

      sc.listen('A', () => {}, { phases: 'up' });
      expect(() => sc.listen('A', handler, { phases: ['down', 'up'] })).toThrow();

      kb.down('KeyA');
      expect(handler).not.toHaveBeenCalled();
    });

    it('requires a handler function', () => {
      const { sc } = setup();

      // @ts-expect-error -- runtime guard
      expect(() => sc.listen('A')).toThrow('has to be a function');
    });

    it('removes the shortcut with the returned function, which is safe to call twice', () => {
      const { sc, kb, handler } = setup();
      const off = sc.listen('A', handler);

      off();
      off();
      kb.down('KeyA');

      expect(handler).not.toHaveBeenCalled();
    });

    it('does not remove a shortcut registered again after the first one', () => {
      const { sc, kb, handler } = setup();
      const off = sc.listen('A', () => {});

      sc.unlisten('A');
      sc.listen('A', handler);
      off();
      kb.down('KeyA');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('unlisten() ignores unknown shortcuts and contexts', () => {
      const { sc } = setup();

      expect(() => sc.unlisten('A', { context: 'nope' })).not.toThrow();
    });
  });

  describe('contexts', () => {
    it('runs shortcuts from active contexts only, in activation order', () => {
      const { sc, kb } = setup();
      const calls: string[] = [];

      sc.listen('A', () => calls.push('default'));
      sc.listen('A', () => calls.push('modal'), { context: 'modal' });
      sc.listen('A', () => calls.push('editor'), { context: 'editor' });

      kb.press('KeyA');
      sc.contexts.activate('modal', 'default');
      kb.press('KeyA');

      expect(calls).toEqual(['default', 'modal', 'default']);
    });

    it('reports and checks active contexts', () => {
      const { sc } = setup({ defaultContext: 'main' });

      expect(sc.contexts.active()).toEqual(['main']);
      sc.contexts.activate('modal', 'later', 'modal');
      expect(sc.contexts.active()).toEqual(['modal', 'later']);
      expect(sc.contexts.isActive('later')).toBe(true);
      expect(sc.contexts.isActive('main')).toBe(false);
    });

    it('rejects empty context names', () => {
      const { sc } = setup();

      expect(() => sc.contexts.activate('')).toThrow('non-empty string');
    });
  });

  describe('inputs', () => {
    function inDocument(element: HTMLElement) {
      document.body.append(element);
      return setup({ target: document });
    }

    it.each([
      ['input', () => document.createElement('input')],
      ['textarea', () => document.createElement('textarea')],
      ['select', () => document.createElement('select')],
      [
        'contenteditable',
        () => {
          const div = document.createElement('div');
          div.contentEditable = 'true';
          return div;
        },
      ],
    ])('ignores shortcuts while typing in %s', (_name, create) => {
      const element = create();
      const { sc, kb, handler } = inDocument(element);

      sc.listen('A', handler);
      kb.down('KeyA', {}, element);

      expect(handler).not.toHaveBeenCalled();
    });

    it('can allow a shortcut inside inputs', () => {
      const input = document.createElement('input');
      const { sc, kb, handler } = inDocument(input);

      sc.listen('Escape', handler, { ignoreInputs: false });
      kb.down('Escape', {}, input);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('can disable the guard globally', () => {
      const input = document.createElement('input');
      document.body.append(input);
      const { sc, kb, handler } = setup({ target: document, ignoreInputs: false });

      sc.listen('A', handler);
      kb.down('KeyA', {}, input);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('ignores shortcuts during IME composition', () => {
      const { sc, kb, handler } = setup();

      sc.listen('A', handler);
      kb.down('KeyA', { isComposing: true });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('preventDefault', () => {
    it('is off by default', () => {
      const { sc, kb } = setup();

      sc.listen('A', () => {});

      expect(kb.down('KeyA').defaultPrevented).toBe(false);
    });

    it('can be enabled globally or per shortcut', () => {
      const global = setup({ preventDefault: true });
      global.sc.listen('A', () => {});
      global.sc.listen('B', () => {}, { preventDefault: false });

      expect(global.kb.down('KeyA').defaultPrevented).toBe(true);
      expect(global.kb.down('KeyB').defaultPrevented).toBe(false);

      const local = setup();
      local.sc.listen('A', () => {}, { preventDefault: true });

      expect(local.kb.down('KeyA').defaultPrevented).toBe(true);
    });

    it('leaves unmatched keys alone', () => {
      const { sc, kb } = setup({ preventDefault: true });

      sc.listen('A', () => {});

      expect(kb.down('KeyB').defaultPrevented).toBe(false);
    });
  });

  describe('teardown', () => {
    it('stops firing after destroy(), which is safe to call twice', () => {
      const { sc, kb, handler } = setup();

      sc.listen('A', handler);
      sc.destroy();
      sc.destroy();
      kb.down('KeyA');

      expect(handler).not.toHaveBeenCalled();
    });

    it('stops firing when the signal aborts', () => {
      const controller = new AbortController();
      const { sc, kb, handler } = setup({ signal: controller.signal });

      sc.listen('A', handler);
      kb.press('KeyA');
      controller.abort();
      kb.press('KeyA');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('never listens when the signal is already aborted', () => {
      const { sc, kb, handler } = setup({ signal: AbortSignal.abort() });

      sc.listen('A', handler);
      kb.down('KeyA');

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
