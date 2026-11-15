// The landing page dogfoods shortcutter: every key interaction below goes through it.
import {
  createShortcutter,
  type ShortcutDetail,
  type ShortcutHandler,
  type ShortcutInfo,
} from 'shortcutter';
import { DEMO_EVENT } from '../components/demos/active';

const GITHUB = 'https://github.com/mrpiotr-dev/shortcutter';
const INSTALL = 'pnpm add shortcutter';

const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
const mac = /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? nav.platform ?? '');
const shortcutter = createShortcutter({ mac });

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

/* ---------- Key labels ---------- */

const LABELS: Record<string, string> = {
  control: 'Ctrl',
  meta: mac ? '⌘' : 'Meta',
  alt: mac ? '⌥' : 'Alt',
  shift: '⇧',
  escape: 'Esc',
  enter: '↵',
  space: 'Space',
  tab: 'Tab',
  backspace: '⌫',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  slash: '/',
  backslash: '\\',
  period: '.',
  comma: ',',
  semicolon: ';',
  quote: "'",
  backquote: '`',
  minus: '-',
  equal: '=',
  bracketleft: '[',
  bracketright: ']',
};

/** Wildcard keys, as listed by shortcuts(). */
const WILDCARD_LABELS: Record<string, string> = {
  'digit*': '0–9',
  'key*': 'A–Z',
  'arrow*': '←↑→↓',
  'f*': 'F1–F24',
  '*': 'any key',
};

const label = (key: string) =>
  LABELS[key] ??
  WILDCARD_LABELS[key] ??
  (key.length === 1 ? key.toUpperCase() : key[0]!.toUpperCase() + key.slice(1)).replace('*', '…');

/** Modifiers first, the way people write shortcuts: ⌘ + K, not K + ⌘. */
const MODIFIER_ORDER = ['control', 'meta', 'alt', 'shift'];
const rank = (key: string) => (MODIFIER_ORDER.includes(key) ? MODIFIER_ORDER.indexOf(key) : 9);
const labels = (keys: string[]) =>
  [...keys]
    .sort((a, b) => rank(a) - rank(b))
    .map(label)
    .join(' + ');

const keycap = (text: string, pressed = false) => {
  const kbd = document.createElement('kbd');
  kbd.className = pressed ? 'keycap is-pressed' : 'keycap';
  kbd.textContent = text;
  return kbd;
};

document.querySelectorAll('[data-mod]').forEach((el) => (el.textContent = mac ? '⌘' : 'Ctrl'));
document
  .querySelectorAll('[data-alt]')
  .forEach((el) => (el.textContent = mac ? '⌥ Option' : 'Alt'));

/* ---------- Visualizer ---------- */

const pressedEl = $<HTMLElement>('[data-pressed]');
const emptyEl = pressedEl.firstElementChild!;
const shortcutEl = $<HTMLElement>('[data-shortcut]');
const contextsEl = $<HTMLElement>('[data-contexts]');
const logEl = $<HTMLOListElement>('[data-log]');

function renderPressed(keys: string[]): void {
  const ordered = [...keys].sort((a, b) => rank(a) - rank(b));

  pressedEl.replaceChildren(
    ...(ordered.length ? ordered.map((key) => keycap(label(key), true)) : [emptyEl]),
  );
  shortcutEl.textContent = ordered.length ? labels(ordered) : '–';
}

// The library reports every change of the held keys, including keys released because the page was
// left, hidden or lost focus.
shortcutter.subscribe(renderPressed);

function renderContexts(): void {
  contextsEl.textContent = shortcutter.contexts.active().join(', ');
}

function flash(phase: string): void {
  const el = document.querySelector(`[data-phase="${phase}"]`);

  el?.classList.remove('lit');
  void (el as HTMLElement | null)?.offsetWidth; // restart the animation
  el?.classList.add('lit');
}

function log({ phase, shortcut }: { phase: string; shortcut: string }): void {
  const item = document.createElement('li');

  item.innerHTML = `<span class="log-context"></span><span class="log-keys"></span><span class="log-phase"></span>`;
  item.children[0]!.textContent = '–';
  item.children[1]!.textContent = labels(shortcut.split('+'));
  item.children[2]!.textContent = phase;
  item.dataset.phase = phase;
  logEl.prepend(item);
  while (logEl.children.length > 6) logEl.lastElementChild!.remove();
}

