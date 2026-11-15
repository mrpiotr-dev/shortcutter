<script lang="ts">
  import { shortcut } from '@shortcutter/svelte';
  import { onMount } from 'svelte';
  import { currentDemo, onDemoChange } from '../active';

  let count = $state(0);
  let active = $state(false);

  onMount(() => {
    active = currentDemo() === 'svelte';
    return onDemoChange((id) => (active = id === 'svelte'));
  });
</script>

<!-- Attachments re-run when `active` changes, registering or removing the shortcuts. -->
<div
  class="demo-counter"
  {@attach shortcut('K', () => count++, { enabled: active })}
  {@attach shortcut('J', () => count--, { enabled: active })}
  {@attach shortcut('Shift+K', () => (count += 10), { enabled: active })}
  {@attach shortcut('Shift+J', () => (count -= 10), { enabled: active })}
>
  <output>{count}</output>
  <p>Svelte</p>
</div>
