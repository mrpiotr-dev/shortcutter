<script lang="ts">
  // Docs demo: a J/K counter and the keys held right now.
  import { usePressedKeys, useShortcut } from '@shortcutter/svelte';
  import { formatKeys } from 'shortcutter/format';

  let count = $state(0);
  const pressed = usePressedKeys();
  const held = $derived(formatKeys(pressed.current));

  useShortcut('K', () => count++);
  useShortcut('J', () => count--);
  useShortcut('Shift+K', () => (count += 10));
  useShortcut('Shift+J', () => (count -= 10));
</script>

<div class="fw-demo not-content">
  <output>{count}</output>
  <p><kbd>K</kbd> up, <kbd>J</kbd> down, with <kbd>Shift</kbd> by 10</p>
  <p class="fw-demo-held" aria-live="polite">
    {#if held.length}
      {#each held as key (key)}<kbd>{key}</kbd>{/each}
    {:else}
      No keys held
    {/if}
  </p>
</div>
