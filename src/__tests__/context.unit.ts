/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { createContext } from '../context';

describe('createContext', () => {
  it('should throw an error if context has no name', () => {
    expect(() => {
      createContext('');
    }).toThrowError('Context has to has a name.');
  });

  describe('addShortcut', () => {
    it('should add passed shortcut under the default phases', () => {
      const shortcutContext = createContext('context');
      const callback = jest.fn();

      shortcutContext.add(['a'], callback);

      expect(shortcutContext.getAll()).toEqual([
        'a_down',
        'a_press',
      ]);
    });

    it('should throw an error if shortcut is already registered under particular phase', () => {
      const shortcutContext = createContext('context');
      const callback = jest.fn();

      shortcutContext.add(['a'], callback);

      expect(() => {
        shortcutContext.add(['a'], callback);
      }).toThrowError('Shortcut "a" is already added to "down" phase.');
    });
  });

});
