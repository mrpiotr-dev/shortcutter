/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { normalizeShortcut } from './helpers';
import { PHASES } from './types';
import { phasesIterator } from './utils';

const ERROR_REQUIRED_NAME = () => 'Group has to has a name.';
const ERROR_NOT_EXISTING = (shortcut: string, phase: PHASES, group: string) => `Shortcut "${shortcut}" in "${phase}" phase does not exist in "${group}" group.`;
const ERROR_ALREADY_ADDED = (shortcut: string, phase: PHASES, group: string) => `Shortcut "${shortcut}" in "${phase}" phase is already added to "${group}" group.`;

export function createGroup(groupName: string) {
  if (typeof groupName !== 'string' || groupName.length < 1) {
    throw new Error(ERROR_REQUIRED_NAME());
  }

  const SHORTCUTS: Map<string, (event:Event, phase: PHASES) => void> = new Map();

  return {
    add: (keys: string[], callback: (event:Event, phase: PHASES) => void, phases: PHASES = PHASES.START_CONTINUE) => {
      const normalizedShortcut = normalizeShortcut(keys);

      phasesIterator(phases, normalizedShortcut, (shortcut, phase) => {
        const phasedShortcut = `${shortcut}_${phase}`;

        if (SHORTCUTS.has(phasedShortcut)) {
          throw new Error(ERROR_ALREADY_ADDED(normalizedShortcut, phase, groupName));
        }

        SHORTCUTS.set(phasedShortcut, callback);
      });
    },
    get(keys: string[], phase: PHASES.START|PHASES.CONTINUE|PHASES.END) {
      const normalizedShortcut = normalizeShortcut(keys);
      const phasedShortcut = `${normalizedShortcut}_${phase}`;

      if (!SHORTCUTS.has(phasedShortcut)) {
        throw new Error(ERROR_NOT_EXISTING(normalizedShortcut, phase, groupName));
      }
    
      return SHORTCUTS.get(phasedShortcut);
    },
    has(keys: string[], phase: PHASES.START|PHASES.CONTINUE|PHASES.END): boolean {
      const normalizedShortcut = normalizeShortcut(keys);
      const phasedShortcut = `${normalizedShortcut}_${phase}`;

      return SHORTCUTS.has(phasedShortcut);
    },
    remove(keys: string[], phases: PHASES = PHASES.START_CONTINUE): void {
      const normalizedShortcut = normalizeShortcut(keys);

      phasesIterator(phases, normalizedShortcut, (shortcut, phase) => {
        const phasedShortcut = `${shortcut}_${phase}`;

        if (!SHORTCUTS.has(phasedShortcut)) {
          throw new Error(ERROR_NOT_EXISTING(normalizedShortcut, phase, groupName));
        }
      
        SHORTCUTS.delete(phasedShortcut);
      });
    },
    getAll(): string[] {
      return [...SHORTCUTS.keys()];
    },
    clear(): void {
      SHORTCUTS.clear();
    },
  };
}
