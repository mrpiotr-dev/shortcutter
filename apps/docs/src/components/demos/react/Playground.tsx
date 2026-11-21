/** @jsxImportSource react */
import { usePressedKeys, useShortcut } from '@shortcutter/react';
import { useState } from 'react';
import { formatKeys } from 'shortcutter/format';

/** Docs demo: a J/K counter and the keys held right now. */
export default function Playground() {
  const [count, setCount] = useState(0);
  const pressed = usePressedKeys();

  useShortcut('K', () => setCount((c) => c + 1));
  useShortcut('J', () => setCount((c) => c - 1));
  useShortcut('Shift+K', () => setCount((c) => c + 10));
  useShortcut('Shift+J', () => setCount((c) => c - 10));

  return (
    <div className="fw-demo">
      <output>{count}</output>
      <p>
        <kbd>K</kbd> up, <kbd>J</kbd> down, with <kbd>Shift</kbd> by 10
      </p>
      <p className="fw-demo-held" aria-live="polite">
        {pressed.length
          ? formatKeys(pressed).map((key) => <kbd key={key}>{key}</kbd>)
          : 'No keys held'}
      </p>
    </div>
  );
}
