import { combination, isModifier, isTyping, isWildcard, wildcardMatcher } from './keys';
import type { Shortcutter } from './types';

export type SequenceDetail = {
  /** The sequence as passed to `listen()`, e.g. `'G I'`. */
  sequence: string;
  context: string;
  description?: string;
};

/** `event` is the keydown that completed the sequence. */
export type SequenceHandler = (event: KeyboardEvent, detail: SequenceDetail) => void;

export type SequenceOptions = {
  /** What the sequence does, for help screens built from `sequences()`. */
  description?: string;
  /** Context to register in. Defaults to `'default'`. */
  context?: string;
  /** Skip while typing in form fields or contenteditable. Defaults to `true`. */
  ignoreInputs?: boolean;
  /** Call `preventDefault()` on the keydown that completes the sequence. Defaults to `false`. */
  preventDefault?: boolean;
};

export type SequencesOptions = {
  /** Most milliseconds between two steps. Defaults to `1000`. */
  timeout?: number;
};

/** A registered sequence, as listed by `sequences()`. */
export type SequenceInfo = {
  sequence: string;
  /** Canonical keys of every step for this platform, modifiers first: `[['g'], ['i']]`. */
  steps: string[][];
  context: string;
  description?: string;
  /** Whether its context is active, so the sequence works right now. */
  active: boolean;
};

export type Sequences = {
  /**
   * Runs `handler` when the steps of `sequence` are pressed one after another, e.g. `'G I'`,
   * `'G Shift+P'` or `'ArrowUp ArrowUp ArrowDown ArrowDown'`. Each step is a shortcut (wildcards
   * included); steps are separated by spaces. Returns a function that removes the sequence.
   */
  listen(sequence: string, handler: SequenceHandler, options?: SequenceOptions): () => void;
  /** Registered sequences in registration order, e.g. to add them to a keyboard help screen. */
  sequences(filter?: { active?: boolean; context?: string }): SequenceInfo[];
  /** Stops matching and removes every sequence. */
  destroy(): void;
};

type Registration = {
  sequence: string;
  steps: string[][];
  matchers: ((held: readonly string[]) => boolean)[];
  context: string;
  description?: string;
  ignoreInputs: boolean;
  preventDefault: boolean;
  handler: SequenceHandler;
};

/** `'G  Shift + P'` → `['G', 'Shift+P']` */
function splitSteps(sequence: string): string[] {
  if (typeof sequence !== 'string') return [];

  return sequence
    .replace(/\s*\+\s*/g, '+')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Adds key sequences (`'G I'`, Vim-style) to a shortcutter. Optional: import it from
 * `shortcutter/sequences` only if you need it.
 *
 * @example
 * const sequences = createSequences(shortcutter);
 * sequences.listen('G I', () => goToInbox(), { description: 'Go to the inbox' });
 */
export function createSequences(
  shortcutter: Shortcutter,
  options: SequencesOptions = {},
): Sequences {
  const timeout = options.timeout ?? 1000;
  const registrations = new Set<Registration>();
  let history: { held: string[]; time: number }[] = [];
  let longest = 0;

  const stop = shortcutter.observe((event, { phase, shortcut }) => {
    if (phase !== 'down' || !event.type.startsWith('key')) return;

    const held = shortcut.split('+');

    // Pressing Shift or Control on their way to the next step is not a step.
    if (held.every(isModifier)) return;

    if (longest === 0) return;

    const now = Date.now();

    if (history.length > 0 && now - history[history.length - 1]!.time > timeout) history = [];
    history.push({ held, time: now });
    if (history.length > longest) history = history.slice(-longest);

    const typing = isTyping(event as KeyboardEvent);
    let matched = false;

    for (const registration of [...registrations]) {
      const { steps, matchers, context } = registration;

      if (history.length < steps.length || !shortcutter.contexts.isActive(context)) continue;
      if (typing && registration.ignoreInputs) continue;

      const tail = history.slice(-steps.length);

      if (tail.every((step, index) => matchers[index]!(step.held))) {
        if (registration.preventDefault) event.preventDefault();
        registration.handler(event as KeyboardEvent, {
          sequence: registration.sequence,
          context,
          description: registration.description,
        });
        matched = true;
      }
    }

    // A completed sequence starts over, so 'G I' 'I' does not run 'G I' twice.
    if (matched) history = [];
  });

  return {
    listen(sequence, handler, opts = {}) {
      if (typeof handler !== 'function') {
        throw new Error(`Handler for sequence "${sequence}" has to be a function.`);
      }

      const parts = splitSteps(sequence);

      if (parts.length < 2) {
        throw new Error(
          `Sequence "${sequence}" needs at least two steps, e.g. "G I". Use listen() for one.`,
        );
      }

      const steps = parts.map((part) => shortcutter.resolve(part));
      const context = opts.context ?? 'default';
      const key = `${steps.map((step) => combination(step)).join(' ')}|${context}`;

      for (const other of registrations) {
        if (`${other.steps.map((step) => combination(step)).join(' ')}|${other.context}` === key) {
          throw new Error(
            `Sequence "${sequence}" is already registered in the "${context}" context.`,
          );
        }
      }

      const registration: Registration = {
        sequence,
        steps,
        matchers: steps.map((step) =>
          step.some(isWildcard)
            ? wildcardMatcher(step)
            : (held) => combination(held) === combination(step),
        ),
        context,
        description: opts.description,
        ignoreInputs: opts.ignoreInputs ?? true,
        preventDefault: opts.preventDefault ?? false,
        handler,
      };

      registrations.add(registration);
      longest = Math.max(longest, steps.length);

      return () => {
        registrations.delete(registration);
        longest = Math.max(0, ...[...registrations].map((other) => other.steps.length));
      };
    },

    sequences(filter = {}) {
      const list: SequenceInfo[] = [];

      for (const { sequence, steps, context, description } of registrations) {
        const active = shortcutter.contexts.isActive(context);

        if (filter.active !== undefined && filter.active !== active) continue;
        if (filter.context !== undefined && filter.context !== context) continue;

        list.push({
          sequence,
          steps: steps.map((step) => [...step]),
          context,
          ...(description === undefined ? {} : { description }),
          active,
        });
      }

      return list;
    },

    destroy() {
      stop();
      registrations.clear();
      history = [];
    },
  };
}
