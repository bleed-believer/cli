import type { ParserResult, LiteralParserOptions, LiteralParserResult } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError, DuplicatedValueError } from './errors/index.ts';
import { Parser } from './parser.ts';
import { inspect } from 'node:util';

/**
 * Parses a `string` that must be one of the given values, optionally
 * ignoring case. The values are compared after Unicode normalization (NFC).
 *
 * @example
 * ```ts
 * const parser = new LiteralParser({
 *     values: [ 'esnext', 'nodenext' ],
 *     ignoreCase: true
 * });
 *
 * parser.parse('ESNext');     // 'esnext'
 * parser.parse('es5');        // throws InvalidValueError
 * ```
 */
export class LiteralParser<
    const O extends LiteralParserOptions
> extends Parser<LiteralParserResult<O>, O> {
    /** The accepted values, indexed by their comparison key. */
    #values: Map<string, LiteralParserResult<O>>;
    /** Description of the accepted values, used in error messages. */
    #expected: string;

    /** Whether the comparison ignores case. */
    #ignoreCase: boolean;
    /** If `true`, the input is matched against the values ignoring case. */
    get ignoreCase(): boolean {
        return this.#ignoreCase;
    }

    /**
     * @param options The options of the parser.
     * @throws {DuplicatedValueError} If two values are the same (or only differ
     * in case when `ignoreCase` is enabled).
     */
    constructor(options: O) {
        super(options);
        this.#ignoreCase = !!options.ignoreCase;
        this.#values = new Map();
        for (const value of options.values) {
            const key = this.#keyOf(value);
            const existing = this.#values.get(key);
            if (typeof existing === 'string') {
                throw new DuplicatedValueError(value, existing, this.#ignoreCase);
            }

            this.#values.set(key, value);
        }

        const expected = Array
            .from(this.#values.values())
            .map(x => inspect(x))
            .join(', ');

        this.#expected = this.#values.size > 1
        ?   `one of ${expected}`
        :   expected;
    }

    /**
     * Gets the key used to compare a value against the accepted values.
     * @param value The value to convert.
     */
    #keyOf(value: string): string {
        return this.#ignoreCase
        ?   value.normalize().toUpperCase().toLowerCase()
        :   value.normalize();
    }

    /**
     * Validates that the input is one of the accepted values.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is not a string or does not match any value.
     * @returns The matching value, as declared in the `values` option (not as received).
     */
    parse(input: unknown): ParserResult<LiteralParserResult<O>, O>;
    parse(input: unknown): LiteralParserResult<O> | undefined {
        if (input === undefined) {
            if (this.required) {
                throw new RequiredValueError(this);
            }

            return input;
        }

        if (typeof input === 'string') {
            const key = this.#keyOf(input);
            const value = this.#values.get(key);
            if (typeof value === 'string') {
                return value;
            }
        }

        throw new InvalidValueError(this, this.#expected, input);
    }
}