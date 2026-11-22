<script lang="ts">
  import { untrack } from 'svelte';
  import type { Shortcutter } from 'shortcutter';
  import type { Keymap } from 'shortcutter/keymap';
  import {
    sequence,
    setShortcutter,
    shortcut,
    useKeymap,
    usePressedKeys,
    useRecorder,
    useSequence,
    useShortcut,
    useShortcuts,
  } from '../src/index';

  let {
    shortcutter,
    onmount,
    onattach,
    attachKeys = 'B',
    showAttached = true,
    onsequence = () => {},
    keymap,
    onhooks = () => {},
  }: {
    shortcutter: Shortcutter;
    onmount: () => void;
    onattach: () => void;
    onsequence?: () => void;
    attachKeys?: string;
    showAttached?: boolean;
    keymap?: Keymap;
    onhooks?: (hooks: Record<string, unknown>) => void;
  } = $props();

  // Props are read once on purpose: the hooks register during initialisation.
  setShortcutter(untrack(() => shortcutter));
  useShortcut('Control+K', () => onmount());
  useSequence('G I', () => onsequence());

  const pressed = usePressedKeys();
  const shortcuts = useShortcuts({ active: true });
  const commands = untrack(() => keymap) ? useKeymap(untrack(() => keymap)!) : undefined;
  const recorder = useRecorder();

  untrack(() => onhooks)({ shortcuts, commands, recorder });
</script>

{#if showAttached}
  <div
    {@attach shortcut(attachKeys, onattach, { shortcutter })}
    {@attach sequence('G O', onsequence, { shortcutter })}
  ></div>
{/if}

<output>{pressed.current.join('+')}</output>

<p data-shortcuts>{shortcuts.current.map((s) => s.shortcut).join(',')}</p>
<p data-commands>{commands?.current.map((c) => c.keys.join(' ')).join(',')}</p>
<p data-recorder>{recorder.recording ? `recording ${recorder.keys.join('+')}` : 'idle'}</p>
