import { createShortcutter } from '@shortcutter/core';

const logEl = document.querySelector<HTMLDivElement>('#log')!;
const contextsEl = document.querySelector<HTMLElement>('#contexts')!;

const log = (message: string) => {
  logEl.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${logEl.textContent ?? ''}`;
};

const shortcutter = createShortcutter();

const renderContexts = () => {
  contextsEl.textContent = shortcutter.contexts.active().join(', ');
};

shortcutter.listen('A+S', (_event, { phase }) => log(`[default] a+s → ${phase}`), {
  phases: ['down', 'press', 'up'],
});

shortcutter.listen('ControlOrMeta+K', () => log('[default] ControlOrMeta+K → command palette'), {
  preventDefault: true,
});

shortcutter.listen('Q', (_event, { phase }) => log(`[modal] q → ${phase}`), { context: 'modal' });

const toggleModal = () => {
  const next = shortcutter.contexts.isActive('modal') ? 'default' : 'modal';
  shortcutter.contexts.activate(next);
  renderContexts();
  log(`active context → ${next}`);
};
shortcutter.listen('Escape', toggleModal);
shortcutter.listen('Escape', toggleModal, { context: 'modal' });

renderContexts();
