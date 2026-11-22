import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import { createShortcutter } from 'shortcutter';
import { createKeymap } from 'shortcutter/keymap';
import {
  provideShortcutter,
  shortcutterKey,
  useKeymap,
  usePressedKeys,
  useRecorder,
  useSequence,
  useShortcut,
  useShortcuts,
  useShortcutter,
  type Recorder,
} from '../src/index';
import { keyboard } from '../../core/tests/keyboard';

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
});

function mount(setup: () => void) {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });

  app = createApp(defineComponent({ setup: () => (setup(), () => null) }));
  app.provide(shortcutterKey, shortcutter);
  app.mount(document.createElement('div'));

  return { shortcutter, kb: keyboard(target) };
}

describe('vue adapter', () => {
  it('registers while mounted and cleans up on unmount', () => {
    const handler = vi.fn();
    const { kb } = mount(() => useShortcut('Control+K', handler));

    kb.down('ControlLeft');
    kb.down('KeyK');
    kb.up('KeyK');
    kb.up('ControlLeft');
    expect(handler).toHaveBeenCalledTimes(1);

    app!.unmount();
    app = undefined;
    kb.down('ControlLeft');
    kb.down('KeyK');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('re-registers when a ref shortcut or options change', async () => {
    const handler = vi.fn();
    const keys = ref('A');
    const enabled = ref(true);
    const { kb } = mount(() => useShortcut(keys, handler, () => ({ enabled: enabled.value })));

    keys.value = 'B';
    await nextTick();
    kb.press('KeyA');
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);

    enabled.value = false;
    await nextTick();
    kb.press('KeyB');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('registers sequences while mounted', () => {
    const handler = vi.fn();
    const { kb } = mount(() => useSequence('G I', handler));

    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);

    app!.unmount();
    app = undefined;
    kb.press('KeyG');
    kb.press('KeyI');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('provides an instance to descendants', () => {
    const target = new EventTarget();
    const shortcutter = createShortcutter({ target });
    let seen: unknown;
    const Child = defineComponent({ setup: () => ((seen = useShortcutter()), () => null) });

    app = createApp(
      defineComponent({ setup: () => (provideShortcutter(shortcutter), () => h(Child)) }),
    );
    app.mount(document.createElement('div'));

    expect(seen).toBe(shortcutter);
  });
  it('exposes the held keys as a ref, and stops on unmount', () => {
    let pressed: ReturnType<typeof usePressedKeys> | undefined;
    const { kb } = mount(() => {
      pressed = usePressedKeys();
    });

    expect(pressed!.value).toEqual([]);
    kb.down('ShiftLeft');
    kb.down('KeyW');
    expect(pressed!.value).toEqual(['shift', 'w']);
    kb.up('KeyW');
    expect(pressed!.value).toEqual(['shift']);

    app!.unmount();
    app = undefined;
    kb.up('ShiftLeft');
    expect(pressed!.value).toEqual(['shift']);
  });

  it('type-checks literal shortcuts and accepts refs', () => {
    const compileOnly = () => {
      useShortcut('ControlOrMeta+K', () => {});
      useShortcut(ref('Control+/'), () => {}); // refs are not checked
      useSequence(
        () => 'G I',
        () => {},
      );
      // @ts-expect-error -- typo
      useShortcut('Ctlr+K', () => {});
      // @ts-expect-error -- typo in a step
      useSequence('G Ctlr+I', () => {});
    };

    expect(compileOnly).toBeTypeOf('function');
  });

  it('lists shortcuts and updates when they or the contexts change', () => {
    let shortcuts: ReturnType<typeof useShortcuts> | undefined;
    const { shortcutter } = mount(() => (shortcuts = useShortcuts({ active: true })));

    expect(shortcuts!.value).toEqual([]);
    shortcutter.listen('K', () => {});
    shortcutter.listen('J', () => {}, { context: 'editor' });
    expect(shortcuts!.value.map((s) => s.shortcut)).toEqual(['K']);

    shortcutter.contexts.activate('default', 'editor');
    expect(shortcuts!.value.map((s) => s.shortcut)).toEqual(['K', 'J']);
  });

  it('updates a keymap settings screen after changes', () => {
    let commands: ReturnType<typeof useKeymap> | undefined;
    let keymap: ReturnType<typeof createKeymap> | undefined;

    mount(() => {
      keymap = createKeymap(useShortcutter(), {
        palette: { keys: 'ControlOrMeta+K', run: () => {} },
      });
      commands = useKeymap(keymap);
    });

    keymap!.remap('palette', 'ControlOrMeta+P');
    expect(commands!.value[0]!.keys).toEqual(['ControlOrMeta+P']);
  });

  it('records a shortcut and cancels on unmount', async () => {
    let recorder: Recorder | undefined;
    const { shortcutter, kb } = mount(() => (recorder = useRecorder()));

    const result = recorder!.start();
    expect(recorder!.recording.value).toBe(true);
    kb.down('ShiftLeft');
    expect(recorder!.keys.value).toEqual(['shift']);
    kb.down('KeyK');
    await expect(result).resolves.toBe('Shift+K');
    expect(recorder!.recording.value).toBe(false);
    kb.up('KeyK');
    kb.up('ShiftLeft');

    const second = recorder!.start();
    app!.unmount();
    app = undefined;
    await expect(second).resolves.toBeNull();
    await Promise.resolve();
    expect(shortcutter.contexts.active()).toEqual(['default']);
  });
});
