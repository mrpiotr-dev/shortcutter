/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES, PHASES_SEPARATOR } from './types';

export function normalizeKeyCode(code: string): string {
  return code.toLowerCase().replace(/key/, '');
}

export function normalizeShortcut(keys: string[]): string {
  return keys.sort().join('+').toLowerCase();
}

export function phasesIterator(phases: PHASES, shortcut: string , callback: (phasedShortcut: string, phase: PHASES) => void): void {
  phases.split(PHASES_SEPARATOR).forEach((phase: string) => {
    callback(`${shortcut}_${phase}`, phase as PHASES);
  });
}
