/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { normalizeShortcut, phasesIterator } from '../helpers';
import { PHASES } from '../types';

describe('helpers', () => {
  describe('normalizeShortcut', () => {
    it('should return an empty string is no key is passed', () => {
      expect(normalizeShortcut([])).toBe('');
    });

    it('should convert shortcuts to the same order of plus-sign separated keys', () => {
      expect(normalizeShortcut(['z', 'ctrl', 'shift'])).toBe('ctrl+shift+z');
      expect(normalizeShortcut(['shift', 'z', 'ctrl'])).toBe('ctrl+shift+z');
      expect(normalizeShortcut(['shift', 'ctrl', 'z'])).toBe('ctrl+shift+z');
    });
  });

  describe('phasesIterator', () => {
    it('should iteratee after each phase', () => {
      const mock = jest.fn();

      phasesIterator(PHASES.DOWN_PRESS_UP, 'ctrl+shift+z', mock);

      expect(mock).toBeCalledTimes(3);
      expect(mock).toHaveBeenNthCalledWith(1, 'ctrl+shift+z_down', 'down');
      expect(mock).toHaveBeenNthCalledWith(2, 'ctrl+shift+z_press', 'press');
      expect(mock).toHaveBeenNthCalledWith(3, 'ctrl+shift+z_up', 'up');
    });
  });
});
