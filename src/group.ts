import { normalizeShortcut, phasesIterator } from './helpers';
import { PHASES } from './types';

export function createContext(contextName: string) {
  if (typeof contextName !== 'string' || contextName.length < 1) {
    throw new Error('Context has to has a name.');
  }

  const SHORTCUTS: Map<string, unknown> = new Map();

  return {
    add: (shortcut: string[], callback: unknown, phases: PHASES = PHASES.DOWN_PRESS) => {
      const normalizedShortcut = normalizeShortcut(shortcut);

      phasesIterator(phases, normalizedShortcut, (phasedShortcut, phase) => {
        if (SHORTCUTS.has(phasedShortcut)) {
          throw new Error(`Shortcut "${shortcut}" is already added to "${phase}" phase.`);
        }

        SHORTCUTS.set(phasedShortcut, callback);
      });
    },
    get(shortcut: string[], phase: PHASES): unknown {
      const phasedShortcut = `${shortcut}_${phase}`;

      if (!SHORTCUTS.has(phasedShortcut)) {
        throw new Error(`Shortcut "${shortcut}" does not exist in "${contextName}" context.`);
      }
    
      return SHORTCUTS.get(phasedShortcut);
    },
    remove(shortcut: string[], phases: PHASES = PHASES.DOWN_PRESS): void {
      const normalizedShortcut = normalizeShortcut(shortcut);

      phasesIterator(phases, normalizedShortcut, (phasedShortcut) => {
        if (!SHORTCUTS.has(phasedShortcut)) {
          throw new Error(`Shortcut "${shortcut}" does not exist in "${contextName}" context.`);
        }
      
        SHORTCUTS.delete(phasedShortcut);
      });
    },
    getAll(): string[] {
      return [...SHORTCUTS.keys()];
    },
    clear() {
      SHORTCUTS.clear();
    },
  };
}
