import type { ParserOptions } from './parser-options.ts';
import type { Parser } from '../parser.ts';

export interface ArrayParserOptions extends ParserOptions {
    parser: Parser<unknown, ParserOptions>;
}