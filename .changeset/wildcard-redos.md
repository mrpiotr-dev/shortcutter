---
'shortcutter': patch
'@shortcutter/react': patch
'@shortcutter/vue': patch
'@shortcutter/svelte': patch
'@shortcutter/solid': patch
---

Security: wildcard shortcuts could take seconds to hours to match (regular-expression denial of service). A key with many `*` (`'a*a*a*a*a*a*b'`) was turned into a backtracking regex, and many wildcard keys in one shortcut were assigned by trying every order. Both are now polynomial: a two-pointer `*` matcher and a bipartite matching. Matching results are unchanged. Only affects apps that register shortcut strings from untrusted input, such as user-defined shortcuts.
