import type { ParserOptions } from './parser-options.ts';

/** Options of the `LiteralParser`. */
export interface LiteralParserOptions extends ParserOptions {
    /** The accepted values. Must contain at least one value, without duplicates. */
    values: readonly [ string, ...string[] ];
    /**
     * If `true`, the input is matched against the values ignoring case.
     * @default false
     */
    ignoreCase?: boolean;
}
