/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES, PHASES_SEPARATOR, useShortcutter } from '../index';

describe('publicAPI', () => {
  it('should expose a particular parts of lib', () => {
    expect(PHASES_SEPARATOR).toBe('|');
    
    expect(PHASES.START).toBe('start');
    expect(PHASES.START_CONTINUE).toBe('start|continue');
    expect(PHASES.START_CONTINUE_END).toBe('start|continue|end');
    expect(PHASES.START_END).toBe('start|end');
    expect(PHASES.CONTINUE).toBe('continue');
    expect(PHASES.CONTINUE_END).toBe('continue|end');
    expect(PHASES.END).toBe('end');

    expect(useShortcutter()).toBeDefined(); 
  });
});
