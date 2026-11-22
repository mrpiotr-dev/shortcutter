---
'shortcutter': minor
'@shortcutter/react': minor
'@shortcutter/vue': minor
'@shortcutter/svelte': minor
'@shortcutter/solid': minor
---

Customizable shortcuts:

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