// Every down, press and up of whatever is held, matched or not. observe() runs before handlers.
shortcutter.observe((_event, detail) => {
  flash(detail.phase);
  log(detail);
});

/** Wraps a handler so its log line shows the context that matched. */
const track =
  (handler: ShortcutHandler = () => {}): ShortcutHandler =>
  (event, detail: ShortcutDetail) => {
    const line = logEl.firstElementChild as HTMLElement | null;

    if (line) {
      line.classList.add('matched');
      line.children[0]!.textContent = detail.context;
    }
    handler(event, detail);
  };

/* ---------- Commands ---------- */

function toggleTheme(): void {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';

  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('starlight-theme', next);
  } catch {
    // Storage blocked: the theme still changes for this page view.
  }
}

async function copyInstall(): Promise<void> {
  const text = $<HTMLElement>('[data-copy-label]');

  try {
    await navigator.clipboard.writeText(INSTALL);
    text.textContent = 'Copied';
  } catch {
    text.textContent = 'Select it';
  }
  setTimeout(() => (text.textContent = 'Copy'), 1500);
}

function showExample(): void {
  $('#frameworks').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  $<HTMLElement>('[role="tab"][aria-selected="true"]').focus({ preventScroll: true });
}

const commands: Record<string, () => void> = {
  docs: () => location.assign('/docs/'),
  github: () => window.open(GITHUB, '_blank', 'noopener'),
  theme: toggleTheme,
  copy: () => void copyInstall(),
  example: showExample,
};

$('[data-copy]').addEventListener('click', () => void copyInstall());
$('[data-theme-toggle]').addEventListener('click', toggleTheme);
$('[data-open-help]').addEventListener('click', () => openHelp());

/* ---------- Contexts ---------- */

const palette = $<HTMLDialogElement>('[data-palette]');
const help = $<HTMLDialogElement>('[data-help]');
let demo = 'typescript';

/** Contexts while the palette is closed: the TypeScript counter lives in its own context. */
function activateBase(): void {
  if (palette.open || help.open) return;
  if (demo === 'typescript') shortcutter.contexts.activate('default', 'counter');
  else shortcutter.contexts.activate('default');
  renderContexts();
}

/* ---------- Page shortcuts ---------- */

shortcutter.listen('ControlOrMeta+K', track(openPalette), {
  preventDefault: true,
  description: 'Open the command palette',
});
shortcutter.listen('C', track(commands.copy), { description: 'Copy the install command' });
shortcutter.listen('E', track(showExample), { description: 'Jump to the live example' });
shortcutter.listen('T', track(toggleTheme), { description: 'Switch the colour theme' });
shortcutter.listen('Shift+Slash', track(openHelp), { description: 'Show all keyboard shortcuts' });
shortcutter.listen(
  'Alt',
  track((_event, { phase }) => {
    if (phase === 'down') renderHintBar();
    document.body.classList.toggle('show-hints', phase === 'down');
  }),
  { phases: ['down', 'up'], description: 'Hold to show shortcut hints' },
);

/* ---------- Help: everything below is generated from shortcuts() ---------- */

const keycaps = (keys: string[]) => {
  const span = document.createElement('span');

  span.className = 'keys';
  span.append(...keys.map((key) => keycap(label(key))));
  return span;
};

const described = (list: ShortcutInfo[]) => list.filter((info) => info.description);

function renderHintBar(): void {
  $('[data-hint-bar]').replaceChildren(
    ...described(shortcutter.shortcuts({ active: true })).map((info) => {
      const item = document.createElement('span');

      item.append(keycaps(info.keys), ` ${info.description}`);
      return item;
    }),
  );
}

function openHelp(): void {
  if (help.open || palette.open) return;

  const groups: [string, ShortcutInfo[]][] = [
    ['On this page', shortcutter.shortcuts({ active: true })],
    ['In the command palette', shortcutter.shortcuts({ context: 'palette' })],
    ['In the framework tabs', tabKeys.shortcuts()],
  ];

  $('[data-help-list]').replaceChildren(
    ...groups.map(([title, list]) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const rows = document.createElement('dl');

      heading.textContent = title;
      for (const info of described(list)) {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');

        dt.append(keycaps(info.keys));
        dd.textContent = info.description!;
        rows.append(dt, dd);
      }
      section.append(heading, rows);
      return section;
    }),
  );
  help.showModal();
  shortcutter.contexts.activate('help');
  renderContexts();
}

