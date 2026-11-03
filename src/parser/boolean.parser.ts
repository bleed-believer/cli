import type { ParserOptions, ParserResult } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses a `boolean` value.
 *
 * @example
 * ```ts
 * const parser = new BooleanParser({ required: true });
 * parser.parse(true);     // true
 * parser.parse('true');   // throws InvalidValueError
 * ```
 */
export class BooleanParser<O extends ParserOptions> extends Parser<boolean, O> {
    /**
     * Validates that the input is a `boolean`.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is not a `boolean`.
     * @returns The same `boolean` received.
     */
    parse(input: unknown): ParserResult<boolean, O>;
    parse(input: unknown): boolean | undefined {
        switch (typeof input) {
            case 'boolean': {
                return input;
            }

            case 'undefined': {
                if (this.required) {
                    throw new RequiredValueError(this);
                }

                return input;
            }

            default: {
                throw new InvalidValueError(this, 'of type boolean', input);
            }
        }
    }
}