// @vitest-environment node

import { describe, expect, it } from 'vite-plus/test';

describe('SSR (no window)', () => {
  it('can be imported and used without a DOM', async () => {
    expect(typeof window).toBe('undefined');

    const { createShortcutter } = await import('../src/index');
    const sc = createShortcutter();

    expect(() => sc.listen('ControlOrMeta+K', () => {})).not.toThrow();
    expect(sc.contexts.active()).toEqual(['default']);
    expect(() => sc.destroy()).not.toThrow();
  });
});
