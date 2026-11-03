import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

/** Thrown when a required parser receives `undefined`. */
export class RequiredValueError extends Error {
    /** The parser that rejected the value. */
    readonly parser: Parser<unknown, ParserOptions>;

    /**
     * @param parser The parser that rejected the value.
     */
    constructor(parser: Parser<unknown, ParserOptions>) {
        super(`The value for ${parser.constructor.name} is required. Received undefined`);
        this.name = 'RequiredValueError';
        this.parser = parser;
    }
}
