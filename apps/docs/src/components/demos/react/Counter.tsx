/** @jsxImportSource react */
import { useShortcut } from '@shortcutter/react';
import { useEffect, useState } from 'react';
import { currentDemo, onDemoChange } from '../active';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(currentDemo() === 'react');
    return onDemoChange((id) => setActive(id === 'react'));
  }, []);

  useShortcut('K', () => setCount((c) => c + 1), { enabled: active });
  useShortcut('J', () => setCount((c) => c - 1), { enabled: active });

  return (
    <div className="demo-counter">
      <output>{count}</output>
      <p>React</p>
    </div>
  );
}
