import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter, type Shortcutter } from 'shortcutter';
import { createKeymap, type Keymap } from 'shortcutter/keymap';
import { keyboard } from '../../core/tests/keyboard';
import { sequence, shortcut, useSequence, useShortcut } from '../src/index';
import Fixture from './Fixture.svelte';

function setup(withKeymap?: (shortcutter: Shortcutter) => Keymap) {
  const target = new EventTarget();
  const shortcutter = createShortcutter({ target, mac: false });
  const keymap = withKeymap?.(shortcutter);
  const hooks: Record<string, unknown> = {};
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
    keymap,
    onhooks: (given: Record<string, unknown>) => Object.assign(hooks, given),
  });
  const element = document.createElement('div');
  const component = mount(Fixture, { target: element, props });

  flushSync();

  return {
    kb: keyboard(target),
    onmount,
    onattach,
    onsequence,
    props,
    component,
    element,
    shortcutter,
    keymap,
    hooks,
  };
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

  it('usePressedKeys updates the markup with the held keys', async () => {
    const { kb, component, element } = setup();
    const shown = () => element.querySelector('output')!.textContent;

    expect(shown()).toBe('');
    kb.down('ShiftLeft');
    kb.down('KeyW');
    flushSync();
    expect(shown()).toBe('shift+w');
    kb.up('KeyW');
    flushSync();
    expect(shown()).toBe('shift');

    await unmount(component);
  });

  it('type-checks literal shortcuts', () => {
    const compileOnly = () => {
      useShortcut('ControlOrMeta+K', () => {});
      shortcut('Shift+Arrow*', () => {});
      useSequence('G I', () => {});
      sequence('G H', () => {});
      // @ts-expect-error -- typo
      useShortcut('Ctlr+K', () => {});
      // @ts-expect-error -- "/" is "Slash"
      shortcut('Control+/', () => {});
      // @ts-expect-error -- typo in a step
      sequence('G Ctlr+I', () => {});
    };

    expect(compileOnly).toBeTypeOf('function');
  });

  it('useShortcuts updates the markup when shortcuts or contexts change', async () => {
    const { shortcutter, component, element } = setup();
    const shown = () => element.querySelector('[data-shortcuts]')!.textContent;

    expect(shown()).toBe('B,Control+K');
    shortcutter.listen('J', () => {}, { context: 'editor' });
    flushSync();
    expect(shown()).toBe('B,Control+K');

    shortcutter.contexts.activate('default', 'editor');
    flushSync();
    expect(shown()).toBe('B,Control+K,J');
    await unmount(component);
  });

  it('useKeymap updates the markup after a remap', async () => {
    const { keymap, component, element } = setup((sc) =>
      createKeymap(sc, { palette: { keys: 'ControlOrMeta+P', run: () => {} } }),
    );
    const shown = () => element.querySelector('[data-commands]')!.textContent;

    expect(shown()).toBe('ControlOrMeta+P');
    keymap!.remap('palette', ['Alt+P', 'F1']);
    flushSync();
    expect(shown()).toBe('Alt+P F1');
    await unmount(component);
  });

  it('useRecorder records, shows the held keys and cancels on destroy', async () => {
    const { kb, component, element, hooks, shortcutter } = setup();
    const recorder = hooks.recorder as { start(): Promise<string | null> };
    const shown = () => element.querySelector('[data-recorder]')!.textContent;

    const result = recorder.start();
    kb.down('ShiftLeft');
    flushSync();
    expect(shown()).toBe('recording shift');

    kb.down('KeyK');
    await expect(result).resolves.toBe('Shift+K');
    flushSync();
    expect(shown()).toBe('idle');
    kb.up('KeyK');
    kb.up('ShiftLeft');

    const second = recorder.start();
    await unmount(component);
    await expect(second).resolves.toBeNull();
    await Promise.resolve();
    expect(shortcutter.contexts.active()).toEqual(['default']);
  });
});
