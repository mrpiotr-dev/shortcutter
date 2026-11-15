import { createComponent, createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from 'shortcutter';
import { createShortcut, ShortcutterContext, useShortcutter } from '../src/index';
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

  it('exposes the provided instance', () => {
    const { shortcutter } = setup();
    let seen: unknown;

    withProvider(shortcutter, () => (seen = useShortcutter()))();

    expect(seen).toBe(shortcutter);
  });
});
