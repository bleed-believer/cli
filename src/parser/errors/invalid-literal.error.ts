import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

import { describeValue } from './describe-value.ts';
import { inspect } from 'node:util';

/** Thrown by a `LiteralParser` when it receives a value that is not one of its values. */
export class InvalidLiteralError extends Error {
    /** The parser that rejected the value. */
    readonly parser: Parser<unknown, ParserOptions>;
    /** The values accepted by the parser. */
    readonly expected: readonly string[];
    /** The value that was rejected. */
    readonly received: unknown;

    /**
     * @param parser The parser that rejected the value.
     * @param expected The values accepted by the parser.
     * @param received The value that was rejected.
     */
    constructor(
        parser: Parser<unknown, ParserOptions>,
        expected: readonly string[],
        received: unknown
    ) {
        const values = expected
            .map(x => inspect(x))
            .join(', ');

        super(
            `The value for ${parser.constructor.name} must be ` +
            `${expected.length > 1 ? `one of ${values}` : values}. ` +
            `Received ${describeValue(received)}`
        );

        this.name = 'InvalidLiteralError';
        this.parser = parser;
        this.expected = expected;
        this.received = received;
    }
}
