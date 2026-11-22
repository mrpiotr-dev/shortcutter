import { describe, expect, it, vi } from 'vite-plus/test';
import { createShortcutter, type ShortcutterOptions } from '../src/index';
import { createKeymap, KeymapConflictError, type KeymapOptions } from '../src/keymap';
import { keyboard } from './keyboard';

function setup(options: KeymapOptions = {}, shortcutterOptions: ShortcutterOptions = {}) {
  const target = new EventTarget();
  const sc = createShortcutter({ mac: false, ...shortcutterOptions, target });
  const kb = keyboard(target);
  const undo = vi.fn();
  const palette = vi.fn();
  const save = vi.fn();
  const keymap = createKeymap(
    sc,
    {
      undo: { keys: 'ControlOrMeta+Z', description: 'Undo', run: undo },
      palette: {
        keys: ['ControlOrMeta+K', 'ControlOrMeta+P'],
        description: 'Command palette',
        run: palette,
      },
      save: { keys: 'ControlOrMeta+S', context: 'editor', run: save },
    },
    options,
  );

  const chord = (...codes: string[]) => {
    for (const code of codes) kb.down(code);
    for (const code of [...codes].reverse()) kb.up(code);
  };

  return { sc, kb, keymap, chord, undo, palette, save };
}

describe('createKeymap', () => {
  it('registers every command with its default shortcuts', () => {
    const { sc, keymap, chord, undo, palette } = setup();

    chord('ControlLeft', 'KeyZ');
    chord('ControlLeft', 'KeyP');

    expect(undo).toHaveBeenCalledOnce();
    expect(palette).toHaveBeenCalledOnce();
    expect(keymap.commands()).toEqual([
      {
        id: 'undo',
        keys: ['ControlOrMeta+Z'],
        defaults: ['ControlOrMeta+Z'],
        description: 'Undo',
        context: 'default',
        customized: false,
      },
      {
        id: 'palette',
        keys: ['ControlOrMeta+K', 'ControlOrMeta+P'],
        defaults: ['ControlOrMeta+K', 'ControlOrMeta+P'],
        description: 'Command palette',
        context: 'default',
        customized: false,
      },
      {
        id: 'save',
        keys: ['ControlOrMeta+S'],
        defaults: ['ControlOrMeta+S'],
        context: 'editor',
        customized: false,
      },
    ]);
    expect(sc.shortcuts().map((s) => s.description)).toEqual([
      'Undo',
      'Command palette',
      'Command palette',
      undefined,
    ]);
  });

  it('remaps a command: the old shortcut stops, the new one works', () => {
    const { keymap, chord, palette } = setup();

    keymap.remap('palette', 'ControlOrMeta+Shift+P');
    chord('ControlLeft', 'KeyK');
    expect(palette).not.toHaveBeenCalled();

    chord('ControlLeft', 'ShiftLeft', 'KeyP');
    expect(palette).toHaveBeenCalledOnce();
    expect(keymap.keys('palette')).toEqual(['ControlOrMeta+Shift+P']);
  });

  it('throws on a conflict in the same context, and changes nothing', () => {
    const { keymap, chord, undo } = setup();

    expect(() => keymap.remap('palette', ['ControlOrMeta+J', 'Control+Z'])).toThrow(
      new KeymapConflictError('Control+Z', [
        { shortcut: 'ControlOrMeta+Z', context: 'default', command: 'undo', description: 'Undo' },
      ]),
    );
    expect(keymap.keys('palette')).toEqual(['ControlOrMeta+K', 'ControlOrMeta+P']);

    chord('ControlLeft', 'KeyZ');
    expect(undo).toHaveBeenCalledOnce();
  });

  it('with force, takes the keys from the other command', () => {
    const { keymap, chord, undo, palette } = setup();

    keymap.remap('palette', 'ControlOrMeta+Z', { force: true });
    chord('ControlLeft', 'KeyZ');

    expect(palette).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
    expect(keymap.keys('undo')).toEqual([]);
    expect(keymap.overrides()).toEqual({ undo: [], palette: ['ControlOrMeta+Z'] });
  });

  it('even with force, cannot take keys from a shortcut registered outside the keymap', () => {
    const { sc, keymap } = setup();

    sc.listen('Control+J', vi.fn(), { description: 'Jump' });

    expect(() => keymap.remap('palette', 'Control+J', { force: true })).toThrow(
      KeymapConflictError,
    );
    expect(keymap.keys('palette')).toEqual(['ControlOrMeta+K', 'ControlOrMeta+P']);
  });

  it('does not see a conflict between contexts unless they overlap', () => {
    const plain = setup();

    expect(plain.keymap.conflicts('ControlOrMeta+S')).toEqual([]);
    plain.keymap.remap('undo', 'ControlOrMeta+S');

    const shared = setup({ overlaps: (a, b) => a === b || a === 'default' || b === 'default' });

    expect(shared.keymap.conflicts('ControlOrMeta+S')).toEqual([
      { shortcut: 'ControlOrMeta+S', context: 'editor', command: 'save' },
    ]);
    expect(() => shared.keymap.remap('undo', 'ControlOrMeta+S')).toThrow(KeymapConflictError);
  });

  it('finds wildcard overlaps in both directions, and shortcuts registered outside the keymap', () => {
    const { sc, keymap } = setup();

    sc.listen('Control+Digit*', vi.fn());

    expect(keymap.conflicts('Control+1')).toEqual([
      { shortcut: 'Control+Digit*', context: 'default' },
    ]);
    expect(keymap.conflicts('ControlOrMeta+Key*').map((c) => c.command)).toEqual([
      'undo',
      'palette',
      'palette',
    ]);
    expect(keymap.conflicts('ControlOrMeta+Z', { except: 'undo' })).toEqual([]);
  });

  it('disables and resets commands', () => {
    const { keymap, chord, undo, palette } = setup();
    const listener = vi.fn();

    keymap.subscribe(listener);
    keymap.disable('undo');
    keymap.remap('palette', 'ControlOrMeta+J');
    chord('ControlLeft', 'KeyZ');
    expect(undo).not.toHaveBeenCalled();

    keymap.reset('undo');
    chord('ControlLeft', 'KeyZ');
    expect(undo).toHaveBeenCalledOnce();
    expect(keymap.overrides()).toEqual({ palette: ['ControlOrMeta+J'] });

    keymap.reset();
    chord('ControlLeft', 'KeyK');
    expect(palette).toHaveBeenCalledOnce();
    expect(keymap.overrides()).toEqual({});
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('restores saved overrides, ignoring unknown commands', () => {
    const { keymap, chord, undo, palette } = setup({
      overrides: { undo: [], palette: ['Alt+P'], removed: ['Alt+X'] },
    });

    chord('ControlLeft', 'KeyZ');
    chord('AltLeft', 'KeyP');

    expect(undo).not.toHaveBeenCalled();
    expect(palette).toHaveBeenCalledOnce();
    expect(keymap.commands().map((c) => [c.id, c.customized])).toEqual([
      ['undo', true],
      ['palette', true],
      ['save', false],
    ]);
  });

  it('round-trips overrides through JSON', () => {
    const first = setup();

    first.keymap.remap('save', ['ControlOrMeta+Shift+S', 'F2']);
    first.keymap.disable('undo');

    const second = setup({ overrides: JSON.parse(JSON.stringify(first.keymap.overrides())) });

    expect(second.keymap.overrides()).toEqual(first.keymap.overrides());
  });

  it('does not count a reordered or differently written list as a change', () => {
    const { keymap } = setup();

    keymap.remap('palette', ['ctrl+p', 'Control+K']);

    expect(keymap.overrides()).toEqual({});
  });

  it('names shortcuts the browser or the OS keeps', () => {
    const windows = setup().keymap;
    const mac = setup({}, { mac: true }).keymap;

    expect(windows.reserved('Ctrl+W')).toBe('Closes the tab');
    expect(mac.reserved('Cmd+W')).toBe('Closes the tab');
    expect(mac.reserved('Cmd+Q')).toBe('Quits the browser');
    expect(windows.reserved('Meta+Q')).toBeUndefined();
    expect(windows.reserved('Alt+F4')).toBe('Closes the window');
    expect(windows.reserved('ControlOrMeta+K')).toBeUndefined();
  });

  it('throws for unknown commands and invalid shortcuts', () => {
    const { keymap } = setup();

    expect(() => keymap.keys('nope' as never)).toThrow('Unknown command "nope".');
    expect(() => keymap.remap('undo', '')).toThrow();
    expect(keymap.keys('undo')).toEqual(['ControlOrMeta+Z']);
  });

  it('removes its shortcuts on destroy()', () => {
    const { sc, keymap, chord, undo } = setup();

    keymap.destroy();
    chord('ControlLeft', 'KeyZ');

    expect(undo).not.toHaveBeenCalled();
    expect(sc.shortcuts()).toEqual([]);
  });
});
