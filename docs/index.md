---
layout: default
title: shortcutter
---

## Getting started

1) Install the library from [npm](https://www.npmjs.com/package/shortcutter) registry:
```
npm install --save shortcutter
```

2) Import the necessary parts into your project:
```js
import {PHASES, useShortcutter} from 'shortcutter';
```

3) Use `shortcutter` to start using shortcuts:
```js
const shortcutter = useShortcutter();
```

4) Add your first key binding
```js
shortcutter.listen(
  // context, where you would like to add a shortcut
  'default', 
  // keys, which invoke callback
  ['a', 's'],
  // callback which `shortcutter` should invoke
  (event: Event, phase: PHASES) => alert(`My first key binding on ${phase}`),
  // phases when `shortcutter` should invoke callback 
  PHASES.DOWN_PRESS_UP,
);
```

5) Open your test application in browser, and press <kbd>A</kbd> + <kbd>S</kbd>

## API
### Types
#### PHASES
The string-type `PHASES` contains all possible variants of the shortcut's status.

| Variant | Value |
| --- | --- |
| `PHASES.DOWN` | `down` |
| `PHASES.PRESS` | `press` |
| `PHASES.UP` | `up` |
| `PHASES.DOWN_PRESS` | `down\|press` |
| `PHASES.DOWN_UP` | `down\|up` |
| `PHASES.PRESS_UP` | `press\|up` |
| `PHASES.DOWN_PRESS_UP` | `down\|press\|up` |

### Interfaces
#### `useShortcutter`
Returns interface to control contexts and shortcuts.
```
const {
  listen,
  unlisten,
  hasContext,
  getActiveContext
  setActiveContext
} = useShortcutter();
```

#### `shortcutter.listen`
Adds a listener for defined keys into the shortcutter's context.

| Arguments | Type |Description |
| --- | --- | --- |
| context | `string` | --- |
| keys | `string[]`  | --- |
| callback | `(event: Event, phases: PHASES) => void` | --- |
| phases | `PHASES` | --- |

Returns `shortcutter.unlisten`.

#### `shortcutter.unlisten`
Removes a listener for defined keys from the shortcutter's context.

| Arguments | Type |Description |
| --- | --- | --- |
| context | `string` | --- |
| keys | `string[]`  | --- |
| phases | `PHASES` | --- |

#### `shortcutter.hasContext`
Checks if a passed context is already added to `Shortcutter`.

| Arguments | Type |Description |
| --- | --- | --- |
| name | `string` | --- |

#### `shortcutter.getActiveContext`
Returns active context's name.

#### `shortcutter.setActiveContext`
Sets passed context as the active one.

| Arguments | Type | Description |
| --- | --- | --- |
| name | `string` | --- |

## Versioning
This library follows [Semantic Versioning](https://semver.org/).

## License
`Shortcutter` is available under the MIT license. See the [LICENSE]({{ site.github.repository_url }}/blob/develop/LICENSE) file for more details.

Crafted with :heart: to :clipboard: and :key:
