/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { normalizeShortcut } from '../helpers';

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
});
