# @shortcutter/vue

Vue bindings for [`@shortcutter/core`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add @shortcutter/core @shortcutter/vue
```

```ts
import { useShortcut } from '@shortcutter/vue';

const open = ref(false);

useShortcut('ControlOrMeta+K', () => (open.value = true), { preventDefault: true });
useShortcut(
  'Escape',
  () => (open.value = false),
  () => ({ enabled: open.value }),
);
```

- `useShortcut(shortcut, handler, options?)`: registered while mounted; `shortcut` and `options` may be refs or getters.
- `useShortcutter()`: the instance, e.g. to switch contexts.
- `provideShortcutter(instance)` or `app.provide(shortcutterKey, instance)`: use your own instance instead of the shared one on `window`.

Shortcuts are registered only after mount, so nothing runs during server rendering. Full docs: https://www.shortcutter.dev/docs/

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
