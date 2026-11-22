import { createComponent, createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from 'shortcutter';
import { createKeymap } from 'shortcutter/keymap';
import {
  createKeymapCommands,
  createPressedKeys,
  createRecorder,
  createSequence,
  createShortcut,
  createShortcuts,
  ShortcutterContext,
  useShortcutter,
  type Recorder,
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

  it('createShortcuts follows shortcuts and contexts', () => {
    const { shortcutter } = setup();
    let shortcuts: (() => { shortcut: string }[]) | undefined;
    const dispose = withProvider(
      shortcutter,
      () => (shortcuts = createShortcuts({ active: true })),
    );

    shortcutter.listen('K', () => {});
    shortcutter.listen('J', () => {}, { context: 'editor' });
    expect(shortcuts!().map((s) => s.shortcut)).toEqual(['K']);

    shortcutter.contexts.activate('default', 'editor');
    expect(shortcuts!().map((s) => s.shortcut)).toEqual(['K', 'J']);
    dispose();
  });

  it('createKeymapCommands follows keymap changes', () => {
    const { shortcutter } = setup();
    const keymap = createKeymap(shortcutter, {
      palette: { keys: 'ControlOrMeta+K', run: () => {} },
    });
    let commands: (() => { keys: string[] }[]) | undefined;
    const dispose = withProvider(shortcutter, () => (commands = createKeymapCommands(keymap)));

    keymap.remap('palette', 'ControlOrMeta+P');
    expect(commands!()[0]!.keys).toEqual(['ControlOrMeta+P']);
    dispose();
  });

  it('createRecorder records and cancels when disposed', async () => {
    const { shortcutter, kb } = setup();
    let recorder: Recorder | undefined;
    const dispose = withProvider(shortcutter, () => (recorder = createRecorder()));

    const result = recorder!.start();
    kb.down('ShiftLeft');
    expect(recorder!.keys()).toEqual(['shift']);
    kb.down('KeyK');
    await expect(result).resolves.toBe('Shift+K');
    expect(recorder!.recording()).toBe(false);
    kb.up('KeyK');
    kb.up('ShiftLeft');

    const second = recorder!.start();
    dispose();
    await expect(second).resolves.toBeNull();
    await Promise.resolve();
    expect(shortcutter.contexts.active()).toEqual(['default']);
  });
});
