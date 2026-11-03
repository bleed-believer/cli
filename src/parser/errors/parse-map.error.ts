import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

import { inspect } from 'node:util';

/**
 * Thrown by a `MapParser` when one of the values cannot be parsed.
 * The error thrown by the value parser is available in `cause`.
 */
export class ParseMapError extends Error {
    /** The parser that failed to parse the value. */
    readonly parser: Parser<unknown, ParserOptions>;
    /** The key of the value that could not be parsed. */
    readonly key: string;

    /**
     * @param parser The parser that failed to parse the value.
     * @param key The key of the value that could not be parsed.
     * @param cause The error thrown by the parser.
     */
    constructor(parser: Parser<unknown, ParserOptions>, key: string, cause: unknown) {
        super(
            `The map value at key ${inspect(key)} could not be parsed by ${parser.constructor.name}`,
            { cause }
        );

        this.name = 'ParseMapError';
        this.parser = parser;
        this.key = key;
    }
}
