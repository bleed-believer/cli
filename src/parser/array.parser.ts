import type { ArrayParserOptions, ArrayParserResult, ParserResult } from './interfaces/index.ts';

import { InvalidValueError, ParseArrayError, RequiredValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses an array, parsing each item with the given parser.
 *
 * @example
 * ```ts
 * const parser = new ArrayParser({
 *     parser: new StringParser({ required: true })
 * });
 *
 * parser.parse([ 'foo', 'bar' ]);     // [ 'foo', 'bar' ]
 * parser.parse([ 'foo', 666 ]);       // throws ParseArrayError (index 1)
 * ```
 */
export class ArrayParser<
    O extends ArrayParserOptions
> extends Parser<ArrayParserResult<O>, O> {
    /** The parser used for every item. */
    #parser: O['parser'];

    /**
     * @param options The options of the parser.
     */
    constructor(options: O) {
        super(options);
        this.#parser = options.parser;
    }

    /**
     * Validates that the input is an array and parses each item. Holes in
     * sparse arrays are parsed as `undefined`, and the items that result in
     * `undefined` are kept in place.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is not an array.
     * @throws {ParseArrayError} If an item cannot be parsed. The original error is
     * available in its `cause`.
     * @returns A new array with the parsed items.
     */
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