help.addEventListener('close', activateBase);
help.addEventListener('click', (event) => {
  if (event.target === help) help.close(); // backdrop
});
shortcutter.listen(
  'Escape',
  track(() => help.close()),
  { context: 'help', description: 'Close this list' },
);

/* ---------- Command palette ---------- */

const input = $<HTMLInputElement>('[data-palette-input]');
const options = [...palette.querySelectorAll<HTMLLIElement>('[data-command]')];
let selected = 0;

const visible = () => options.filter((option) => !option.hidden);

function select(index: number): void {
  const list = visible();

  selected = list.length ? (index + list.length) % list.length : 0;
  options.forEach((option) => option.setAttribute('aria-selected', 'false'));
  list[selected]?.setAttribute('aria-selected', 'true');
}

function run(option: HTMLElement | undefined): void {
  if (!option) return;
  palette.close();
  commands[option.dataset.command!]?.();
}

function openPalette(): void {
  if (palette.open) return;
  input.value = '';
  options.forEach((option) => (option.hidden = false));
  palette.showModal();
  shortcutter.contexts.activate('palette');
  renderContexts();
  select(0);
  input.focus();
}

palette.addEventListener('close', activateBase);
palette.addEventListener('click', (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>('[data-command]');

  if (option) run(option);
  else if (event.target === palette) palette.close(); // backdrop
});
input.addEventListener('input', () => {
  const query = input.value.trim().toLowerCase();

  options.forEach((option) => (option.hidden = !option.textContent!.toLowerCase().includes(query)));
  select(0);
});

// These work while typing in the search field, so they opt out of the input guard.
const inPalette = { context: 'palette', ignoreInputs: false, preventDefault: true } as const;

shortcutter.listen(
  'ArrowDown',
  track(() => select(selected + 1)),
  { ...inPalette, phases: ['down', 'press'], description: 'Next command' },
);
shortcutter.listen(
  'ArrowUp',
  track(() => select(selected - 1)),
  { ...inPalette, phases: ['down', 'press'], description: 'Previous command' },
);
shortcutter.listen(
  'Enter',
  track(() => run(visible()[selected])),
  { ...inPalette, description: 'Run the selected command' },
);
shortcutter.listen(
  'Escape',
  track(() => palette.close()),
  { ...inPalette, description: 'Close the palette' },
);

/* ---------- Framework demos ---------- */

const countEl = $<HTMLOutputElement>('[data-ts-count]');
let count = 0;
const setCount = (delta: number) => (countEl.value = String((count += delta)));

shortcutter.listen(
  'K',
  track(() => setCount(1)),
  { context: 'counter', description: 'Counter: add one' },
);
shortcutter.listen(
  'J',
  track(() => setCount(-1)),
  { context: 'counter', description: 'Counter: subtract one' },
);

const tablist = $<HTMLElement>('[role="tablist"]');
const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

function showDemo(tab: HTMLButtonElement, focus = false): void {
  demo = tab.dataset.demo!;
  tabs.forEach((other) => {
    const current = other === tab;

    other.setAttribute('aria-selected', String(current));
    other.tabIndex = current ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')!)!.hidden = !current;
  });
  if (focus) tab.focus();
  document.documentElement.dataset.demo = demo;
  window.dispatchEvent(new CustomEvent(DEMO_EVENT, { detail: demo }));
  activateBase();
}

tabs.forEach((tab) => tab.addEventListener('click', () => showDemo(tab)));

// A second instance scoped to the tab list: arrow keys only move between tabs while it has focus.
const tabKeys = createShortcutter({ target: tablist, mac, preventDefault: true });
const move = (step: number) => () => {
  const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  showDemo(tabs[(index + step + tabs.length) % tabs.length]!, true);
};

tabKeys.listen('ArrowRight', move(1), { description: 'Next framework' });
tabKeys.listen('ArrowLeft', move(-1), { description: 'Previous framework' });
tabKeys.listen('Home', () => showDemo(tabs[0]!, true), { description: 'First framework' });
tabKeys.listen('End', () => showDemo(tabs.at(-1)!, true), { description: 'Last framework' });

// One wildcard shortcut for all number keys; detail.shortcut says which one was pressed.
shortcutter.listen(
  'Digit*',
  track((_event, { shortcut }) => {
    const tab = tabs[Number(shortcut) - 1];

    if (tab) showDemo(tab);
  }),
  { description: `Show a framework by its number (1–${tabs.length})` },
);

document.documentElement.dataset.demo = demo;
activateBase();
