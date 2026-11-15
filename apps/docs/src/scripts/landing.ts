// The landing page dogfoods shortcutter: every key interaction below goes through it.
import { createShortcutter, type ShortcutDetail, type ShortcutHandler } from 'shortcutter';
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
};

const label = (key: string) =>
  LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key[0]!.toUpperCase() + key.slice(1));

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

function log({ phase, shortcut, context }: ShortcutDetail): void {
  const item = document.createElement('li');
  const keys = labels(shortcut.split('+'));

  item.innerHTML = `<span class="log-context"></span><span class="log-keys"></span><span class="log-phase"></span>`;
  item.children[0]!.textContent = context;
  item.children[1]!.textContent = keys;
  item.children[2]!.textContent = phase;
  item.dataset.phase = phase;
  logEl.prepend(item);
  while (logEl.children.length > 5) logEl.lastElementChild!.remove();
}

/** Wraps a handler so every match shows up in the visualizer. */
const track =
  (handler: ShortcutHandler = () => {}): ShortcutHandler =>
  (event, detail) => {
    flash(detail.phase);
    log(detail);
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
  const button = $<HTMLButtonElement>('[data-copy]');

  try {
    await navigator.clipboard.writeText(INSTALL);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Press ⌘C';
  }
  setTimeout(() => (button.textContent = 'Copy'), 1500);
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

/* ---------- Contexts ---------- */

const palette = $<HTMLDialogElement>('[data-palette]');
let demo = 'typescript';

/** Contexts while the palette is closed: the TypeScript counter lives in its own context. */
function activateBase(): void {
  if (palette.open) return;
  if (demo === 'typescript') shortcutter.contexts.activate('default', 'counter');
  else shortcutter.contexts.activate('default');
  renderContexts();
}

/* ---------- Page shortcuts ---------- */

shortcutter.listen('ControlOrMeta+K', track(openPalette), { preventDefault: true });
shortcutter.listen('C', track(commands.copy));
shortcutter.listen('E', track(showExample));
shortcutter.listen('T', track(toggleTheme));
shortcutter.listen(
  'Alt',
  track((_event, { phase }) => document.body.classList.toggle('show-hints', phase === 'down')),
  { phases: ['down', 'up'] },
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
  'Escape',
  track(() => palette.close()),
  inPalette,
);
shortcutter.listen(
  'ArrowDown',
  track(() => select(selected + 1)),
  { ...inPalette, phases: ['down', 'press'] },
);
shortcutter.listen(
  'ArrowUp',
  track(() => select(selected - 1)),
  { ...inPalette, phases: ['down', 'press'] },
);
shortcutter.listen(
  'Enter',
  track(() => run(visible()[selected])),
  inPalette,
);

/* ---------- Framework demos ---------- */

const countEl = $<HTMLOutputElement>('[data-ts-count]');
let count = 0;
const setCount = (delta: number) => (countEl.value = String((count += delta)));

shortcutter.listen(
  'K',
  track(() => setCount(1)),
  { context: 'counter' },
);
shortcutter.listen(
  'J',
  track(() => setCount(-1)),
  { context: 'counter' },
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

tabKeys.listen('ArrowRight', move(1));
tabKeys.listen('ArrowLeft', move(-1));
tabKeys.listen('Home', () => showDemo(tabs[0]!, true));
tabKeys.listen('End', () => showDemo(tabs.at(-1)!, true));

document.documentElement.dataset.demo = demo;
activateBase();
