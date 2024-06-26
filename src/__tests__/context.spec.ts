import { expect, test, it, describe, vi } from 'vitest';
import { createContext } from '../context';

describe('createContext', () => {
  it('should throw an error if context has no name', () => {
    expect(() => {
      createContext('');
    }).toThrowError('Context has to has a name.');
  });

  describe('addShortcut', () => {
    test('should add passed shortcut under the default phases', () => {
      const shortcutContext = createContext('context');
      const callback = vi.fn();

      shortcutContext.add(['a'], callback);

      expect(shortcutContext.getAll()).toEqual([
        'a_down',
        'a_press',
      ]);
    });

    it('should throw an error if shortcut is already registered under particular phase', () => {
      const shortcutContext = createContext('context');
      const callback = vi.fn();

      shortcutContext.add(['a'], callback);

      expect(() => {
        shortcutContext.add(['a'], callback);
      }).toThrowError('Shortcut "a" is already added to "down" phase.');
    });
  });

});
