import type { ParserOptions } from './parser-options.ts';
import type { Parser } from '../parser.ts';

/** Options of the `ArrayParser`. */
export interface ArrayParserOptions extends ParserOptions {
    /** The parser used for every item of the array. */
    parser: Parser<unknown, ParserOptions>;
}