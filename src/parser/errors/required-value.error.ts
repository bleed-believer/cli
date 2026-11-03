import type { ParserOptions } from '../interfaces/index.ts';
import type { Parser } from '../parser.ts';

export class RequiredValueError extends Error {
    readonly parser: Parser<unknown, ParserOptions>;

    constructor(parser: Parser<unknown, ParserOptions>) {
        super(`The value for ${parser.constructor.name} is required. Received undefined`);
        this.name = 'RequiredValueError';
        this.parser = parser;
    }
}
