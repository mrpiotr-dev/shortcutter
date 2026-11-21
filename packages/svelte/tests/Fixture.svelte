<script lang="ts">
  import type { Shortcutter } from 'shortcutter';
  import { sequence, setShortcutter, shortcut, useSequence, useShortcut } from '../src/index';

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

  setShortcutter(shortcutter);
  useShortcut('Control+K', onmount);
  useSequence('G I', onsequence);
</script>

{#if showAttached}
  <div
    {@attach shortcut(attachKeys, onattach, { shortcutter })}
    {@attach sequence('G O', onsequence, { shortcutter })}
  ></div>
{/if}
