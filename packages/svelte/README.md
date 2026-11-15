# @shortcutter/svelte

Svelte 5 bindings for [`@shortcutter/core`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add @shortcutter/core @shortcutter/svelte
```

```svelte
<script>
  import { shortcut, useShortcut } from '@shortcutter/svelte';

  let open = $state(false);

  useShortcut('ControlOrMeta+K', () => (open = true), { preventDefault: true });
</script>

{#if open}
  <dialog open {@attach shortcut('Escape', () => (open = false))}>…</dialog>
{/if}
```

- `useShortcut(shortcut, handler, options?)`: call during component initialisation; registered while mounted.
- `shortcut(shortcut, handler, options?)`: attachment, registered while the element exists and again when its arguments change.
- `getShortcutter()` / `setShortcutter(instance)`: read or provide the instance (shared one on `window` by default).

Shortcuts are registered only after mount, so nothing runs during server rendering. Full docs: https://www.shortcutter.dev/docs/

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
