/**
 * Compile-time checks for shortcut strings. Types only: nothing here exists at runtime.
 *
 * `listen('Ctlr+K', …)` or `listen('Control+/', …)` (the slash key is `Slash`) used to be accepted
 * and then never fire. With these types, TypeScript reports the unknown key instead. A shortcut
 * held in a plain `string` variable is not checked, so dynamic shortcuts keep working.
 */

type Letter =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type FunctionKeyNumber = Exclude<Digit, '0'> | `1${Digit}` | '20' | '21' | '22' | '23' | '24';

/** `KeyboardEvent.code` values other than letters, digits and function keys, lowercase. */
type CodeName =
  // Modifiers, either side or both
  | 'alt'
  | 'altleft'
  | 'altright'
  | 'control'
  | 'controlleft'
  | 'controlright'
  | 'meta'
  | 'metaleft'
  | 'metaright'
  | 'osleft'
  | 'osright'
  | 'shift'
  | 'shiftleft'
  | 'shiftright'
  // Punctuation (by position on a US layout)
  | 'backquote'
  | 'backslash'
  | 'bracketleft'
  | 'bracketright'
  | 'comma'
  | 'equal'
  | 'intlbackslash'
  | 'intlro'
  | 'intlyen'
  | 'minus'
  | 'period'
  | 'quote'
  | 'semicolon'
  | 'slash'
  // Editing, whitespace and navigation
  | 'backspace'
  | 'capslock'
  | 'contextmenu'
  | 'enter'
  | 'space'
  | 'tab'
  | 'delete'
  | 'end'
  | 'help'
  | 'home'
  | 'insert'
  | 'pagedown'
  | 'pageup'
  | 'arrowdown'
  | 'arrowleft'
  | 'arrowright'
  | 'arrowup'
  | 'escape'
  | 'fn'
  | 'fnlock'
  | 'printscreen'
  | 'scrolllock'
  | 'pause'
  // Input method keys
  | 'convert'
  | 'nonconvert'
  | 'kanamode'
  | 'lang1'
  | 'lang2'
  | 'lang3'
  | 'lang4'
  | 'lang5'
  // Numeric keypad
  | `numpad${Digit}`
  | 'numlock'
  | 'numpadadd'
  | 'numpadsubtract'
  | 'numpadmultiply'
  | 'numpaddivide'
  | 'numpaddecimal'
  | 'numpadenter'
  | 'numpadequal'
  | 'numpadcomma'
  | 'numpadparenleft'
  | 'numpadparenright'
  | 'numpadbackspace'
  | 'numpadclear'
  // Media, browser and system keys
  | 'audiovolumedown'
  | 'audiovolumemute'
  | 'audiovolumeup'
  | 'mediaplaypause'
  | 'mediaselect'
  | 'mediastop'
  | 'mediatracknext'
  | 'mediatrackprevious'
  | 'browserback'
  | 'browserfavorites'
  | 'browserforward'
  | 'browserhome'
  | 'browserrefresh'
  | 'browsersearch'
  | 'browserstop'
  | 'eject'
  | 'launchapp1'
  | 'launchapp2'
  | 'launchmail'
  | 'power'
  | 'sleep'
  | 'wakeup';

/** Friendly names, the same as the runtime aliases in `keys.ts`. */
type Alias =
  | 'ctrl'
  | 'option'
  | 'cmd'
  | 'command'
  | 'esc'
  | 'return'
  | 'del'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'controlormeta';

/**
 * Every key name a shortcut accepts, lowercase (shortcuts are case-insensitive): `KeyboardEvent.code`
 * values (`keyk`, `digit1`, `arrowup`, `slash`, `f5`, …), their short forms (`k`, `1`) and the
 * aliases `ctrl`, `cmd`, `command`, `option`, `esc`, `return`, `del`, `up`, `down`, `left`,
 * `right` and `controlormeta`.
 */
export type KeyName =
  | Letter
  | `key${Letter}`
  | Digit
  | `digit${Digit}`
  | `f${FunctionKeyNumber}`
  | CodeName
  | Alias;

type TrimStart<S extends string> = S extends ` ${infer Rest}` ? TrimStart<Rest> : S;
type TrimEnd<S extends string> = S extends `${infer Rest} ` ? TrimEnd<Rest> : S;
type Trim<S extends string> = TrimEnd<TrimStart<S>>;

type Split<
  S extends string,
  Separator extends string,
> = S extends `${infer Head}${Separator}${infer Tail}` ? [Head, ...Split<Tail, Separator>] : [S];

/** `true` when the key is valid, otherwise the error message. */
type CheckKey<Part extends string, Shortcut extends string> =
  Trim<Part> extends ''
    ? `Shortcut "${Shortcut}" has an empty key. Use "Equal" for the + key.`
    : Trim<Part> extends `${string}*${string}`
      ? true
      : Lowercase<Trim<Part>> extends KeyName
        ? true
        : `Unknown key "${Trim<Part>}" in shortcut "${Shortcut}". Use KeyboardEvent.code names such as "KeyK", "Digit1", "Slash" or "ArrowUp".`;

/** The first error among the keys, or `true`. */
type CheckKeys<Parts extends string[], Shortcut extends string> = Parts extends [
  infer Part extends string,
  ...infer Rest extends string[],
]
  ? CheckKey<Part, Shortcut> extends true
    ? CheckKeys<Rest, Shortcut>
    : CheckKey<Part, Shortcut>
  : true;

/**
 * `S` when it is a valid shortcut such as `'ControlOrMeta+K'`, `'shift + arrowup'` or
 * `'Shift+Arrow*'`, otherwise a message naming the problem, which TypeScript shows as the error.
 * A non-literal `string` passes through unchecked.
 *
 * @example
 * function bind<S extends string>(shortcut: ShortcutString<S>) {}
 * bind('Control+K'); // ok
 * bind('Control+/'); // error: Unknown key "/" in shortcut "Control+/". …
 */
export type ShortcutString<S extends string> = string extends S
  ? S
  : Trim<S> extends ''
    ? 'A shortcut has to name at least one key, e.g. "ControlOrMeta+K".'
    : CheckKeys<Split<S, '+'>, S> extends true
      ? S
      : CheckKeys<Split<S, '+'>, S> & string;

/** Spaces around `+` belong to the step, as at runtime: `'Control + K G'` is two steps. */
type JoinPlus<S extends string> = S extends `${infer Head} +${infer Tail}`
  ? JoinPlus<`${Head}+${Tail}`>
  : S extends `${infer Head}+ ${infer Tail}`
    ? JoinPlus<`${Head}+${Tail}`>
    : S;

type Steps<S extends string> = Exclude<Split<JoinPlus<Trim<S>>, ' '>[number], ''>;

type CheckSteps<Step extends string, Sequence extends string> = {
  [Key in Step]: CheckKeys<Split<Key, '+'>, Key> extends true
    ? never
    : `In sequence "${Sequence}": ${CheckKeys<Split<Key, '+'>, Key> & string}`;
}[Step];

/**
 * `S` when every step of a sequence such as `'G I'` or `'Control+K Control+S'` is a valid
 * shortcut, otherwise a message naming the problem. A non-literal `string` passes through unchecked.
 */
export type SequenceString<S extends string> = string extends S
  ? S
  : [CheckSteps<Steps<S>, S>] extends [never]
    ? S
    : CheckSteps<Steps<S>, S> & string;
