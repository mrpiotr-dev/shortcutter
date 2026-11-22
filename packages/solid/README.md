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
- `createPressedKeys()`: an accessor with the keys held right now, e.g. `['k', 'shift']`.

Sequence code is only bundled if you use it.

Shortcuts are registered only after mount, so nothing runs during server rendering. Literal shortcut strings are type-checked, so a typo such as `'Ctlr+K'` is a compile error.

Guide with recipes (modals, help screens, testing): https://www.shortcutter.dev/docs/frameworks/solid/

Shortcutter is free and MIT-licensed. If it helps you, consider [sponsoring it on GitHub](https://github.com/sponsors/mrpiotr-dev).

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
