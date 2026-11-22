---
'shortcutter': minor
'@shortcutter/react': minor
'@shortcutter/vue': minor
'@shortcutter/svelte': minor
'@shortcutter/solid': minor
---

Keyboard layouts:

- New `match` option: `createShortcutter({ match: 'key' })` matches letters by the **printed** letter (`KeyboardEvent.key`) instead of the physical key, so `Control+Z` follows the key labelled Z on QWERTZ, AZERTY and Dvorak too. Digits, punctuation and named keys stay physical, and non-Latin layouts fall back to the physical key. The default stays `'code'`.
- AltGr no longer triggers `Control+Alt` shortcuts on Windows and Linux, so typing `ą`, `@` or `€` cannot fire them. Shortcuts pressed with the left Alt key are unchanged; macOS is unaffected.
- `shortcutter/format`: new `getLayoutLabels()` returns labels for the user's layout (Keyboard Map API, Chromium), so a help screen shows `Ctrl+Z` for the shortcut registered as `Control+Y` on QWERTZ.
