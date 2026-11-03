import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

import { describeValue } from './describe-value.ts';

/** Thrown when a parser receives a value that it does not accept. */
export class InvalidValueError extends Error {
    /** The parser that rejected the value. */
    readonly parser: Parser<unknown, ParserOptions>;
    /** Description of the accepted values (e.g. `'of type boolean'`). */
    readonly expected: string;
    /** The value that was rejected. */
    readonly received: unknown;

    /**
     * @param parser The parser that rejected the value.
     * @param expected Description of the accepted values, completing the
     * sentence "The value must be ..." (e.g. `'an array'`).
     * @param received The value that was rejected.
     */
    constructor(
        parser: Parser<unknown, ParserOptions>,
        expected: string,
        received: unknown
    ) {
        super(
            `The value for ${parser.constructor.name} must be ${expected}. ` +
            `Received ${describeValue(received)}`
        );

        this.name = 'InvalidValueError';
        this.parser = parser;
        this.expected = expected;
        this.received = received;
    }
}
