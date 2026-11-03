import type { ParserOptions } from './parser-options.ts';
import type { Parser } from '../parser.ts';

export interface ObjectParserOptions extends ParserOptions {
    keys: Record<string, Parser<unknown, ParserOptions>>;
}