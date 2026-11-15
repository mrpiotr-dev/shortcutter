/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASE_NAMES, type Phase, type Phases } from './types';

export function normalizeKeyCode(code: string): string {
  return code.toLowerCase().replace(/key/, '');
}

export function normalizeShortcut(keys: readonly string[]): string {
  return keys
    .map((key) => key.toLowerCase())
    .sort()
    .join('+');
}

export function phasesIterator(
  phases: Phases,
  shortcut: string,
  callback: (phasedShortcut: string, phase: Phase) => void,
): void {
  const list: readonly unknown[] = Array.isArray(phases) ? phases : [phases];

  if (list.length === 0) {
    throw new Error('At least one phase is required.');
  }

  new Set(list).forEach((phase) => {
    if (!PHASE_NAMES.includes(phase as Phase)) {
      throw new Error(`Unknown phase "${String(phase)}". Expected "down", "press" or "up".`);
    }

    callback(`${shortcut}_${phase as Phase}`, phase as Phase);
  });
}
