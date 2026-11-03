import type { ArrayParserOptions, ArrayParserResult, ParserResult } from './interfaces/index.ts';

import { InvalidValueError, ParseArrayError, RequiredValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

export class ArrayParser<
    O extends ArrayParserOptions
> extends Parser<ArrayParserResult<O>, O> {
    #parser: O['parser'];

    constructor(options: O) {
        super(options);
        this.#parser = options.parser;
    }

    parse(input: unknown): ParserResult<ArrayParserResult<O>, O>;
    parse(input: unknown): ArrayParserResult<O> | undefined {
        if (typeof input === 'undefined') {
            if (this.required) {
                throw new RequiredValueError(this);
            } else {
                return undefined;
            }
        }

        if (!Array.isArray(input)) {
            throw new InvalidValueError(this, 'an array', input);
        }

        const output: unknown[] = [];
        for (let i = 0; i < input.length; i++) {
            try {
                const v = this.#parser.parse(input[i]);
                output.push(v);
            } catch (err) {
                throw new ParseArrayError(this.#parser, i, err);
            }
        }

        return output as ArrayParserResult<O>;
    }
}