# @shortcutter/solid

Solid bindings for [`shortcutter`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add shortcutter @shortcutter/solid
```

```tsx
import { createShortcut } from '@shortcutter/solid';

const [open, setOpen] = createSignal(false);

createShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
createShortcut(
  'Escape',
  () => setOpen(false),
  () => ({ enabled: open() }),
);
```

- `createShortcut(shortcut, handler, options?)`: registered for the owner's lifetime; `shortcut` and `options` may be accessors.
- `useShortcutter()`: the instance, e.g. to switch contexts.
- `<ShortcutterContext.Provider value={instance}>`: use your own instance instead of the shared one on `window`.
- `createSequence(sequence, handler, options?)`: a key sequence such as `'G I'` (from `shortcutter/sequences`); accessors work as in `createShortcut`.

Sequence code is only bundled if you use it.

Shortcuts are registered only after mount, so nothing runs during server rendering. Full docs: https://www.shortcutter.dev/docs/

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
