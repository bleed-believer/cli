import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

import { inspect } from 'node:util';

/**
 * Thrown by an `ObjectParser` when one of the keys cannot be parsed.
 * The error thrown by the key parser is available in `cause`.
 */
export class ParseObjectError extends Error {
    /** The parser that failed to parse the key. */
    readonly parser: Parser<unknown, ParserOptions>;
    /** The key that could not be parsed. */
    readonly key: string;

    /**
     * @param parser The parser that failed to parse the key.
     * @param key The key that could not be parsed.
     * @param cause The error thrown by the parser.
     */
    constructor(parser: Parser<unknown, ParserOptions>, key: string, cause: unknown) {
        super(
            `The object key ${inspect(key)} could not be parsed by ${parser.constructor.name}`,
            { cause }
        );

        this.name = 'ParseObjectError';
        this.parser = parser;
        this.key = key;
    }
}
