import { describe, expect, it } from 'vite-plus/test';
import * as api from '../src/index';

describe('publicAPI', () => {
  it('exposes only createShortcutter at runtime', () => {
    expect(Object.keys(api)).toEqual(['createShortcutter']);
  });

  it('exposes the shortcutter methods', () => {
    const sc = api.createShortcutter({ target: new EventTarget() });

    expect(Object.keys(sc).sort()).toEqual([
      'contexts',
      'destroy',
      'listen',
      'pressed',
      'shortcuts',
      'subscribe',
      'unlisten',
    ]);
    expect(Object.keys(sc.contexts).sort()).toEqual(['activate', 'active', 'isActive']);
  });
});
