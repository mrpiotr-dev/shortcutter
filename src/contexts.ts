/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { createGroup } from './group';

const ERROR_NOT_ADDED = (name: string) => `Group '${name}' is not added.`;
const ERROR_ALREADY_ADDED = (name: string) => `Group '${name}' is already added.`;

export function useContexts() {
  const ACTIVE_CONTEXTS: Set<string> = new Set();
  const AVAILABLE_CONTEXTS: Map<string, ReturnType<typeof createGroup>> = new Map();

  return {
    /**
     * Creates a new shortcuts' group.
     *
     * @param name The name of adding context. It will be used as its ID in getContext().
     */
    add(name: string) {
      if (AVAILABLE_CONTEXTS.has(name)) {
        throw new Error(ERROR_ALREADY_ADDED(name));
      }

      const group = createGroup(name);

      AVAILABLE_CONTEXTS.set(name, group);

      return group;
    },
    /**
     * TODO
     */
    clear() {
      AVAILABLE_CONTEXTS.clear();
    },
    /**
     * TODO
     */
    getActive() {
      return [...ACTIVE_CONTEXTS.values()];
    },
    /**
     * TODO
     * @param name
     */
    get(name: string) {
      if (!AVAILABLE_CONTEXTS.has(name)) {
        throw new Error(ERROR_NOT_ADDED(name));
      }

      return AVAILABLE_CONTEXTS.get(name)!;
    },
    /**
     * TODO
     */
    getAll() {
      return [...AVAILABLE_CONTEXTS.keys()];
    },
    /**
     * TODO
     */
    has(name: string) {
      return AVAILABLE_CONTEXTS.has(name);
    },
    /**
     * TODO
     * @param name
     */
    isActive(name: string) {
      return ACTIVE_CONTEXTS.has(name);
    },
    /**
     * TODO
     * @param name
     */
    remove(name: string) {
      if (!AVAILABLE_CONTEXTS.has(name)) {
        throw new Error(ERROR_NOT_ADDED(name));
      }

      AVAILABLE_CONTEXTS.delete(name);
    },
    /**
     * TODO
     */
    setActive(...contexts: string[]) {
      ACTIVE_CONTEXTS.clear();

      contexts.forEach((name: string) => {
        if (!AVAILABLE_CONTEXTS.has(name)) {
          throw new Error(ERROR_NOT_ADDED(name));
        }

        ACTIVE_CONTEXTS.add(name);
      });
    },
  } as const;
}
