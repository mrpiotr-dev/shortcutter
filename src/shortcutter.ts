
import { PHASES } from '.';
import { useContexts } from './contexts';
import { useController } from './controller';
import { normalizeKeyCode } from './helpers';

type Config = {
  eventTarget: EventTarget,
  defaultContext: string,
}

const DEFAULT_CONFIG: Config = {
  eventTarget: window,
  defaultContext: '',
};

/**
 * Creates ShortcutsKeeper
 */
export function useShortcutter(customConfig: Partial<typeof DEFAULT_CONFIG> = {}) {
  const CONFIG = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  const { eventTarget } = CONFIG;

  const contexts = useContexts();
  const keysRecorder = useController();

  /* START MESS */
  eventTarget.addEventListener('keydown', onkeydown as EventListener);
  eventTarget.addEventListener('keyup', onkeyup as EventListener);
  eventTarget.addEventListener('blur', onblur);
  eventTarget.addEventListener('unload', onunload);

  const invokeClbck = (keys: string[], event: Event, phase: PHASES) => {
    contexts.getActive().forEach(context => {
      const ctx = contexts.get(context);

      if (!ctx?.has(keys, phase)) {
        return;
      }

      ctx?.get(keys, phase)!(event, phase);
    });
  };

  function onkeydown(event: KeyboardEvent): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    keysRecorder.press(normalizeKeyCode(event.code));

    const nextCombination = keysRecorder.getPressed().join('+');

    if (previousCombination !== nextCombination) {
      if (previousCombination.length) {
        invokeClbck(previousCombination.split('+'), event, PHASES.UP);
        // console.log('shortcut_up', previousCombination);
      }

      // console.log('shortcut_down', nextCombination);
      invokeClbck(nextCombination.split('+'), event, PHASES.DOWN);

    } else {
      invokeClbck(previousCombination.split('+'), event, PHASES.PRESS);
      // console.log('shortcut_press', previousCombination);
    }

    event.preventDefault();
  }

  function onkeyup(event: KeyboardEvent): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    keysRecorder.release(normalizeKeyCode(event.code));

    const nextCombination = keysRecorder.getPressed().join('+');

    if (previousCombination.length) {
      invokeClbck(previousCombination.split('+'), event, PHASES.PRESS);
      // console.log('shortcut_up', previousCombination);
    }
    if (nextCombination.length) {
      invokeClbck(nextCombination.split('+'), event, PHASES.DOWN);
      // console.log('shortcut_down', nextCombination);
    }

    //event.preventDefault();
  }

  function onblur(): void {
    const previousCombination = keysRecorder.getPressed().join('+');

    if (previousCombination.length) {
      // console.log('shortcut_up', previousCombination);
    }

    keysRecorder.releaseAll();
  }

  function onunload(): void {
    eventTarget.removeEventListener('keydown', onkeydown as EventListener);
    eventTarget.removeEventListener('keyup', onkeyup as EventListener);
    eventTarget.removeEventListener('blur', onblur);
    eventTarget.removeEventListener('unload', onunload);
  }
  /* END MESS */


  return {
    keysRecorder,
    contexts,

    addShortcut: (context: string, keys: string[], callback: (...args: any) => void, phases?: PHASES) => {
      // console.log([context, keys, callback, phases]);
      const ctx = contexts.has(context) ? contexts.get(context) : contexts.add(context);

      ctx?.add(keys, callback, phases);
    },
    setActiveContext: (name: string) => contexts.setActive(name),
    trigger: (keys: string[], phase: PHASES) => {
      contexts.getActive().forEach(context => {
        const ctx = contexts.get(context);
        const clbck = ctx?.get(keys, phase) as any;

        if (clbck) {
          clbck();
        }
      })
    }
  } as const;
}
