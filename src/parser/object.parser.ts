import type { ObjectParserOptions, ObjectParserResult, ParserResult } from './interfaces/index.ts';

import { InvalidValueError, ParseObjectError, RequiredValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses an object with a known set of keys, each one with its own parser.
 * Unknown keys are ignored.
 *
 * @example
 * ```ts
 * const parser = new ObjectParser({
 *     keys: {
 *         name: new StringParser({ required: true }),
 *         strict: new BooleanParser()
 *     }
 * });
 *
 * parser.parse({ name: 'foo', other: 666 });     // { name: 'foo' }
 * parser.parse({ strict: true });                // throws RequiredValueError
 * ```
 */
export class ObjectParser<
    O extends ObjectParserOptions
> extends Parser<ObjectParserResult<O>, O> {
    /** The parser of every declared key. */
    #keys: O['keys'];

    /**
     * @param options The options of the parser.
     */
    constructor(options: O) {
        super(options);
        this.#keys = options.keys;
    }

    /**
     * Validates that the input is an object and parses each declared key.
     * Only own properties are read, and the keys that result in `undefined`
     * are omitted from the output.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is `null`, an array, a `Date` or not an object.
     * @throws {ParseObjectError} If a key cannot be parsed. The original error is
     * available in its `cause`.
     * @returns A new object with the parsed keys.
     */
    parse(input: unknown): ParserResult<ObjectParserResult<O>, O>;
    parse(input: unknown): ObjectParserResult<O> | undefined {
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
                    for (const [ k, p ] of Object.entries(this.#keys)) {
                        let v: unknown;
                        try {
                            v = p.parse(
                                Object.hasOwn(input, k)
                                ?   (input as any)[k]
                                :   undefined
                            );
                        } catch (err) {
                            throw new ParseObjectError(p, k, err);
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