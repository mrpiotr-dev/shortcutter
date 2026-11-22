# SHORTCUTTER

[![npm](https://img.shields.io/npm/v/shortcutter)](https://www.npmjs.com/package/shortcutter)
[![CI](https://github.com/mrpiotr-dev/shortcutter/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/mrpiotr-dev/shortcutter/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.shortcutter.dev%2Fbadges%2Fcoverage.json)](https://github.com/mrpiotr-dev/shortcutter/actions/workflows/ci.yml)
[![size](https://img.shields.io/bundlejs/size/shortcutter)](https://bundlejs.com/?q=shortcutter)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/shortcutter?activeTab=dependencies)
[![Socket](https://socket.dev/api/badge/npm/package/shortcutter)](https://socket.dev/npm/package/shortcutter)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/mrpiotr-dev/shortcutter/badge)](https://scorecard.dev/viewer/?uri=github.com/mrpiotr-dev/shortcutter)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/17003/badge)](https://www.bestpractices.dev/projects/17003)
[![types](https://img.shields.io/npm/types/shortcutter)](https://www.npmjs.com/package/shortcutter)
[![license](https://img.shields.io/npm/l/shortcutter)](./LICENSE)

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
<!-- optional: key sequences, exposes window.ShortcutterSequences -->
<script src="https://unpkg.com/shortcutter/dist/sequences.iife.js"></script>
<!-- optional: key labels, exposes window.ShortcutterFormat -->
<script src="https://unpkg.com/shortcutter/dist/format.iife.js"></script>
<script>
  const shortcutter = Shortcutter.createShortcutter();
  const sequences = ShortcutterSequences.createSequences(shortcutter);
</script>
```

## Shortcuts

A shortcut is a `+`-separated list of keys. Names are case-insensitive and the order does not matter.

- Modifiers: `Control` (`Ctrl`), `Shift`, `Alt` (`Option`), `Meta` (`Cmd`, `Command`), `ControlOrMeta`. Left and right keys match alike.
- Keys are named after [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_code_values): `K` (or `KeyK`), `1` (or `Digit1`), `Escape` (`Esc`), `Enter` (`Return`), `ArrowUp` (`Up`), `Space`, `F1`, `Equal`, `Numpad1`, and so on.
- By default they match the **physical** key, whatever the layout. With `createShortcutter({ match: 'key' })`, letters match the **printed** letter instead, so `Control+Z` follows the key labelled Z on QWERTZ and AZERTY too. Control and Alt are ignored while AltGr is held, so `Control+Alt` shortcuts do not fire while typing `ą` or `@`. See [Keyboard layouts](https://www.shortcutter.dev/docs/guides/keyboard-layouts/).

```ts
shortcutter.listen('Shift+ArrowUp', selectAbove);
shortcutter.listen('Escape', close, { ignoreInputs: false });
```

In TypeScript, a shortcut written as a string literal is checked when it is compiled, so a typo or a key that would never fire is an error instead of a silent no-op:

```ts
shortcutter.listen('Ctlr+K', save); // error: Unknown key "Ctlr" in shortcut "Ctlr+K". …
shortcutter.listen('Control+/', help); // error: the key is "Slash"
```

A shortcut held in a `string` variable is not checked. Use `ShortcutString<S>` to check shortcuts in your own functions, and `KeyName` for the list of accepted names.

### Wildcards

A key may contain `*`. Each wildcard stands for exactly one key and never for a modifier, so modifiers are always written out. `detail.shortcut` tells you which keys were actually pressed.

```ts
shortcutter.listen('Shift+Arrow*', (_event, { shortcut }) => extendSelection(shortcut)); // 'arrowup+shift', …
shortcutter.listen('Digit*', (_event, { shortcut }) => openTab(Number(shortcut))); // any digit
```

`Key*` matches any letter, `Digit*` any digit, `F*` the function keys, `*` any key, and other globs match key names (`Arrow*`, `Numpad*`). Within one context an exact shortcut wins over wildcards for the same keys.

### Descriptions and help screens

Describe a shortcut when you register it, then list the registry to build a keyboard help screen that never goes out of date:

```ts
shortcutter.listen('ControlOrMeta+K', openPalette, { description: 'Open the command palette' });

shortcutter.shortcuts({ active: true });
// [{ shortcut: 'ControlOrMeta+K', keys: ['meta', 'k'], context: 'default', phases: ['down'],
//    description: 'Open the command palette', active: true }]
```

`keys` are resolved for the current platform (`meta` on macOS, `control` elsewhere for `ControlOrMeta`) with modifiers first, ready to render as keycaps.

`shortcutter/format` turns them into the labels people expect on each platform. It is an optional entry (about 0.7 kB gzipped), so apps that do not use it do not ship it:

```ts
import { formatKeys, formatShortcut } from 'shortcutter/format';

formatShortcut('ControlOrMeta+Shift+K'); // '⇧⌘K' on macOS, 'Ctrl+Shift+K' elsewhere
formatKeys('ControlOrMeta+Shift+K'); // ['⇧', '⌘', 'K'] or ['Ctrl', 'Shift', 'K'], one per <kbd>

for (const { keys, description } of shortcutter.shortcuts({ active: true })) {
  addHelpRow(formatShortcut(keys), description);
}
```

Both take a shortcut string or the `keys` of a `shortcuts()` entry, and the options `mac` (detected by default), `separator` (`''` on macOS, `'+'` elsewhere) and `labels` to rename keys: `{ meta: 'Win' }`, `{ space: 'Leertaste' }`. Arrows show as ↑↓←→, punctuation as its character, and wildcards as ranges (`Digit*` is `0–9`, `Arrow*` is `←↑→↓`).

## Phases

A handler runs in the `'down'` phase unless you ask for others:

| Phase     | When                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `'down'`  | every key of the shortcut became pressed                                                                               |
| `'press'` | the shortcut is held and the system repeats the key                                                                    |
| `'up'`    | the shortcut stopped being pressed: a key was released, another key joined, or the page lost focus, was left or hidden |

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

- `listen(shortcut, handler, options?)`: registers a shortcut and returns a function that removes it. Options: `description`, `context`, `phases`, `ignoreInputs`, `preventDefault`. The handler gets `(event, { phase, shortcut, pattern, context, description })`. Registering the same shortcut twice for a phase in one context throws.
- `unlisten(shortcut, { context?, phases? })`: removes a shortcut; does nothing if it is not registered.
- `shortcuts({ active?, context? })`: the registered shortcuts with their keys, context, phases, description and whether they work right now.
- `contexts.activate(...names)`, `contexts.active()`, `contexts.isActive(name)`.
- `isPressed(shortcut)`: whether all its keys are held right now: `isPressed('Shift')`, `isPressed('Shift+W')`, `isPressed('Arrow*')`.
- `resolve(shortcut)`: its keys for this platform, modifiers first: `resolve('ControlOrMeta+K')` is `['meta', 'k']` on macOS.
- `pressed()`: keys held right now, e.g. `['k', 'shift']`.
- `subscribe(listener)`: calls `listener(pressed, event)` whenever the held keys change and returns an unsubscribe function. Useful for key visualizers or React's `useSyncExternalStore`.
- `observe(listener)`: calls `listener(event, { phase, shortcut })` for every `down`, `press` and `up` of any key combination, matched or not, before handlers run. Useful for key loggers and visualizers.
- `destroy()`: removes all event listeners.

## Sequences (optional)

Vim-style sequences such as <kbd>G</kbd> then <kbd>I</kbd> live in a separate entry, so apps that do not use them do not ship them (about 0.7 kB gzipped):

```ts
import { createShortcutter } from 'shortcutter';
import { createSequences } from 'shortcutter/sequences';

const shortcutter = createShortcutter();
const sequences = createSequences(shortcutter, { timeout: 1000 });

sequences.listen('G I', () => goToInbox(), { description: 'Go to the inbox' });
sequences.listen('G Shift+P', () => goToProfile());
sequences.sequences(); // for help screens, like shortcuts()
```

The framework adapters wrap it too: `useSequence` (React, Vue, Svelte), `createSequence` (Solid) and the Svelte `sequence` attachment.

Steps are separated by spaces and each step is a shortcut (modifiers and wildcards work). Steps must follow each other within `timeout` milliseconds; pressing a modifier on its own does not count as a step. Sequences respect contexts, the input guard and `preventDefault`, like `listen()`.

## Frameworks

Install the adapter next to the core, e.g. `pnpm add shortcutter @shortcutter/react`. Each adapter registers the shortcut after mount and removes it on unmount. It uses a shared instance on `window` unless you provide your own.

```tsx
// React: the latest handler is always called, no need to memoize it
import { useShortcut, useShortcutter, ShortcutterProvider } from '@shortcutter/react';

useShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true, enabled: !open });
```

```ts
// Vue: the shortcut and options may be refs or getters
import { useShortcut, useShortcutter, provideShortcutter } from '@shortcutter/vue';

useShortcut('ControlOrMeta+K', () => (open.value = true), { preventDefault: true });
```

```svelte
<!-- Svelte 5: in a component script, or as an attachment tied to an element -->
<script>
  import { shortcut, useShortcut } from '@shortcutter/svelte';

  useShortcut('ControlOrMeta+K', () => (open = true), { preventDefault: true });
</script>

<dialog {@attach shortcut('Escape', close)}>…</dialog>
```

```ts
// Solid: the shortcut and options may be accessors
import { createShortcut, useShortcutter, ShortcutterContext } from '@shortcutter/solid';

createShortcut('ControlOrMeta+K', () => setOpen(true), { preventDefault: true });
```

Each adapter also tracks the held keys, for games and key visualizers. They update while the component is mounted and are empty during server rendering:

| Adapter | Hook                  | Returns                                   |
| ------- | --------------------- | ----------------------------------------- |
| React   | `usePressedKeys()`    | `string[]`, re-rendering when keys change |
| Vue     | `usePressedKeys()`    | a read-only ref                           |
| Svelte  | `usePressedKeys()`    | `{ current }`, reactive when read         |
| Solid   | `createPressedKeys()` | an accessor                               |

```tsx
const pressed = usePressedKeys(); // React
const speed = pressed.includes('shift') ? 2 : 1;
```

## Migrating from 0.2

| 0.2                                                    | 0.3                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `useShortcutter({ eventTarget })`                      | `createShortcutter({ target })`                                 |
| `listen('ctx', ['controlleft', 'k'], cb, PHASES.DOWN)` | `listen('Control+K', cb, { context: 'ctx', phases: 'down' })`   |
| `PHASES.DOWN_UP`                                       | `['down', 'up']`                                                |
| default phases `down` + `press`                        | default phase `down`                                            |
| `cb(event, phase)`                                     | `cb(event, { phase, shortcut, pattern, context, description })` |
| `unlisten('ctx', keys, phases)`                        | `unlisten('Control+K', { context: 'ctx', phases })`             |
| `setActiveContext(name)` / `getActiveContext()`        | `contexts.activate(...names)` / `contexts.active()`             |
| listeners removed on `unload`                          | `destroy()` or `signal`                                         |

Also new: shortcuts are ignored while typing in inputs, `'down'` no longer fires again for keys left after a release, and stuck keys after <kbd>⌘</kbd> on macOS are fixed.

## Versioning

This library follows [Semantic Versioning](https://semver.org/).

## Feedback and bug reports

- **Bugs:** open a [bug report](https://github.com/mrpiotr-dev/shortcutter/issues/new?template=bug_report.yml). Include the package version, browser, OS and keyboard layout.
- **Questions and feedback:** [GitHub Discussions](https://github.com/mrpiotr-dev/shortcutter/discussions).
- **Feature requests:** open a [feature request](https://github.com/mrpiotr-dev/shortcutter/issues/new?template=feature_request.yml).
- **Docs problems:** use "Report a problem with this page" at the bottom of any docs page.
- **Security issues:** report them privately, see [SECURITY.md](./SECURITY.md).

More in [Feedback and support](https://www.shortcutter.dev/docs/support/).

## Sponsors

**Be our first sponsor!** Shortcutter is free and MIT-licensed, and always will be. Sponsors fund what’s next: international keyboard layouts, customizable shortcuts and the road to 1.0.

<a href="https://github.com/sponsors/mrpiotr-dev"><img src="https://img.shields.io/badge/Sponsor_Shortcutter-%E2%9D%A4-db61a2?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor Shortcutter on GitHub" /></a>

## License

`Shortcutter` is available under the MIT license. See the [LICENSE](./LICENSE) file for more details.

Crafted with :heart: to :clipboard: and :key:
