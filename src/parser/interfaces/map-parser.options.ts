import type { ParserOptions } from './parser-options.ts';
import type { Parser } from '../parser.ts';

/** Options of the `MapParser`. */
export interface MapParserOptions extends ParserOptions {
    /** The parser used for every value of the object. */
    parser: Parser<unknown, ParserOptions>;
}
