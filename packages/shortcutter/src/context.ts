/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { normalizeShortcut, phasesIterator } from './helpers';
import { DEFAULT_PHASES, type Phase, type Phases, type ShortcutCallback } from './types';

export function createContext(contextName: string) {
  if (typeof contextName !== 'string' || contextName.length < 1) {
    throw new Error('Context has to has a name.');
  }

  const SHORTCUTS: Map<string, ShortcutCallback> = new Map();

  return {
    add: (
      shortcut: readonly string[],
      callback: ShortcutCallback,
      phases: Phases = DEFAULT_PHASES,
    ) => {
      const normalizedShortcut = normalizeShortcut(shortcut);

      phasesIterator(phases, normalizedShortcut, (phasedShortcut, phase) => {
        if (SHORTCUTS.has(phasedShortcut)) {
          throw new Error(`Shortcut "${normalizedShortcut}" is already added to "${phase}" phase.`);
        }

        SHORTCUTS.set(phasedShortcut, callback);
      });
    },
    get(shortcut: readonly string[], phase: Phase) {
      const normalizedShortcut = normalizeShortcut(shortcut);
      const phasedShortcut = `${normalizedShortcut}_${phase}`;

      if (!SHORTCUTS.has(phasedShortcut)) {
        throw new Error(
          `Shortcut "${normalizedShortcut}" does not exist in "${contextName}" context.`,
        );
      }

      return SHORTCUTS.get(phasedShortcut);
    },
    has(shortcut: readonly string[], phase: Phase): boolean {
      const normalizedShortcut = normalizeShortcut(shortcut);
      const phasedShortcut = `${normalizedShortcut}_${phase}`;

      return SHORTCUTS.has(phasedShortcut);
    },
    remove(shortcut: readonly string[], phases: Phases = DEFAULT_PHASES): void {
      const normalizedShortcut = normalizeShortcut(shortcut);

      phasesIterator(phases, normalizedShortcut, (phasedShortcut) => {
        if (!SHORTCUTS.has(phasedShortcut)) {
          throw new Error(
            `Shortcut "${normalizedShortcut}" does not exist in "${contextName}" context.`,
          );
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
