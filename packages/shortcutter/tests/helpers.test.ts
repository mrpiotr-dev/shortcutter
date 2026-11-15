/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { describe, expect, it, vi } from 'vite-plus/test';
import { normalizeShortcut, phasesIterator } from '../src/helpers';
import { PHASES } from '../src/types';

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

    it('should not mutate the passed keys', () => {
      const keys = ['z', 'ctrl', 'shift'];

      normalizeShortcut(keys);

      expect(keys).toEqual(['z', 'ctrl', 'shift']);
    });

    it('should give the same result regardless of letter case', () => {
      expect(normalizeShortcut(['S', 'a'])).toBe('a+s');
      expect(normalizeShortcut(['s', 'A'])).toBe('a+s');
    });
  });

  describe('phasesIterator', () => {
    it('should iteratee after each phase', () => {
      const mock = vi.fn();

      phasesIterator(PHASES.DOWN_PRESS_UP, 'ctrl+shift+z', mock);

      expect(mock).toBeCalledTimes(3);
      expect(mock).toHaveBeenNthCalledWith(1, 'ctrl+shift+z_down', 'down');
      expect(mock).toHaveBeenNthCalledWith(2, 'ctrl+shift+z_press', 'press');
      expect(mock).toHaveBeenNthCalledWith(3, 'ctrl+shift+z_up', 'up');
    });
  });
});
