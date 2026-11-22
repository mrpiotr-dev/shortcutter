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
- `usePressedKeys()`: `{ current }` with the keys held right now, e.g. `['k', 'shift']`, reactive when read.

Sequence code is only bundled if you use it.

Shortcuts are registered only after mount, so nothing runs during server rendering. Literal shortcut strings are type-checked, so a typo such as `'Ctlr+K'` is a compile error.

Guide with recipes (modals, help screens, testing): https://www.shortcutter.dev/docs/frameworks/svelte/

Shortcutter is free and MIT-licensed. If it helps you, consider [sponsoring it on GitHub](https://github.com/sponsors/mrpiotr-dev).

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
