/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { useContexts } from '../contexts';

describe('useContexts', () => {
  it('should expose API', () => {
    const ctxs = useContexts();

    expect(ctxs.add).toBeDefined();
    expect(ctxs.clear).toBeDefined();
    expect(ctxs.get).toBeDefined();
    expect(ctxs.getActive).toBeDefined();
    expect(ctxs.getAll).toBeDefined();
    expect(ctxs.has).toBeDefined();
    expect(ctxs.isActive).toBeDefined();
    expect(ctxs.remove).toBeDefined();
    expect(ctxs.setActive).toBeDefined();
  });

  describe('add', () => {
    it('should create and return a new context', () => {
      const ctxs = useContexts();

      const ctx = ctxs.add('ctx');

      expect(ctx.clear).toBeDefined();
    });

    it(`should throw an exeption if context's name is taken`, () => {
      const ctxs = useContexts();
      const contextName = 'ctx';

      ctxs.add(contextName);

      expect(() => {
        ctxs.add(contextName);
      }).toThrowError(`Group '${contextName}' is already added.`);
    });
  });

  describe('get', () => {
    it('should throw an exception if there is no context on passed name', () => {
      const ctxs = useContexts();
      const contextName = 'ctx';

      expect(() => {
        ctxs.get(contextName);
      }).toThrowError(`Group '${contextName}' is not added.`);
    });

    it('should return a created context', () => {
      const ctxs = useContexts();
      const contextName = 'ctx';

      ctxs.add(contextName);

      const ctx = ctxs.get(contextName);

      expect(ctx.clear).toBeDefined();
    });
  });

  describe('has', () => {
    it('should check if context is added', () => {
      const ctxs = useContexts();

      ctxs.add('ctx1');

      expect(ctxs.has('ctx')).toBe(false);
      expect(ctxs.has('ctx1')).toBe(true);
    });
  });

  describe('remove', () => {
    it(`should throw an exception if there is no context on the passed name`, () => {
      const ctxs = useContexts();
      const contextName = 'ctx';

      expect(() => {
        ctxs.remove(contextName);
      }).toThrowError(`Group '${contextName}' is not added.`);
    });

    it(`should remove chosen contexts`, () => {
      const ctxs = useContexts();
      
      ctxs.add('ctx1');
      ctxs.add('ctx2');
      ctxs.add('ctx3');

      expect(ctxs.getAll()).toEqual(['ctx1', 'ctx2', 'ctx3']);

      ctxs.remove('ctx2');

      
      expect(ctxs.getAll()).toEqual(['ctx1', 'ctx3']);
    });
  });

  describe('clear', () => {
    it('should remove all saved contexts', () => {
      const ctxs = useContexts();

      ctxs.add('ctx1');
      ctxs.add('ctx2');
      ctxs.add('ctx3');

      expect(ctxs.getAll()).toEqual(['ctx1', 'ctx2', 'ctx3']);

      ctxs.clear();

      expect(ctxs.getAll()).toEqual([]);
    });
  });

  describe('active contexts', () => {
    it('should keep added context in inactive state', () => {
      const ctxs = useContexts();

      ctxs.add('ctx1');
      ctxs.add('ctx2');
      ctxs.add('ctx3');

      expect(ctxs.getActive()).toEqual([]);
    });

    it('should set contexts into active state', () => {
      const ctxs = useContexts();

      ctxs.add('ctx1');
      ctxs.add('ctx2');
      ctxs.add('ctx3');

      ctxs.setActive('ctx1', 'ctx3');

      expect(ctxs.isActive('ctx1')).toBe(true);
      expect(ctxs.isActive('ctx2')).toBe(false);
      expect(ctxs.isActive('ctx3')).toBe(true);
    });

    it('should throw an exception if tries activate non existing group', () => {
      const ctxs = useContexts();
      const groupName = 'ctx';

      expect(() => {
        ctxs.setActive(groupName);
      }).toThrowError(`Group '${groupName}' is not added.`);
    });
  });
});
