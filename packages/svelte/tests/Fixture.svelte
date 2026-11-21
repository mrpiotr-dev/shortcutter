<script lang="ts">
  import { untrack } from 'svelte';
  import type { Shortcutter } from 'shortcutter';
  import {
    sequence,
    setShortcutter,
    shortcut,
    usePressedKeys,
    useSequence,
    useShortcut,
  } from '../src/index';

  let {
    shortcutter,
    onmount,
    onattach,
    attachKeys = 'B',
    showAttached = true,
    onsequence = () => {},
  }: {
    shortcutter: Shortcutter;
    onmount: () => void;
    onattach: () => void;
    onsequence?: () => void;
    attachKeys?: string;
    showAttached?: boolean;
  } = $props();

  // Props are read once on purpose: the hooks register during initialisation.
  setShortcutter(untrack(() => shortcutter));
  useShortcut('Control+K', () => onmount());
  useSequence('G I', () => onsequence());

  const pressed = usePressedKeys();
</script>

{#if showAttached}
  <div
    {@attach shortcut(attachKeys, onattach, { shortcutter })}
    {@attach sequence('G O', onsequence, { shortcutter })}
  ></div>
{/if}

<output>{pressed.current.join('+')}</output>
