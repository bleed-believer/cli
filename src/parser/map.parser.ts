import type { MapParserOptions, MapParserResult, ParserResult } from './interfaces/index.ts';

import { InvalidValueError, ParseMapError, RequiredValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses an object with arbitrary keys, parsing every value with the
 * same parser (like a `Record<string, T>`).
 *
 * @example
 * ```ts
 * const parser = new MapParser({
 *     parser: new ArrayParser({ parser: new StringParser() })
 * });
 *
 * parser.parse({ '@app/*': [ './src/app/*' ] });     // { '@app/*': [ './src/app/*' ] }
 * parser.parse({ '@app/*': './src/app/*' });         // throws ParseMapError (key '@app/*')
 * ```
 */
export class MapParser<
    O extends MapParserOptions
> extends Parser<MapParserResult<O>, O> {
    /** The parser used for every value. */
    #parser: O['parser'];

    /**
     * @param options The options of the parser.
     */
    constructor(options: O) {
        super(options);
        this.#parser = options.parser;
    }

    /**
     * Validates that the input is an object and parses each value. Only own,
     * enumerable and string keys are read, and the values that result in
     * `undefined` are omitted from the output.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is `null`, an array, a `Date` or not an object.
     * @throws {ParseMapError} If a value cannot be parsed. The original error is
     * available in its `cause`.
     * @returns A new object with the parsed values.
     */
    parse(input: unknown): ParserResult<MapParserResult<O>, O>;
    parse(input: unknown): MapParserResult<O> | undefined {
        switch (typeof input) {
            case 'undefined': {
                if (this.required) {
                    throw new RequiredValueError(this);
                } else {
                    return undefined;
                }
            }

            case 'object': {
                if (
                    input !== null &&
                    !Array.isArray(input) &&
                    !(input instanceof Date)
                ) {
                    const output: any = {};
                    for (const k of Object.keys(input)) {
                        let v: unknown;
                        try {
                            v = this.#parser.parse((input as any)[k]);
                        } catch (err) {
                            throw new ParseMapError(this.#parser, k, err);
                        }

                        if (typeof v !== 'undefined') {
                            Object.defineProperty(output, k, {
                                value: v,
                                writable: true,
                                enumerable: true,
                                configurable: true
                            });
                        }
                    }

                    return output;
                }
            }

            default: {
                throw new InvalidValueError(this, 'an object', input);
            }
        }
    }
}
