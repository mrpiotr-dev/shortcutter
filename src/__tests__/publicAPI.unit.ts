/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES, useShortcutter} from '../index';

describe('publicAPI', () => {
  it('should expose a particular parts of lib', () => {
    expect(PHASES.DOWN).toBe('down');
    expect(PHASES.DOWN_PRESS).toBe('down|press');
    expect(PHASES.DOWN_PRESS_UP).toBe('down|press|up');
    expect(PHASES.DOWN_UP).toBe('down|up');
    expect(PHASES.PRESS).toBe('press');
    expect(PHASES.PRESS_UP).toBe('press|up');
    expect(PHASES.UP).toBe('up');

    expect(useShortcutter()).toBeDefined(); 
  });
});
