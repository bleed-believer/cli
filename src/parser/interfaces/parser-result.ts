import type { ParserOptions } from './parser-options.ts';

export type ParserResult<T, O extends ParserOptions> = O['required'] extends true
?   T
:   T | undefined;