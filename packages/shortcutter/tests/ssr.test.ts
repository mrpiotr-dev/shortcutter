// @vitest-environment node

import { describe, expect, it } from 'vite-plus/test';

describe('SSR (no window)', () => {
  it('can be imported and used without a DOM', async () => {
    expect(typeof window).toBe('undefined');

    const { useShortcutter } = await import('../src/index');
    const sc = useShortcutter();

    expect(() => sc.listen('default', ['a'], () => {})).not.toThrow();
    expect(sc.getActiveContext()).toEqual(['default']);
  });
});
