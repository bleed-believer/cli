import type { ParserOptions } from './parser-options.ts';

/** Options of the `NumberParser`. */
export interface NumberParserOptions extends ParserOptions {
    /**
     * If `true`, any finite number is accepted. Otherwise, only integers.
     * @default false
     */
    float?: boolean;
    /** The inclusive lower limit of the accepted values. Cannot be `NaN`. */
    min?: number;
    /** The inclusive upper limit of the accepted values. Cannot be `NaN`. */
    max?: number;
}
