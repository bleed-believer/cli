import type { ArrayParserOptions } from './array-parser.options.ts';

export type ArrayParserResult<O extends ArrayParserOptions> = ReturnType<O['parser']['parse']>[];