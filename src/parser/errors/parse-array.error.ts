import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

/**
 * Thrown by an `ArrayParser` when one of the items cannot be parsed.
 * The error thrown by the item parser is available in `cause`.
 */
export class ParseArrayError extends Error {
    /** The parser that failed to parse the item. */
    readonly parser: Parser<unknown, ParserOptions>;
    /** The index of the item that could not be parsed. */
    readonly index: number;

    /**
     * @param parser The parser that failed to parse the item.
     * @param index The index of the item that could not be parsed.
     * @param cause The error thrown by the parser.
     */
    constructor(parser: Parser<unknown, ParserOptions>, index: number, cause: unknown) {
        super(
            `The array item at index ${index} could not be parsed by ${parser.constructor.name}`,
            { cause }
        );

        this.name = 'ParseArrayError';
        this.parser = parser;
        this.index = index;
    }
}
