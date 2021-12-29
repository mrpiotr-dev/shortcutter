/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

export const enum PHASES {
  START = 'start',
  CONTINUE = 'continue',
  END = 'end',
  START_CONTINUE = 'start|continue',
  START_END = 'start|end',
  CONTINUE_END = 'continue|end',
  START_CONTINUE_END = 'start|continue|end',
}

export const PHASES_SEPARATOR = '|';
