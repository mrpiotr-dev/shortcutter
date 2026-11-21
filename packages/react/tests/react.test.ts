import { act, createElement, StrictMode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from 'shortcutter';
import {
  ShortcutterProvider,
  usePressedKeys,
  useSequence,
  useShortcut,
  useShortcutter,
} from '../src/index';
import { keyboard } from '../../core/tests/keyboard';

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
});

function render(node: Parameters<Root['render']>[0]) {
  root = createRoot(document.createElement('div'));
  act(() => root!.render(createElement(StrictMode, null, node)));
}

function setup() {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });

  return { shortcutter, kb: keyboard(target) };
}

describe('react adapter', () => {
  it('registers while mounted and cleans up on unmount (StrictMode)', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    const App = () => {
      useShortcut('Control+K', handler);
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));
    kb.down('ControlLeft');
    kb.down('KeyK');
    kb.up('KeyK');
    kb.up('ControlLeft');
    expect(handler).toHaveBeenCalledTimes(1);

    act(() => root!.unmount());
    root = undefined;
    kb.down('ControlLeft');
    kb.down('KeyK');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls the latest handler without re-registering', () => {
    const { shortcutter, kb } = setup();
    const listen = vi.spyOn(shortcutter, 'listen');
    const seen: number[] = [];
    let increment!: () => void;
    const App = () => {
      const [count, setCount] = useState(0);
      increment = () => setCount((c) => c + 1);
      useShortcut('A', () => seen.push(count), { phases: ['down'] });
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));
    const registrations = listen.mock.calls.length;
    act(() => increment());
    act(() => increment());
    kb.press('KeyA');

    expect(seen).toEqual([2]);
    expect(listen.mock.calls.length).toBe(registrations);
  });

  it('follows enabled and shortcut changes', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    let update!: (next: { keys: string; enabled: boolean }) => void;
    const App = () => {
      const [state, setState] = useState({ keys: 'A', enabled: true });
      update = setState;
      useShortcut(state.keys, handler, { enabled: state.enabled });
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));
    act(() => update({ keys: 'B', enabled: true }));
    kb.press('KeyA');
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);

    act(() => update({ keys: 'B', enabled: false }));
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('registers the description for shortcuts()', () => {
    const { shortcutter } = setup();
    const App = () => {
      useShortcut('ControlOrMeta+K', () => {}, { description: 'Open the palette' });
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));

    expect(shortcutter.shortcuts()).toEqual([
      expect.objectContaining({ shortcut: 'ControlOrMeta+K', description: 'Open the palette' }),
    ]);
  });

  it('registers sequences while mounted', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    const App = () => {
      useSequence('G I', handler, { description: 'Inbox' });
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));
    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);

    act(() => root!.unmount());
    root = undefined;
    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('exposes the instance for switching contexts', () => {
    const { shortcutter } = setup();
    let seen: unknown;
    const App = () => {
      seen = useShortcutter();
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));

    expect(seen).toBe(shortcutter);
  });

  it('re-renders with the held keys', () => {
    const { shortcutter, kb } = setup();
    const renders: string[][] = [];
    const App = () => {
      renders.push(usePressedKeys());
      return null;
    };

    render(createElement(ShortcutterProvider, { shortcutter }, createElement(App)));
    act(() => void kb.down('ShiftLeft'));
    act(() => void kb.down('KeyW'));
    act(() => void kb.down('KeyW', { repeat: true })); // repeat: same keys, no re-render
    act(() => void kb.up('KeyW'));
    act(() => kb.blur());

    expect(renders[renders.length - 1]).toEqual([]);
    expect(renders.map((keys) => keys.join('+'))).toEqual(
      expect.arrayContaining(['shift', 'shift+w']),
    );
    // Same snapshot while the keys stay the same (StrictMode renders twice).
    const distinct = renders.filter((keys, i) => i === 0 || keys !== renders[i - 1]);
    expect(distinct.map((keys) => keys.join('+'))).toEqual(['', 'shift', 'shift+w', 'shift', '']);
  });

  it('falls back to a shared instance on window', () => {
    const handler = vi.fn();
    const App = () => {
      useShortcut('F2', handler);
      return null;
    };

    render(createElement(App));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'F2' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'F2' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('type-checks literal shortcuts', () => {
    const compileOnly = () => {
      useShortcut('ControlOrMeta+K', () => {});
      useSequence('G I', () => {});
      // @ts-expect-error -- typo
      useShortcut('Ctlr+K', () => {});
      // @ts-expect-error -- typo in a step
      useSequence('G Ctlr+I', () => {});
    };

    expect(compileOnly).toBeTypeOf('function');
  });
});
