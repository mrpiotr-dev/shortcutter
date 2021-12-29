/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES } from "../types";
import { phasesIterator } from "../utils";

describe('utils', () => {
  describe('phasesIterator', () => {
    it('should iteratee after each phase', () => {
      const mock = jest.fn();

      phasesIterator(PHASES.START_CONTINUE_END, 'ctrl+shift+z', mock);

      expect(mock).toBeCalledTimes(3);
      expect(mock).toHaveBeenNthCalledWith(1, 'ctrl+shift+z', 'start');
      expect(mock).toHaveBeenNthCalledWith(2, 'ctrl+shift+z', 'continue');
      expect(mock).toHaveBeenNthCalledWith(3, 'ctrl+shift+z', 'end');
    });
  });
});
