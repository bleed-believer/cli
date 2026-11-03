import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

import { describeValue } from './describe-value.ts';

export class InvalidValueError extends Error {
    readonly parser: Parser<unknown, ParserOptions>;
    readonly expected: string;
    readonly received: unknown;

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
