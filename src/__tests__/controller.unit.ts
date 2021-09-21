/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { useController } from '../controller';

describe('useController', () => {
  describe('press', () => {
    it('should save pressed key', () => {
      const ctr = useController();
  
      ctr.press('a');
  
      expect(ctr.getPressed()).toEqual(['a']);
    });

    it('should save pressed key only once', () => {
      const ctr = useController();
  
      ctr.press('c');
      ctr.press('c');
  
      expect(ctr.getPressed()).toEqual(['c']);
    });

    it('should save different keys', () => {
      const ctr = useController();
  
      ctr.press('d');
      ctr.press('e');
      ctr.press('f');
  
      expect(ctr.getPressed()).toEqual(['d', 'e', 'f']);
    });
  });

  describe('release', () => {
    it('should release pressed key', () => {
      const ctr = useController();
  
      ctr.press('g');
      ctr.press('h');
      ctr.press('i');

      ctr.release('g');
      ctr.release('h');
  
      expect(ctr.getPressed()).toEqual(['i']);
    });
  });

  describe('releaseAll', () => {
    it('should release all stored keys', () => {
      const ctr = useController();
  
      ctr.press('j');
      ctr.press('k');
      ctr.press('l');
      ctr.press('m');

      expect(ctr.getPressed()).toEqual(['j', 'k', 'l', 'm']);

      ctr.releaseAll();
  
      expect(ctr.getPressed()).toEqual([]);
    });
  });

  describe('isPressed', () => {
    it('should return boolean information if key is pressed', () => {
      const ctr = useController();
  
      ctr.press('b');

      expect(ctr.isPressed('a')).toBe(false);
      expect(ctr.isPressed('b')).toBe(true);
      expect(ctr.isPressed('c')).toBe(false);
    });
  });
});
