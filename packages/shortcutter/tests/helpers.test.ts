import { describe, expect, it, vi } from 'vite-plus/test';
import { normalizeShortcut, phasesIterator } from '../src/helpers';

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

      phasesIterator(['down', 'press', 'up'], 'ctrl+shift+z', mock);

      expect(mock).toBeCalledTimes(3);
      expect(mock).toHaveBeenNthCalledWith(1, 'ctrl+shift+z_down', 'down');
      expect(mock).toHaveBeenNthCalledWith(2, 'ctrl+shift+z_press', 'press');
      expect(mock).toHaveBeenNthCalledWith(3, 'ctrl+shift+z_up', 'up');
    });

    it('should accept a single phase', () => {
      const mock = vi.fn();

      phasesIterator('up', 'a', mock);

      expect(mock.mock.calls).toEqual([['a_up', 'up']]);
    });

    it('should skip duplicated phases', () => {
      const mock = vi.fn();

      phasesIterator(['down', 'down'], 'a', mock);

      expect(mock).toBeCalledTimes(1);
    });

    it('should throw on an empty list', () => {
      expect(() => phasesIterator([], 'a', vi.fn())).toThrow('At least one phase is required.');
    });

    it('should throw on unknown phases, including the 0.2.0 "down|up" strings', () => {
      // @ts-expect-error -- runtime guard for JS users and old code
      expect(() => phasesIterator('down|up', 'a', vi.fn())).toThrow('Unknown phase "down|up"');
    });
  });
});
