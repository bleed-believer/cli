import type { LiteralParserOptions } from './literal-parser.options.ts';

/**
 * The value returned by a `LiteralParser`: the union of its `values`.
 * @typeParam O The options of the parser.
 */
export type LiteralParserResult<O extends LiteralParserOptions> = O['values'][number];
