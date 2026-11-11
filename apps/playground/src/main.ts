import { PHASES, useShortcutter } from 'shortcutter';

const logEl = document.querySelector<HTMLDivElement>('#log')!;
const contextsEl = document.querySelector<HTMLElement>('#contexts')!;

const log = (message: string) => {
  logEl.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${logEl.textContent ?? ''}`;
};
const renderContexts = () => {
  contextsEl.textContent = shortcutter.getActiveContext().join(', ');
};

const shortcutter = useShortcutter();

shortcutter.listen(
  'default',
  ['a', 's'],
  (_event, phase) => log(`[default] a+s → ${phase}`),
  PHASES.DOWN_PRESS_UP,
);

shortcutter.listen('modal', ['q'], (_event, phase) => log(`[modal] q → ${phase}`), PHASES.DOWN);

const toggleModal = () => {
  const next = shortcutter.getActiveContext().includes('modal') ? 'default' : 'modal';
  shortcutter.setActiveContext(next);
  renderContexts();
  log(`active context → ${next}`);
};
shortcutter.listen('default', ['escape'], toggleModal, PHASES.DOWN);
shortcutter.listen('modal', ['escape'], toggleModal, PHASES.DOWN);

renderContexts();
