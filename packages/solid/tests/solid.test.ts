import { createComponent, createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from 'shortcutter';
import {
  createPressedKeys,
  createSequence,
  createShortcut,
  ShortcutterContext,
  useShortcutter,
} from '../src/index';
import { keyboard } from '../../core/tests/keyboard';

function setup() {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });

  return { shortcutter, kb: keyboard(target) };
}

/** Runs `body` under a provider in a new root; returns the root's dispose function. */
function withProvider(shortcutter: ReturnType<typeof createShortcutter>, body: () => void) {
  return createRoot((dispose) => {
    createComponent(ShortcutterContext.Provider, {
      value: shortcutter,
      get children() {
        body();
        return null;
      },
    });
    return dispose;
  });
}

describe('solid adapter', () => {
  it('registers for the owner lifetime', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    const dispose = withProvider(shortcutter, () => createShortcut('Control+K', handler));

    kb.down('ControlLeft');
    kb.down('KeyK');
    kb.up('KeyK');
    kb.up('ControlLeft');
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    kb.down('ControlLeft');
    kb.down('KeyK');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('re-registers when accessors change', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    const [keys, setKeys] = createSignal('A');
    const [enabled, setEnabled] = createSignal(true);
    const dispose = withProvider(shortcutter, () =>
      createShortcut(keys, handler, () => ({ enabled: enabled() })),
    );

    setKeys('B');
    kb.press('KeyA');
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);

    setEnabled(false);
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('registers sequences for the owner lifetime', () => {
    const { shortcutter, kb } = setup();
    const handler = vi.fn();
    const dispose = withProvider(shortcutter, () => createSequence('G I', handler));

    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('exposes the provided instance', () => {
    const { shortcutter } = setup();
    let seen: unknown;

    withProvider(shortcutter, () => (seen = useShortcutter()))();

    expect(seen).toBe(shortcutter);
  });

  it('exposes the held keys as an accessor until disposed', () => {
    const { shortcutter, kb } = setup();
    let pressed: (() => string[]) | undefined;
    const dispose = withProvider(shortcutter, () => {
      pressed = createPressedKeys();
    });

    expect(pressed!()).toEqual([]);
    kb.down('ShiftLeft');
    kb.down('KeyW');
    expect(pressed!()).toEqual(['shift', 'w']);

    dispose();
    kb.up('KeyW');
    expect(pressed!()).toEqual(['shift', 'w']);
  });

  it('type-checks literal shortcuts and accepts accessors', () => {
    const compileOnly = () => {
      createShortcut('ControlOrMeta+K', () => {});
      createShortcut(
        () => 'Control+/',
        () => {},
      ); // accessors are not checked
      createSequence('G I', () => {});
      // @ts-expect-error -- typo
      createShortcut('Ctlr+K', () => {});
      // @ts-expect-error -- typo in a step
      createSequence('G Ctlr+I', () => {});
    };

    expect(compileOnly).toBeTypeOf('function');
  });
});
