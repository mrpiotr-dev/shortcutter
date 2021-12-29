/**
 * @license
 * Copyright SLAVICTECH PIOTR LASZCZKOWSKI
 *
 * Use of this source code is governed by an MIT license that can be
 * found in the LICENSE file at https://github.com/mrpiotr-dev/shortcutter/blob/master/LICENSE
 */

import { PHASES } from '.';
import { useContexts } from './contexts';
import { useObserver } from './observer';

type Config = {
  eventTarget: EventTarget,
  defaultContext: string,
}

const DEFAULT_CONFIG: Config = {
  eventTarget: window,
  defaultContext: 'default',
};

/**
 * Creates ShortcutsKeeper
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useShortcutter(customConfig: Partial<typeof DEFAULT_CONFIG> = {}) {
  const CONFIG = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  const { eventTarget, defaultContext } = CONFIG;

  const contexts = useContexts();
  const observer = useObserver();

  contexts.add(defaultContext);
  contexts.setActive(defaultContext);

  /* START MESS */
  eventTarget.addEventListener('keydown', onkeydown as EventListener);
  eventTarget.addEventListener('keyup', onkeyup as EventListener);
  eventTarget.addEventListener('blur', onblur as EventListener);
  eventTarget.addEventListener('unload', onunload);

  const invokeClbck = (keys: string[], event: Event, phase: PHASES.START|PHASES.CONTINUE|PHASES.END) => {
    contexts.getActive().forEach(context => {
      const ctx = contexts.get(context);

      if (ctx.has(keys, phase)) {
        (ctx.get(keys, phase) as (...args: unknown[]) => void)(event, phase);
      }
    });
  };

  function onkeydown(event: KeyboardEvent): void {
    const previousCombination = observer.getPressed().join('+');

    observer.press(event.key);

    const nextCombination = observer.getPressed().join('+');

    if (previousCombination !== nextCombination) {
      if (previousCombination.length) {
        invokeClbck(previousCombination.split('+'), event, PHASES.START);
        // console.log('shortcut_up', previousCombination);
      }

      // console.log('shortcut_down', nextCombination);
      invokeClbck(nextCombination.split('+'), event, PHASES.START);

    } else {
      invokeClbck(previousCombination.split('+'), event, PHASES.CONTINUE);
      // console.log('shortcut_press', previousCombination);
    }

    // event.preventDefault();
  }

  function onkeyup(event: KeyboardEvent): void {
    const previousCombination = observer.getPressed().join('+');

    observer.release(event.key);

    const nextCombination = observer.getPressed().join('+');

    if (previousCombination.length) {
      invokeClbck(previousCombination.split('+'), event, PHASES.END);
      // console.log('shortcut_up', previousCombination);
    }
    if (nextCombination.length) {
      invokeClbck(nextCombination.split('+'), event, PHASES.START);
      // console.log('shortcut_down', nextCombination);
    }

    //event.preventDefault();
  }

  function onblur(event: FocusEvent): void {
    const previousCombination = observer.getPressed().join('+');

    if (previousCombination.length) {
      invokeClbck(previousCombination.split('+'), event, PHASES.END);
      // console.log('shortcut_up', previousCombination);
    }

    observer.releaseAll();
  }

  function onunload(): void {
    eventTarget.removeEventListener('keydown', onkeydown as EventListener);
    eventTarget.removeEventListener('keyup', onkeyup as EventListener);
    eventTarget.removeEventListener('blur', onblur as EventListener);
    eventTarget.removeEventListener('unload', onunload);
  }
  /* END MESS */


  return {
    // keysRecorder,
    // contexts,

    listen: (context: string, keys: string[], callback: (event:Event, phase: PHASES) => void, phases?: PHASES) => {
      // console.log([context, keys, callback, phases]);
      const ctx = contexts.has(context) ? contexts.get(context) : contexts.add(context);

      ctx.add(keys, callback, phases);

      return () => ctx.remove(keys, phases);
    },
    unlisten: (context: string, keys: string[], phases?: PHASES) => {
      const ctx = contexts.get(context);

      ctx.remove(keys, phases);
    },
    hasContext: (name: string) => contexts.has(name),
    getActiveContext: () => contexts.getActive(),
    setActiveContext: (name: string) => contexts.setActive(name),
  } as const;
}
