import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

export class ParseArrayError extends Error {
    readonly parser: Parser<unknown, ParserOptions>;
    readonly index: number;

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
