/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

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
