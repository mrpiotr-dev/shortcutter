/**
 * Property-based tests (fast-check): random shortcuts and random key sequences instead of
 * hand-picked examples. They also count as fuzzing for OpenSSF Scorecard.
 */
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vite-plus/test';
import { parseShortcut, parseShortcutKeys } from '../src/keys';
import { createShortcutter } from '../src/index';
import { keyboard } from './keyboard';

const MODIFIER_NAMES = [
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'Ctrl',
  'Cmd',
  'Option',
  'ControlOrMeta',
];
const KEY_NAMES = [
  'K',
  'A',
  'Z',
  '1',
  '9',
  'F5',
  'Escape',
  'Enter',
  'Space',
  'ArrowUp',
  'Slash',
  'Equal',
];

const CODES = [
  'KeyA',
  'KeyK',
  'KeyZ',
  'Digit1',
  'Space',
  'Enter',
  'ArrowUp',
  'Slash',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'AltLeft',
  'MetaLeft',
];

/** Random casing, so case-insensitivity is exercised too. */
const anyCase = (name: string) =>
  fc.array(fc.boolean(), { minLength: name.length, maxLength: name.length }).map((upper) =>
    name
      .split('')
      .map((c, i) => (upper[i] ? c.toUpperCase() : c.toLowerCase()))
      .join(''),
  );

const shortcutParts = fc
  .tuple(
    fc.uniqueArray(fc.constantFrom(...MODIFIER_NAMES), { maxLength: 3 }),
    fc.constantFrom(...KEY_NAMES),
  )
  .map(([modifiers, key]) => [...modifiers, key]);

describe('properties: parsing', () => {
  it('ignores the order and the case of the keys', () => {
    fc.assert(
      fc.property(
        shortcutParts.chain((parts) =>
          fc.tuple(
            fc.constant(parts),
            fc.shuffledSubarray(parts, { minLength: parts.length, maxLength: parts.length }),
            fc.tuple(...parts.map(anyCase)),
          ),
        ),
        fc.boolean(),
        ([parts, shuffled, cased], mac) => {
          const canonical = parseShortcut(parts.join('+'), mac);

          expect(parseShortcut(shuffled.join('+'), mac)).toBe(canonical);
          expect(parseShortcut(cased.join('+'), mac)).toBe(canonical);
        },
      ),
    );
  });

  it('lists modifiers before the other keys, without duplicates', () => {
    fc.assert(
      fc.property(shortcutParts, fc.boolean(), (parts, mac) => {
        const keys = parseShortcutKeys(parts.join('+'), mac);
        const firstOther = keys.findIndex((k) => !['control', 'meta', 'alt', 'shift'].includes(k));

        expect(new Set(keys).size).toBe(keys.length);
        if (firstOther !== -1) {
          expect(
            keys.slice(firstOther).some((k) => ['control', 'meta', 'alt', 'shift'].includes(k)),
          ).toBe(false);
        }
      }),
    );
  });

  it('either parses any string or throws a plain Error', () => {
    fc.assert(
      fc.property(fc.string(), fc.boolean(), (input, mac) => {
        try {
          expect(typeof parseShortcut(input, mac)).toBe('string');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error).not.toBeInstanceOf(TypeError);
        }
      }),
    );
  });
});

type Step = { type: 'down' | 'up'; code: string } | { type: 'blur' };

const steps = fc.array(
  fc.oneof(
    fc.record({
      type: fc.constantFrom('down' as const, 'up' as const),
      code: fc.constantFrom(...CODES),
    }),
    fc.constant({ type: 'blur' as const }),
  ),
  { maxLength: 40 },
);

describe('properties: key state', () => {
  it('never lists a key twice, and releasing everything leaves nothing pressed', () => {
    fc.assert(
      fc.property(steps, (sequence: Step[]) => {
        const target = new EventTarget();
        const sc = createShortcutter({ mac: false, target });
        const kb = keyboard(target);
        const held = new Set<string>();

        for (const step of sequence) {
          if (step.type === 'blur') {
            kb.blur();
            for (const code of held) kb.lose(code);
            held.clear();
          } else if (step.type === 'down') {
            kb.down(step.code);
            held.add(step.code);
          } else {
            kb.up(step.code);
            held.delete(step.code);
          }

          const pressed = sc.pressed();
          expect(new Set(pressed).size).toBe(pressed.length);
        }

        for (const code of held) kb.up(code);
        expect(sc.pressed()).toEqual([]);
        sc.destroy();
      }),
    );
  });

  it('calls a handler at most once per keydown, and never after destroy()', () => {
    fc.assert(
      fc.property(steps, (sequence: Step[]) => {
        const target = new EventTarget();
        const sc = createShortcutter({ mac: false, target });
        const kb = keyboard(target);
        const handler = vi.fn();
        let downs = 0;

        sc.listen('Shift+K', handler);

        for (const step of sequence) {
          if (step.type === 'blur') kb.blur();
          else if (step.type === 'down') {
            kb.down(step.code);
            downs += 1;
          } else kb.up(step.code);
        }

        expect(handler.mock.calls.length).toBeLessThanOrEqual(downs);

        const before = handler.mock.calls.length;
        sc.destroy();
        kb.down('ShiftLeft');
        kb.down('KeyK');
        expect(handler.mock.calls.length).toBe(before);
      }),
    );
  });
});
