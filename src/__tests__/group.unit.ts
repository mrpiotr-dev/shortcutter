/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES } from '..';
import { createGroup } from '../group';

describe('createGroup', () => {
  it('should throw an exception if tries to create a now context without name', () => {
    expect(() => {
      createGroup('');
    }).toThrowError('Group has to has a name.');
  });

  describe('add', () => {
    it('should add passed shortcut under the default phases', () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback);

      expect(group.getAll()).toEqual([
        'a_start',
        'a_continue',
      ]);
    });

    it('should add shortcut under the passed phases', () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback, PHASES.CONTINUE_END);

      expect(group.getAll()).toEqual([
        'a_continue',
        'a_end',
      ]);
    });

    it('should throw an error if shortcut is already registered under particular phase', () => {
      const groupName = 'context';
      const group = createGroup(groupName);
      const callback = jest.fn();
      const phase = PHASES.START;
      const key = 'a';

      group.add([key], callback, phase);

      expect(() => {
        group.add([key], callback, phase);
      }).toThrowError(`Shortcut "${key}" in "${phase}" phase is already added to "${groupName}" group.`);
    });
  });

  describe('get', () => {
    it('should throw an exception if there is no looking shortcut', () => {
      const groupName = 'context';
      const group = createGroup(groupName);
      const callback = jest.fn();
      const key = 'a';

      group.add([key], callback);

      expect(() => {
        group.get([key], PHASES.END);
      }).toThrowError(`Shortcut "${key}" in "${PHASES.END}" phase does not exist in "${groupName}" group.`)
    });

    it(`should get shourtcut's callback`, () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback);

      expect(group.get(['a'], PHASES.START)).toBe(callback);
    });
  });

  describe('has', () => {
    it('should check if shortcut is added to group', () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback);

      expect(group.has(['a'], PHASES.START)).toBe(true);
      expect(group.has(['a'], PHASES.END)).toBe(false);
      expect(group.has(['b'], PHASES.START)).toBe(false);
    });
  });

  describe('remove', () => {
    it('should throw an error if tries to remove non existing shortcut', () => {
      const shortcut = 'a';
      const phase = PHASES.START;
      const groupName = 'context';
      const group = createGroup(groupName);

      expect(() => {
        group.remove([shortcut], phase);
      }).toThrowError(`Shortcut "${shortcut}" in "${phase}" phase does not exist in "${groupName}" group.`)
    });

    it('should remove shortcut from group', () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback);
      group.add(['b'], callback);
      group.add(['c'], callback);

      expect(group.getAll()).toEqual([
        'a_start',
        'a_continue',
        'b_start',
        'b_continue',
        'c_start',
        'c_continue',
      ]);

      group.remove(['a'], PHASES.START);
      group.remove(['b']);
      group.remove(['c'], PHASES.CONTINUE);

      expect(group.getAll()).toEqual([
        'a_continue',
        'c_start',
      ]);
    });
  });

  describe('clear', () => {
    it('should remove all saved shortcut from group', () => {
      const group = createGroup('context');
      const callback = jest.fn();

      group.add(['a'], callback);
      group.add(['b'], callback);
      group.add(['c'], callback);

      expect(group.getAll()).toEqual([
        'a_start',
        'a_continue',
        'b_start',
        'b_continue',
        'c_start',
        'c_continue',
      ]);

      group.clear();

      expect(group.getAll()).toEqual([]);
    });
  });
});
