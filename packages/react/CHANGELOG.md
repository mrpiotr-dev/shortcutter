# @shortcutter/react

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
