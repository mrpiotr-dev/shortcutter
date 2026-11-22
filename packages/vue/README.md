# @shortcutter/vue

Vue bindings for [`shortcutter`](https://www.shortcutter.dev/): keyboard shortcuts with contexts and key phases.

```sh
pnpm add shortcutter @shortcutter/vue
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
- `useSequence(sequence, handler, options?)`: a key sequence such as `'G I'` (from `shortcutter/sequences`); refs and getters work as in `useShortcut`.
- `usePressedKeys()`: a read-only ref with the keys held right now, e.g. `['k', 'shift']`.

Sequence code is only bundled if you use it.

Shortcuts are registered only after mount, so nothing runs during server rendering. Literal shortcut strings are type-checked, so a typo such as `'Ctlr+K'` is a compile error.

Guide with recipes (modals, help screens, testing): https://www.shortcutter.dev/docs/frameworks/vue/

Shortcutter is free and MIT-licensed. If it helps you, consider [sponsoring it on GitHub](https://github.com/sponsors/mrpiotr-dev).

MIT © SLAVICTECH PIOTR LASZCZKOWSKI
