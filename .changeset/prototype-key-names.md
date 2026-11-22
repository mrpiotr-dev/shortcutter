---
'shortcutter': patch
'@shortcutter/react': patch
'@shortcutter/vue': patch
'@shortcutter/svelte': patch
'@shortcutter/solid': patch
---

Fixes a `TypeError` when a shortcut string contains a key named like an `Object.prototype` member, such as `constructor` or `__proto__`; `shortcutter/format` no longer returns a function as the label for such keys. Found by the new property-based tests.
