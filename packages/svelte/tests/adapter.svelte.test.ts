import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter } from 'shortcutter';
import { keyboard } from '../../core/tests/keyboard';
import Fixture from './Fixture.svelte';

function setup() {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });
  const onmount = vi.fn();
  const onattach = vi.fn();
  const onsequence = vi.fn();
  const props = $state({
    shortcutter,
    onmount,
    onattach,
    onsequence,
    attachKeys: 'B',
    showAttached: true,
  });
  const component = mount(Fixture, { target: document.createElement('div'), props });

  flushSync();

  return { kb: keyboard(target), onmount, onattach, onsequence, props, component };
}

describe('svelte adapter', () => {
  it('useShortcut registers while mounted and cleans up on unmount', async () => {
    const { kb, onmount, component } = setup();

    kb.down('ControlLeft');
    kb.down('KeyK');
    kb.up('KeyK');
    kb.up('ControlLeft');
    expect(onmount).toHaveBeenCalledTimes(1);

    await unmount(component);
    kb.down('ControlLeft');
    kb.down('KeyK');
    expect(onmount).toHaveBeenCalledTimes(1);
  });

  it('the attachment follows its element and arguments', async () => {
    const { kb, onattach, props, component } = setup();

    kb.press('KeyB');
    expect(onattach).toHaveBeenCalledTimes(1);

    props.attachKeys = 'C';
    flushSync();
    kb.press('KeyB');
    kb.press('KeyC');
    expect(onattach).toHaveBeenCalledTimes(2);

    props.showAttached = false;
    flushSync();
    kb.press('KeyC');
    expect(onattach).toHaveBeenCalledTimes(2);
    await unmount(component);
  });

  it('registers sequences with useSequence and the sequence attachment', async () => {
    const { kb, onsequence, props, component } = setup();

    kb.press('KeyG');
    kb.press('KeyI'); // useSequence
    kb.press('KeyG');
    kb.press('KeyO'); // attachment
    expect(onsequence).toHaveBeenCalledTimes(2);

    props.showAttached = false;
    flushSync();
    kb.press('KeyG');
    kb.press('KeyO');
    expect(onsequence).toHaveBeenCalledTimes(2);
    await unmount(component);
  });
});
