import type { ParserResult, StringParserOptions } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses a `string` value, optionally trimming it.
 *
 * @example
 * ```ts
 * const parser = new StringParser({ trim: true });
 * parser.parse('  foo  ');    // 'foo'
 * parser.parse(666);          // throws InvalidValueError
 * ```
 */
export class StringParser<O extends StringParserOptions> extends Parser<string, O> {
    /** Whether the parsed strings are trimmed. */
    #trim: boolean;
    /** If `true`, leading and trailing whitespace is removed from the parsed strings. */
    get trim(): boolean {
        return this.#trim;
    }

    /**
     * @param options The options of the parser.
     */
    constructor(options?: O) {
        super(options);
        this.#trim = !!options?.trim;
    }

    /**
     * Validates that the input is a `string`.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is not a primitive `string`.
     * @returns The string received, trimmed if the `trim` option is enabled.
     */
    parse(input: unknown): ParserResult<string, O>;
    parse(input: unknown): string | undefined {
        switch (typeof input) {
            case 'string': {
                return this.#trim
                ?   input.trim()
                :   input;
            }

            case 'undefined': {
                if (this.required) {
                    throw new RequiredValueError(this);
                }

                return input;
            }

            default: {
                throw new InvalidValueError(this, 'of type string', input);
            }
        }
    }
}
