/** @jsxImportSource solid-js */
import { createShortcut } from '@shortcutter/solid';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { currentDemo, onDemoChange } from '../active';

export default function Counter() {
  const [count, setCount] = createSignal(0);
  const [active, setActive] = createSignal(false);

  onMount(() => {
    setActive(currentDemo() === 'solid');
    onCleanup(onDemoChange((id) => setActive(id === 'solid')));
  });

  createShortcut(
    'K',
    () => setCount((c) => c + 1),
    () => ({ enabled: active() }),
  );
  createShortcut(
    'J',
    () => setCount((c) => c - 1),
    () => ({ enabled: active() }),
  );
  createShortcut(
    'Shift+K',
    () => setCount((c) => c + 10),
    () => ({ enabled: active() }),
  );
  createShortcut(
    'Shift+J',
    () => setCount((c) => c - 10),
    () => ({ enabled: active() }),
  );

  return (
    <div class="demo-counter">
      <output>{count()}</output>
      <p>Solid</p>
    </div>
  );
}
