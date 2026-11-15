# SHORTCUTTER

Tiny, dependency-free library to manage keyboard shortcuts in your application.

## Getting started

1. Install the library from [npm](https://www.npmjs.com/package/shortcutter) registry:

```
pnpm add shortcutter
```

2. Import the necessary parts into your project:

```js
import { useShortcutter } from 'shortcutter';
```

3. Use `shortcutter` to start using shortcuts:

```js
const shortcutter = useShortcutter();
```

4. Add your first key binding

```js
shortcutter.listen(
  // context, where you would like to add a shortcut
  'default',
  // keys, which invoke callback
  ['a', 's'],
  // callback which `shortcutter` should invoke
  (event, phase) => alert(`My first key binding on ${phase}`),
  // phases when `shortcutter` should invoke callback (default: ['down', 'press'])
  ['down', 'press', 'up'],
);
```

5. Open your test application in browser, and press <kbd>A</kbd> + <kbd>S</kbd>

## API

### Types

#### `Phase` / `Phases`

A phase is the moment a shortcut's callback runs. Pass one phase or an array of phases.

| Phase     | When                                                       |
| --------- | ---------------------------------------------------------- |
| `'down'`  | all keys of the shortcut became pressed                    |
| `'press'` | the shortcut is held and the browser repeats the key       |
| `'up'`    | a key of the shortcut was released (or another key joined) |

```ts
type Phase = 'down' | 'press' | 'up';
type Phases = Phase | readonly Phase[];
```

### Interfaces

#### `useShortcutter`

Returns interface to control contexts and shortcuts. Safe to call during SSR: without a `window` (and no `eventTarget`) it attaches no listeners.

```ts
const { listen, unlisten, hasContext, getActiveContext, setActiveContext, destroy } =
  useShortcutter({
    eventTarget: window, // optional, defaults to window
    defaultContext: 'default', // optional
    signal: controller.signal, // optional, aborting it calls destroy()
  });
```

#### `shortcutter.listen`

Adds a listener for defined keys into the shortcutter's context.

| Arguments | Type                                   | Description |
| --------- | -------------------------------------- | ----------- |
| context   | `string`                               | ---         |
| keys      | `string[]`                             | ---         |
| callback  | `(event: Event, phase: Phase) => void` | ---         |
| phases    | `Phases` (default `['down', 'press']`) | ---         |

Returns `shortcutter.unlisten`.

#### `shortcutter.unlisten`

Removes a listener for defined keys from the shortcutter's context.

| Arguments | Type       | Description |
| --------- | ---------- | ----------- |
| context   | `string`   | ---         |
| keys      | `string[]` | ---         |
| phases    | `Phases`   | ---         |

#### `shortcutter.hasContext`

Checks if a passed context is already added to `Shortcutter`.

| Arguments | Type     | Description |
| --------- | -------- | ----------- |
| name      | `string` | ---         |

#### `shortcutter.getActiveContext`

Returns active context's name.

#### `shortcutter.setActiveContext`

Sets passed context as the active one.

| Arguments | Type     | Description |
| --------- | -------- | ----------- |
| name      | `string` | ---         |

#### `shortcutter.destroy`

Removes all keyboard listeners; registered shortcuts stop firing. Call it when your app or component unmounts.

## Migrating from 0.2

- `PHASES` is no longer exported. Replace `PHASES.DOWN` with `'down'`, `PHASES.DOWN_UP` with `['down', 'up']`, and so on.
- Listeners are no longer removed on `unload`. Call `destroy()` or pass a `signal`.

## Versioning

This library follows [Semantic Versioning](https://semver.org/).

## License

`Shortcutter` is available under the MIT license. See the [LICENSE](./LICENSE) file for more details.

Crafted with :heart: to :clipboard: and :key:
