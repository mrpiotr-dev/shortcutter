/**
 * Behaviour of the compared libraries in two game-input scenarios, in happy-dom. Each library runs
 * in its own process, so global listeners of one cannot affect another. shortcutter comes from
 * this repository's builds (run `pnpm run build` first).
 *
 * Usage: node scripts/compare/install.mjs <dir> && node scripts/compare/behaviour.mjs <dir>
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = resolve(process.argv[2] ?? '');
const only = process.argv[3];
const repo = fileURLToPath(new URL('../../', import.meta.url));

if (!process.argv[2]) throw new Error('Usage: node scripts/compare/behaviour.mjs <dir>');

/** A key as a browser reports it: code, key (upper case while Shift is held) and legacy keyCode. */
const KEYS = {
  A: { code: 'KeyA', key: 'a', keyCode: 65 },
  W: { code: 'KeyW', key: 'w', keyCode: 87 },
  D: { code: 'KeyD', key: 'd', keyCode: 68 },
  Shift: { code: 'ShiftLeft', key: 'Shift', keyCode: 16 },
};

/**
 * Hold A, add Shift, add W (which auto-repeats), release A, release W, press D (auto-repeats),
 * release Shift, release D. After each step: the directions held and whether the player sprints.
 */
const GAME = [
  ['down', 'A', ['A'], false],
  ['down', 'Shift', ['A'], true],
  ['down', 'W', ['A', 'W'], true],
  ['repeat', 'W', ['A', 'W'], true],
  ['up', 'A', ['W'], true],
  ['up', 'W', [], true],
  ['down', 'D', ['D'], true],
  ['repeat', 'D', ['D'], true],
  ['up', 'Shift', ['D'], false],
  ['up', 'D', [], false],
];

/** W and Shift held, the window loses focus (keyups happen elsewhere), back holding nothing, D. */
const ALT_TAB = [
  ['down', 'W', ['W'], false],
  ['down', 'Shift', ['W'], true],
  ['blur', null, [], false],
  ['down', 'D', ['D'], false],
  ['up', 'D', [], false],
];

/**
 * How each library is used by the game: `setup(lib)` returns `read()` → { held: [...], sprint }.
 * `module` is imported from the install directory (or this repository for shortcutter).
 */
const VARIANTS = {
  'shortcutter: isPressed()': {
    module: 'shortcutter',
    setup: ({ createShortcutter }) => {
      const sc = createShortcutter();
      return () => ({
        held: ['A', 'W', 'D'].filter((k) => sc.isPressed(k)),
        sprint: sc.isPressed('Shift'),
      });
    },
  },
  'shortcutter: listen() per key': {
    module: 'shortcutter',
    setup: ({ createShortcutter }) => {
      const sc = createShortcutter();
      const state = { A: false, W: false, D: false, Shift: false };
      for (const k of Object.keys(state)) {
        sc.listen(k, (_e, { phase }) => (state[k] = phase === 'down'), { phases: ['down', 'up'] });
      }
      return () => ({ held: ['A', 'W', 'D'].filter((k) => state[k]), sprint: state.Shift });
    },
  },
  'hotkeys-js: isPressed()': {
    module: 'hotkeys-js',
    setup: ({ default: hotkeys }) => {
      hotkeys('*', () => {}); // attaches the listeners
      return () => ({
        held: ['A', 'W', 'D'].filter((k) => hotkeys.isPressed(k.toLowerCase())),
        sprint: hotkeys.isPressed('shift'),
      });
    },
  },
  'keymaster: isPressed()': {
    module: 'keymaster',
    // keymaster does not list modifiers among the pressed keys; it exposes them as flags.
    setup:
      ({ default: key }) =>
      () => ({ held: ['A', 'W', 'D'].filter((k) => key.isPressed(k)), sprint: key.shift === true }),
  },
  '@tanstack/hotkeys: KeyStateTracker': {
    module: '@tanstack/hotkeys',
    setup: ({ KeyStateTracker }) => {
      const tracker = KeyStateTracker.getInstance();
      return () => ({
        held: ['A', 'W', 'D'].filter((k) => tracker.isKeyHeld(k)),
        sprint: tracker.isKeyHeld('Shift'),
      });
    },
  },
  'react-hotkeys-hook: isHotkeyPressed()': {
    module: 'react-hotkeys-hook',
    setup:
      ({ isHotkeyPressed }) =>
      () => ({
        held: ['A', 'W', 'D'].filter((k) => isHotkeyPressed(k.toLowerCase())),
        sprint: isHotkeyPressed('shift'),
      }),
  },
  ...bindingVariants('tinykeys', 'Shift+', ({ tinykeys }, down, up) => {
    tinykeys(window, down);
    tinykeys(window, up, { event: 'keyup' });
  }),
  ...bindingVariants('mousetrap', 'shift+', ({ default: Mousetrap }, down, up) => {
    for (const [combo, fn] of Object.entries(down)) Mousetrap.bind(combo, fn, 'keydown');
    for (const [combo, fn] of Object.entries(up)) Mousetrap.bind(combo, fn, 'keyup');
  }),
};

/** A keydown and a keyup binding per key, and the same with extra Shift+ bindings for every key. */
function bindingVariants(name, shiftPrefix, bind) {
  const make = (withShift) => ({
    module: name,
    setup: (lib) => {
      const state = { A: false, W: false, D: false, Shift: false };
      const down = {};
      const up = {};
      for (const k of Object.keys(state)) {
        const combo =
          name === 'mousetrap' ? k.toLowerCase() : k === 'Shift' ? 'Shift' : k.toLowerCase();
        down[combo] = () => (state[k] = true);
        up[combo] = () => (state[k] = false);
        if (withShift && k !== 'Shift') {
          down[shiftPrefix + combo] = () => (state[k] = true);
          up[shiftPrefix + combo] = () => (state[k] = false);
        }
      }
      bind(lib, down, up);
      return () => ({ held: ['A', 'W', 'D'].filter((k) => state[k]), sprint: state.Shift });
    },
  });
  return {
    [`${name}: a keydown and a keyup binding per key`]: make(false),
    [`${name}: the same, plus ${shiftPrefix}… bindings for every key`]: make(true),
  };
}

/** Runs one variant in this process and prints its score as JSON. */
async function runOne(variant) {
  const require = createRequire(join(dir, 'package.json'));
  const { Window } = await import(pathToFileURL(require.resolve('happy-dom')).href);
  const win = new Window({ url: 'https://example.test/' });

  for (const name of [
    'window',
    'document',
    'navigator',
    'KeyboardEvent',
    'FocusEvent',
    'Event',
    'HTMLElement',
    'Element',
    'Node',
  ]) {
    Object.defineProperty(globalThis, name, {
      value: name === 'window' ? win : win[name],
      configurable: true,
      writable: true,
    });
  }

  const { module, setup } = VARIANTS[variant];
  const url =
    module === 'shortcutter'
      ? pathToFileURL(join(repo, 'packages/core/dist/index.js')).href
      : pathToFileURL(require.resolve(module)).href;
  const lib = await import(url);
  const read = setup(lib);
  const held = new Set();

  const send = (type, name, repeat = false) => {
    const { code, key, keyCode } = KEYS[name];
    const shift = held.has('Shift');
    const event = new win.KeyboardEvent(type, {
      code,
      key: key.length === 1 && shift ? key.toUpperCase() : key,
      shiftKey: shift,
      repeat,
      bubbles: true,
      cancelable: true,
    });

    for (const field of ['keyCode', 'which'])
      Object.defineProperty(event, field, { value: keyCode });
    win.document.body.dispatchEvent(event);
  };

  const score = (steps) => {
    held.clear();
    let right = 0;

    for (const [action, name, expectHeld, expectSprint] of steps) {
      if (action === 'blur') {
        held.clear();
        win.dispatchEvent(new win.FocusEvent('blur'));
      } else if (action === 'up') {
        held.delete(name);
        send('keyup', name);
      } else {
        held.add(name);
        send('keydown', name, action === 'repeat');
      }

      const { held: got, sprint } = read();
      if (got.join() === expectHeld.join() && sprint === expectSprint) right += 1;
    }
    return right;
  };

  const game = score(GAME);
  // Release everything between the scenarios, as a real player would.
  for (const name of ['A', 'W', 'D', 'Shift']) send('keyup', name);
  const altTab = score(ALT_TAB);

  console.log(JSON.stringify({ game, altTab }));
}

if (only) {
  await runOne(only);
} else {
  console.log(
    `| Library | Game input (of ${GAME.length}) | Alt-tab (of ${ALT_TAB.length}) |\n| --- | --- | --- |`,
  );
  for (const variant of Object.keys(VARIANTS)) {
    const output = execFileSync(process.execPath, [fileURLToPath(import.meta.url), dir, variant], {
      encoding: 'utf8',
    });
    const { game, altTab } = JSON.parse(output.trim().split('\n').at(-1));
    console.log(`| ${variant} | ${game} | ${altTab} |`);
  }
}
