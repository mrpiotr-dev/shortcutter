/**
 * Optional shortcut recorder for settings screens: press a combination, get its shortcut string.
 * Apps that do not import this entry do not ship it.
 *
 * @packageDocumentation
 * @module shortcutter/record
 */
import { combination, isModifier, keyFromCode } from './keys';
import type { Shortcutter } from './types';

export type RecordOptions = {
  /** Stops recording; the promise resolves to `null`. */
  signal?: AbortSignal;
  /** Pressed alone, cancels recording (resolves to `null`). Defaults to `'Escape'`; `null` records it too. */
  cancelKey?: string | null;
  /**
   * Record the platform's main modifier as `ControlOrMeta`, so a shortcut recorded with ⌘ on macOS
   * works with Ctrl on Windows and Linux, and the other way round. Defaults to `true`.
   */
  controlOrMeta?: boolean;
  /** Call `preventDefault()` on the keys pressed while recording. Defaults to `true`. */
  preventDefault?: boolean;
  /** Called with the keys held while recording (canonical names), e.g. to show them live. */
  onKeys?: (keys: string[]) => void;
};

/** Context activated while recording, so no other shortcut of this shortcutter fires. */
export const RECORDING_CONTEXT = 'shortcutter:recording';

const MODIFIER_NAMES: Record<string, string> = {
  control: 'Control',
  meta: 'Meta',
  alt: 'Alt',
  shift: 'Shift',
};

/** Contexts to restore once keys are released, per shortcutter (a new recording takes them over). */
const pending = new WeakMap<Shortcutter, string[]>();

/** A readable name for a canonical key: `k` → `K`, `arrowup` → `ArrowUp` (from the event's code). */
function keyName(key: string, event: KeyboardEvent): string {
  if (/^[a-z0-9]$/.test(key)) return key.toUpperCase();
  if (keyFromCode(event.code) === key) return event.code;

  return key[0]!.toUpperCase() + key.slice(1);
}

/**
 * Waits for the user to press a key combination and resolves to its shortcut string, such as
 * `'ControlOrMeta+Shift+K'`, ready for `listen()` or a keymap's `remap()`. Modifiers pressed alone
 * are not recorded. Resolves to `null` when cancelled with Escape or `signal`.
 *
 * While recording, the shortcutter's shortcuts do not fire, so pressing a combination that is
 * already in use does not run its command. The active contexts are restored once every key is
 * released.
 *
 * @example
 * const shortcut = await recordShortcut(shortcutter);
 * if (shortcut) keymap.remap('palette', shortcut);
 */
export function recordShortcut(
  shortcutter: Shortcutter,
  options: RecordOptions = {},
): Promise<string | null> {
  const {
    signal,
    cancelKey = 'Escape',
    controlOrMeta = true,
    preventDefault = true,
    onKeys,
  } = options;

  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    const primary = shortcutter.resolve('ControlOrMeta')[0];
    const cancel = cancelKey === null ? undefined : combination(shortcutter.resolve(cancelKey));
    // A recording started right after another one keeps the contexts from before the first.
    const previous = pending.get(shortcutter) ?? shortcutter.contexts.active();

    pending.delete(shortcutter);
    const stopKeys = onKeys ? shortcutter.subscribe((keys) => onKeys(keys)) : undefined;

    // Contexts come back once every key is released, after the event that ended the recording has
    // been dispatched: the combination just recorded must not run the command it is bound to.
    const restore = () => {
      if (pending.get(shortcutter) !== previous) return;
      pending.delete(shortcutter);
      shortcutter.contexts.activate(...previous);
    };
    const finish = (result: string | null) => {
      stopObserving();
      stopKeys?.();
      signal?.removeEventListener('abort', onAbort);
      resolve(result);
      pending.set(shortcutter, previous);

      if (shortcutter.pressed().length === 0) {
        restore();
        return;
      }

      const stopWaiting = shortcutter.subscribe((keys) => {
        if (keys.length > 0) return;
        stopWaiting();
        queueMicrotask(restore);
      });
    };
    const onAbort = () => finish(null);

    const stopObserving = shortcutter.observe((event, { phase, shortcut }) => {
      if (!('code' in event)) return;
      if (preventDefault) event.preventDefault();
      if (phase !== 'down') return;

      const keys = shortcut.split('+');
      const others = keys.filter((key) => !isModifier(key));

      if (others.length === 0) return;
      if (shortcut === cancel) {
        finish(null);
        return;
      }

      const modifiers = ['control', 'meta', 'alt', 'shift']
        .filter((key) => keys.includes(key))
        .map((key) => (controlOrMeta && key === primary ? 'ControlOrMeta' : MODIFIER_NAMES[key]!));

      finish([...modifiers, ...others.map((key) => keyName(key, event))].join('+'));
    });

    signal?.addEventListener('abort', onAbort);
    shortcutter.contexts.activate(RECORDING_CONTEXT);
  });
}
