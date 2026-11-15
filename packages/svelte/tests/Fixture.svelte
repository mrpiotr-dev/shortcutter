<script lang="ts">
  import type { Shortcutter } from '@shortcutter/core';
  import { setShortcutter, shortcut, useShortcut } from '../src/index';

  let {
    shortcutter,
    onmount,
    onattach,
    attachKeys = 'B',
    showAttached = true,
  }: {
    shortcutter: Shortcutter;
    onmount: () => void;
    onattach: () => void;
    attachKeys?: string;
    showAttached?: boolean;
  } = $props();

  setShortcutter(shortcutter);
  useShortcut('Control+K', onmount);
</script>

{#if showAttached}
  <div {@attach shortcut(attachKeys, onattach, { shortcutter })}></div>
{/if}
