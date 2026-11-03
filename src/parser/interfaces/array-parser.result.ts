import type { ArrayParserOptions } from './array-parser.options.ts';

/**
 * The value returned by an `ArrayParser`: an array of the values
 * returned by its item parser.
 * @typeParam O The options of the parser.
 */
export type ArrayParserResult<O extends ArrayParserOptions> = ReturnType<O['parser']['parse']>[];