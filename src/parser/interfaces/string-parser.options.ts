import type { ParserOptions } from './parser-options.ts';

/** Options of the `StringParser`. */
export interface StringParserOptions extends ParserOptions {
    /**
     * If `true`, leading and trailing whitespace is removed from the parsed strings.
     * @default false
     */
    trim?: boolean;
}
