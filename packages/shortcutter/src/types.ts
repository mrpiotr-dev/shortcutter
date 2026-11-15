/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

/** A moment in a shortcut's life: keys became pressed, are held (key repeat), or were released. */
export type Phase = 'down' | 'press' | 'up';

/** One phase or a list of them, e.g. `'down'` or `['down', 'up']`. */
export type Phases = Phase | readonly Phase[];

export type ShortcutCallback = (event: Event, phase: Phase) => void;

export const PHASE_NAMES: readonly Phase[] = ['down', 'press', 'up'];

export const DEFAULT_PHASES: readonly Phase[] = ['down', 'press'];
