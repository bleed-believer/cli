import type { ParserOptions } from './parser-options.ts';
import type { Parser } from '../parser.ts';

/** Options of the `ObjectParser`. */
export interface ObjectParserOptions extends ParserOptions {
    /** The parser of every key of the object. Undeclared keys are ignored. */
    keys: Record<string, Parser<unknown, ParserOptions>>;
}