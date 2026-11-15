# @shortcutter/react

React bindings for [`shortcutter`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add shortcutter @shortcutter/react
```

```tsx
import { useShortcut } from '@shortcutter/react';

function Palette() {
  const [open, setOpen] = useState(false);

  useShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
  useShortcut('Escape', () => setOpen(false), { enabled: open, ignoreInputs: false });
  // …
}
```

- `useShortcut(shortcut, handler, options?)`: registered while mounted; always calls the latest `handler`. Options: `context`, `phases`, `ignoreInputs`, `preventDefault`, `enabled`.
- `useShortcutter()`: the instance, e.g. to switch contexts.
- `<ShortcutterProvider shortcutter={createShortcutter(...)}>`: use your own instance instead of the shared one on `window`.

Shortcuts are registered only after mount, so nothing runs during server rendering. Full docs: https://www.shortcutter.dev/docs/

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
