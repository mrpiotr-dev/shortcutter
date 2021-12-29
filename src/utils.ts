import { PHASES, PHASES_SEPARATOR } from "./types";

export function phasesIterator(
  phases: PHASES,
  shortcut: string,
  callback: (phasedShortcut: string, phase: PHASES) => void,
): void {

  phases.split(PHASES_SEPARATOR).forEach((phase: string) => {
    callback(`${shortcut}`, phase as PHASES);
  });
}
