import type { ParserOptions } from './parser-options.ts';

/**
 * The value returned by a parser: `T` if the parser is required,
 * otherwise `T | undefined`.
 *
 * @typeParam T The type of the parsed value.
 * @typeParam O The options of the parser.
 */
export type ParserResult<T, O extends ParserOptions> = O['required'] extends true
?   T
:   T | undefined;