---
'shortcutter': minor
'@shortcutter/react': minor
'@shortcutter/vue': minor
'@shortcutter/svelte': minor
'@shortcutter/solid': minor
---

Key labels, type-checked shortcuts and pressed-keys hooks.

**New**

- `shortcutter/format`: `formatShortcut()` and `formatKeys()` turn a shortcut or the `keys` of a `shortcuts()` entry into the labels people expect: `⇧⌘K` on macOS, `Ctrl+Shift+K` elsewhere. Arrows, punctuation, numpad keys and wildcards get readable labels, and `labels` / `separator` customise them. An optional entry (about 0.7 kB gzipped), also as `dist/format.iife.js` (`window.ShortcutterFormat`).
- Literal shortcut strings are type-checked: `listen('Ctlr+K', …)` or `listen('Control+/', …)` (the key is `Slash`) is a TypeScript error naming the unknown key, instead of a shortcut that never fires. This covers `listen`, `unlisten`, `isPressed`, `resolve`, `sequences.listen`, the formatters and every adapter hook and attachment. Shortcuts in `string` variables are not checked. New types: `ShortcutString<S>`, `SequenceString<S>` and `KeyName`.
- Pressed-keys hooks: `usePressedKeys()` in `@shortcutter/react`, `@shortcutter/vue` and `@shortcutter/svelte`, and `createPressedKeys()` in `@shortcutter/solid`, for HUDs, key visualizers and games.

**Upgrading**

Code that passes an invalid literal shortcut now fails to type-check. Such shortcuts never fired, so fix the key name (the error says which one) or pass a `string`.
