import { PHASES, PHASES_SEPARATOR } from './types';

export function normalizeKeyCode(code: string): string {
  return code.toLowerCase().replace(/key/, '');
}

export function normalizeShortcut(keys: string[]): string {
  return keys.sort().join('+').toLowerCase();
}

export function phasesIterator(phases: PHASES, shortcut: string , callback: (phasedShortcut: string, phase: PHASES) => void) {
  phases.split(PHASES_SEPARATOR).forEach((phase: string) => {
    callback(`${shortcut}_${phase}`, phase as PHASES);
  });
}
