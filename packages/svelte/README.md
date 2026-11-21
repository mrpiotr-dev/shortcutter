# @shortcutter/svelte

Svelte 5 bindings for [`shortcutter`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add shortcutter @shortcutter/svelte
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
- `useSequence(sequence, handler, options?)` and the `sequence(keys, handler, options?)` attachment: key sequences such as `'G I'` (from `shortcutter/sequences`).

Sequence code is only bundled if you use it.

Shortcuts are registered only after mount, so nothing runs during server rendering. Full docs: https://www.shortcutter.dev/docs/

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
