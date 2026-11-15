import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import { createShortcutter } from 'shortcutter';
import {
  provideShortcutter,
  shortcutterKey,
  useSequence,
  useShortcut,
  useShortcutter,
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
});
