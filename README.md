# SHORTCUTTER

Tiny, dependency-free keyboard shortcuts for the browser, with **contexts** and **key phases**. Framework-agnostic and SSR-safe, with adapters for React, Vue, Svelte and Solid.

## Getting started

```sh
pnpm add shortcutter
```

```ts
import { createShortcutter } from 'shortcutter';

const shortcutter = createShortcutter();

shortcutter.listen('ControlOrMeta+K', () => openCommandPalette(), { preventDefault: true });
```

`ControlOrMeta` is <kbd>⌘</kbd> on macOS and <kbd>Ctrl</kbd> elsewhere, the same name Playwright uses.

Without a bundler, load the script build, which exposes `window.Shortcutter`:

```html
<script src="https://unpkg.com/shortcutter"></script>
<script>
  const shortcutter = Shortcutter.createShortcutter();
</script>
```

## Shortcuts

A shortcut is a `+`-separated list of keys. Names are case-insensitive and the order does not matter.

- Modifiers: `Control` (`Ctrl`), `Shift`, `Alt` (`Option`), `Meta` (`Cmd`, `Command`), `ControlOrMeta`. Left and right keys match alike.
- Keys follow [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_code_values), so they match the physical key whatever the keyboard layout: `K` (or `KeyK`), `1` (or `Digit1`), `Escape` (`Esc`), `Enter` (`Return`), `ArrowUp` (`Up`), `Space`, `F1`, `Equal`, `Numpad1`, and so on.

```ts
shortcutter.listen('Shift+ArrowUp', selectAbove);
shortcutter.listen('Escape', close, { ignoreInputs: false });
```

## Phases

A handler runs in the `'down'` phase unless you ask for others:

| Phase     | When                                                                                |
| --------- | ----------------------------------------------------------------------------------- |
| `'down'`  | every key of the shortcut became pressed                                            |
| `'press'` | the shortcut is held and the system repeats the key                                 |
| `'up'`    | the shortcut stopped being pressed: a key was released, another key joined, or blur |

```ts
// Hold Alt to show hints
shortcutter.listen('Alt', (_event, { phase }) => toggleHints(phase === 'down'), {
  phases: ['down', 'up'],
});
```

## Contexts

Every shortcut belongs to a context (`'default'` unless you pass one). Only shortcuts in active contexts run.

```ts
shortcutter.listen('Escape', closeModal, { context: 'modal' });

shortcutter.contexts.activate('modal'); // only modal shortcuts run
shortcutter.contexts.activate('modal', 'default'); // both run, modal first
shortcutter.contexts.active(); // ['modal', 'default']
```

## API

### `createShortcutter(options?)`

| Option           | Default     | Description                                                                                           |
| ---------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `target`         | `window`    | Where keyboard events are listened to. Without one (e.g. on the server) nothing is attached.          |
| `signal`         | none        | Aborting it is the same as calling `destroy()`.                                                       |
| `defaultContext` | `'default'` | Context active from the start and used when `listen()` gets none.                                     |
| `ignoreInputs`   | `true`      | Skip shortcuts while typing in inputs, textareas, selects, contenteditable or during IME composition. |
| `preventDefault` | `false`     | Call `event.preventDefault()` when a handler runs.                                                    |
| `mac`            | detected    | Treat the platform as macOS (`ControlOrMeta` = Meta).                                                 |

Returns:

- `listen(shortcut, handler, options?)`: registers a shortcut and returns a function that removes it. Options: `context`, `phases`, `ignoreInputs`, `preventDefault`. The handler gets `(event, { phase, shortcut, context })`. Registering the same shortcut twice for a phase in one context throws.
- `unlisten(shortcut, { context?, phases? })`: removes a shortcut; does nothing if it is not registered.
- `contexts.activate(...names)`, `contexts.active()`, `contexts.isActive(name)`.
- `pressed()`: keys held right now, e.g. `['k', 'shift']`.
- `destroy()`: removes all event listeners.

## Frameworks

Each adapter registers the shortcut after mount and removes it on unmount. It uses a shared instance on `window` unless you provide your own.

```tsx
// React: the latest handler is always called, no need to memoize it
import { useShortcut, useShortcutter, ShortcutterProvider } from 'shortcutter/react';

useShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true, enabled: !open });
```

```ts
// Vue: the shortcut and options may be refs or getters
import { useShortcut, useShortcutter, provideShortcutter } from 'shortcutter/vue';

useShortcut('ControlOrMeta+K', () => (open.value = true), { preventDefault: true });
```

```svelte
<!-- Svelte 5: in a component script, or as an attachment tied to an element -->
<script>
  import { shortcut, useShortcut } from 'shortcutter/svelte';

  useShortcut('ControlOrMeta+K', () => (open = true), { preventDefault: true });
</script>

<dialog {@attach shortcut('Escape', close)}>…</dialog>
```

```ts
// Solid: the shortcut and options may be accessors
import { createShortcut, useShortcutter, ShortcutterContext } from 'shortcutter/solid';

createShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
```

## Migrating from 0.2

| 0.2                                                    | 0.3                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `useShortcutter({ eventTarget })`                      | `createShortcutter({ target })`                               |
| `listen('ctx', ['controlleft', 'k'], cb, PHASES.DOWN)` | `listen('Control+K', cb, { context: 'ctx', phases: 'down' })` |
| `PHASES.DOWN_UP`                                       | `['down', 'up']`                                              |
| default phases `down` + `press`                        | default phase `down`                                          |
| `cb(event, phase)`                                     | `cb(event, { phase, shortcut, context })`                     |
| `unlisten('ctx', keys, phases)`                        | `unlisten('Control+K', { context: 'ctx', phases })`           |
| `setActiveContext(name)` / `getActiveContext()`        | `contexts.activate(...names)` / `contexts.active()`           |
| listeners removed on `unload`                          | `destroy()` or `signal`                                       |

Also new: shortcuts are ignored while typing in inputs, `'down'` no longer fires again for keys left after a release, and stuck keys after <kbd>⌘</kbd> on macOS are fixed.

## Versioning

This library follows [Semantic Versioning](https://semver.org/).

## License

`Shortcutter` is available under the MIT license. See the [LICENSE](./LICENSE) file for more details.

Crafted with :heart: to :clipboard: and :key:
