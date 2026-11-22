# @shortcutter/svelte

## 0.5.0

### Minor Changes

- f3fad91: Customizable shortcuts:

  - New optional entry `shortcutter/keymap`:
    - `createKeymap()` declares commands as data;
    - `remap()` throws a `KeymapConflictError` on conflicts (`{ force: true }` takes the keys over); `disable()` and `reset()`;
    - `overrides()` returns the user's changes as plain JSON, restored with the `overrides` option;
    - `conflicts()` covers overlapping contexts and wildcards;
    - `reserved()` names combinations the browser or OS keeps;
    - `subscribe()` for settings screens.
  - New optional entry `shortcutter/record`: `recordShortcut()` captures a combination from the keyboard, pausing the shortcutter's shortcuts while it records. Escape cancels.
  - Core: `watch(listener)` is called when shortcuts are added or removed and when contexts change.
  - Adapters:
    - React, Vue and Svelte: `useShortcuts()`, `useKeymap()` and `useRecorder()`;
    - Solid: `createShortcuts()`, `createKeymapCommands()` and `createRecorder()`.
  - New guides: "Customizable shortcuts" and "Accessibility (WCAG 2.1.4)".

- 4e911ed: Keyboard layouts:

  - New `match` option: `createShortcutter({ match: 'key' })` matches letters by the **printed** letter (`KeyboardEvent.key`) instead of the physical key, so `Control+Z` follows the key labelled Z on QWERTZ, AZERTY and Dvorak too. Digits, punctuation and named keys stay physical, and non-Latin layouts fall back to the physical key. The default stays `'code'`.
  - AltGr no longer triggers `Control+Alt` shortcuts on Windows and Linux, so typing `ą`, `@` or `€` cannot fire them. Shortcuts pressed with the left Alt key are unchanged; macOS is unaffected.
  - `shortcutter/format`: new `getLayoutLabels()` returns labels for the user's layout (Keyboard Map API, Chromium), so a help screen shows `Ctrl+Z` for the shortcut registered as `Control+Y` on QWERTZ.

### Patch Changes

- 857a0c7: Adds a `funding` link to GitHub Sponsors, so `npm fund` lists Shortcutter and npm shows a sponsor link.
- 4b9541e: Fixes a `TypeError` when a shortcut string contains a key named like an `Object.prototype` member, such as `constructor` or `__proto__`; `shortcutter/format` no longer returns a function as the label for such keys. Found by the new property-based tests.
- 00d2363: Security: wildcard shortcuts could take seconds to hours to match (regular-expression denial of service). A key with many `*` (`'a*a*a*a*a*a*b'`) was turned into a backtracking regex, and many wildcard keys in one shortcut were assigned by trying every order. Both are now polynomial: a two-pointer `*` matcher and a bipartite matching. Matching results are unchanged. Only affects apps that register shortcut strings from untrusted input, such as user-defined shortcuts.
- Updated dependencies [f3fad91]
- Updated dependencies [857a0c7]
- Updated dependencies [4e911ed]
- Updated dependencies [4b9541e]
- Updated dependencies [00d2363]
  - shortcutter@0.5.0

## 0.4.0

### Minor Changes

- Key labels, type-checked shortcuts and pressed-keys hooks.

  **New**

  - `shortcutter/format`: `formatShortcut()` and `formatKeys()` turn a shortcut or the `keys` of a `shortcuts()` entry into the labels people expect: `⇧⌘K` on macOS, `Ctrl+Shift+K` elsewhere. Arrows, punctuation, numpad keys and wildcards get readable labels, and `labels` / `separator` customise them. An optional entry (about 0.7 kB gzipped), also as `dist/format.iife.js` (`window.ShortcutterFormat`).
  - Literal shortcut strings are type-checked: `listen('Ctlr+K', …)` or `listen('Control+/', …)` (the key is `Slash`) is a TypeScript error naming the unknown key, instead of a shortcut that never fires. This covers `listen`, `unlisten`, `isPressed`, `resolve`, `sequences.listen`, the formatters and every adapter hook and attachment. Shortcuts in `string` variables are not checked. New types: `ShortcutString<S>`, `SequenceString<S>` and `KeyName`.
  - Pressed-keys hooks: `usePressedKeys()` in `@shortcutter/react`, `@shortcutter/vue` and `@shortcutter/svelte`, and `createPressedKeys()` in `@shortcutter/solid`, for HUDs, key visualizers and games.

  **Upgrading**

  Code that passes an invalid literal shortcut now fails to type-check. Such shortcuts never fired, so fix the key name (the error says which one) or pass a `string`.

### Patch Changes

- Updated dependencies
  - shortcutter@0.4.0

## 0.3.0

### Minor Changes

- A rewrite of the API, with framework adapters, optional sequences and a new toolchain. Breaking: see "Migrating from 0.2" in the README.

  **Breaking changes**

  - `useShortcutter()` is replaced by `createShortcutter()`, and `eventTarget` by `target`.
  - Shortcuts are strings such as `'ControlOrMeta+K'` instead of key arrays: `listen('Control+K', handler, { context, phases })` instead of `listen('ctx', ['controlleft', 'k'], handler, PHASES.DOWN)`.
  - `PHASES` is removed: phases are `'down'`, `'press'` and `'up'`, or an array of them. The default is now `'down'` only (was down and press).
  - Handlers get `(event, { phase, shortcut, pattern, context, description })` instead of `(event, phase)`.
  - `setActiveContext()` / `getActiveContext()` are replaced by `contexts.activate(...names)`, `contexts.active()` and `contexts.isActive(name)`.
  - Listeners are no longer removed on `unload`: call `destroy()` or pass a `signal`.
  - `'down'` no longer fires again for the keys left after one is released.

  **New**

  - Case- and order-insensitive shortcut strings with aliases (`Ctrl`, `Cmd`, `Option`, `Esc`, …), left/right modifiers matched alike, and `ControlOrMeta` (⌘ on macOS, Ctrl elsewhere).
  - Wildcards: `'Shift+Arrow*'`, `'Digit*'`, `'Key*'`, `'F*'`, `'Control+*'`.
  - `description` on shortcuts and `shortcuts()` to build keyboard help screens; `resolve()` for platform keys.
  - `isPressed()`, `pressed()`, `subscribe()` and `observe()` for held keys and every key phase (key visualizers, games).
  - Optional key sequences (`'G I'`) from `shortcutter/sequences`, also as `dist/sequences.iife.js`.
  - Input guard (form fields, contenteditable, IME), `preventDefault` option, SSR-safe import, `destroy()` and `signal`.
  - Framework adapters: `@shortcutter/react`, `@shortcutter/vue`, `@shortcutter/svelte` and `@shortcutter/solid`, with sequence hooks.

  **Fixes**

  - Keys no longer stay pressed after Cmd on macOS, after switching windows or tabs, or after leaving the page; modifiers pressed or released outside the page are corrected from the event flags.
  - `listen()` no longer sorts the caller's key array in place.

  **Package**

  - ESM, CommonJS and a minified `<script>` build (`window.Shortcutter`), with types for both module systems; zero dependencies, tree-shakeable, under 3 kB gzipped.

### Patch Changes

- Updated dependencies
  - shortcutter@0.3.0
