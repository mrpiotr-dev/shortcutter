import { describe, expect, it } from 'vite-plus/test';
import { createShortcutter, type ShortcutString } from '../src/index';
import { createSequences } from '../src/sequences';

// Compile-time checks: each `@ts-expect-error` fails the type check if the line stops being an
// error, and every other line fails it if it becomes one. Nothing here runs a real shortcut.
function compileOnly() {
  const sc = createShortcutter({ target: new EventTarget() });
  const sequences = createSequences(sc);
  const noop = () => {};
  const dynamic: string = 'Control+K';

  // Valid: any case, spaces, aliases, code names and short forms, wildcards.
  sc.listen('ControlOrMeta+K', noop);
  sc.listen('controlormeta+k', noop);
  sc.listen(' Shift + ArrowUp ', noop);
  sc.listen('Ctrl+Option+Cmd+Esc', noop);
  sc.listen('KeyK+Digit1+F12+Numpad7+Slash', noop);
  sc.listen('Shift+Arrow*', noop);
  sc.listen('Digit*', noop);
  sc.listen('Control+*', noop);
  sc.listen('ShiftLeft+MediaPlayPause', noop);
  sc.listen(dynamic, noop);
  sc.unlisten('Control+K');
  sc.isPressed('Shift');
  sc.resolve('ControlOrMeta+K');
  sequences.listen('G I', noop);
  sequences.listen('Control + K Control+S', noop);
  sequences.listen(dynamic, noop);

  // @ts-expect-error -- typo
  sc.listen('Ctlr+K', noop);
  // @ts-expect-error -- the slash key is "Slash"; "/" never fires
  sc.listen('Control+/', noop);
  // @ts-expect-error -- "+" is "Equal"
  sc.listen('Control++', noop);
  // @ts-expect-error -- empty
  sc.listen('', noop);
  // @ts-expect-error -- F25 does not exist
  sc.isPressed('F25');
  // @ts-expect-error -- typo in unlisten
  sc.unlisten('Escap');
  // @ts-expect-error -- typo in one step
  sequences.listen('G Ctlr+I', noop);

  // The helper type works for users' own functions too.
  const bind = <S extends string>(shortcut: ShortcutString<S>) => shortcut;
  bind('Alt+F4');
  // @ts-expect-error -- typo
  bind('Alt+F44');
}

describe('shortcut string types', () => {
  it('are checked at compile time only', () => {
    expect(compileOnly).toBeTypeOf('function');
  });
});
