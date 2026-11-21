/** @jsxImportSource solid-js */
import { createPressedKeys, createShortcut } from '@shortcutter/solid';
import { formatKeys } from 'shortcutter/format';
import { createSignal, For, Show } from 'solid-js';

/** Docs demo: a J/K counter and the keys held right now. */
export default function Playground() {
  const [count, setCount] = createSignal(0);
  const pressed = createPressedKeys();

  createShortcut('K', () => setCount((c) => c + 1));
  createShortcut('J', () => setCount((c) => c - 1));
  createShortcut('Shift+K', () => setCount((c) => c + 10));
  createShortcut('Shift+J', () => setCount((c) => c - 10));

  return (
    <div class="fw-demo not-content">
      <output>{count()}</output>
      <p>
        <kbd>K</kbd> up, <kbd>J</kbd> down, with <kbd>Shift</kbd> by 10
      </p>
      <p class="fw-demo-held" aria-live="polite">
        <Show when={pressed().length} fallback="No keys held">
          <For each={formatKeys(pressed())}>{(key) => <kbd>{key}</kbd>}</For>
        </Show>
      </p>
    </div>
  );
}
