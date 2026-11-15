import { describe, expect, it } from 'vite-plus/test';
import * as api from '../src/index';

describe('publicAPI', () => {
  it('should expose only useShortcutter at runtime', () => {
    expect(Object.keys(api)).toEqual(['useShortcutter']);
  });

  it('should expose the shortcutter methods', () => {
    expect(Object.keys(api.useShortcutter({ eventTarget: new EventTarget() })).sort()).toEqual([
      'destroy',
      'getActiveContext',
      'hasContext',
      'listen',
      'setActiveContext',
      'unlisten',
    ]);
  });
});
