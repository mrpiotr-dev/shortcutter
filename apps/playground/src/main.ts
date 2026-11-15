import { useShortcutter } from 'shortcutter';

const logEl = document.querySelector<HTMLDivElement>('#log')!;
const contextsEl = document.querySelector<HTMLElement>('#contexts')!;

const log = (message: string) => {
  logEl.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${logEl.textContent ?? ''}`;
};
const renderContexts = () => {
  contextsEl.textContent = shortcutter.getActiveContext().join(', ');
};

const shortcutter = useShortcutter();

shortcutter.listen('default', ['a', 's'], (_event, phase) => log(`[default] a+s → ${phase}`), [
  'down',
  'press',
  'up',
]);

shortcutter.listen('modal', ['q'], (_event, phase) => log(`[modal] q → ${phase}`), 'down');

const toggleModal = () => {
  const next = shortcutter.getActiveContext().includes('modal') ? 'default' : 'modal';
  shortcutter.setActiveContext(next);
  renderContexts();
  log(`active context → ${next}`);
};
shortcutter.listen('default', ['escape'], toggleModal, 'down');
shortcutter.listen('modal', ['escape'], toggleModal, 'down');

renderContexts();
