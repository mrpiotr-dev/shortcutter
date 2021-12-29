/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { useObserver } from '../observer';

describe('useObserver', () => {
  describe('press', () => {
    it('should save pressed key', () => {
      const observer = useObserver();
  
      observer.press('a');
  
      expect(observer.getPressed()).toEqual(['a']);
    });

    it('should save pressed key only once', () => {
      const observer = useObserver();
  
      observer.press('c');
      observer.press('c');
  
      expect(observer.getPressed()).toEqual(['c']);
    });

    it('should save different keys', () => {
      const observer = useObserver();
  
      observer.press('d');
      observer.press('e');
      observer.press('f');
  
      expect(observer.getPressed()).toEqual(['d', 'e', 'f']);
    });
  });

  describe('release', () => {
    it('should release pressed key', () => {
      const observer = useObserver();
  
      observer.press('g');
      observer.press('h');
      observer.press('i');

      observer.release('g');
      observer.release('h');
  
      expect(observer.getPressed()).toEqual(['i']);
    });
  });

  describe('releaseAll', () => {
    it('should release all stored keys', () => {
      const observer = useObserver();
  
      observer.press('j');
      observer.press('k');
      observer.press('l');
      observer.press('m');

      expect(observer.getPressed()).toEqual(['j', 'k', 'l', 'm']);

      observer.releaseAll();
  
      expect(observer.getPressed()).toEqual([]);
    });
  });

  describe('isPressed', () => {
    it('should return boolean information if key is pressed', () => {
      const observer = useObserver();
  
      observer.press('b');

      expect(observer.isPressed('a')).toBe(false);
      expect(observer.isPressed('b')).toBe(true);
      expect(observer.isPressed('c')).toBe(false);
    });
  });
});
