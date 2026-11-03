import type { ParserResult, NumberParserOptions } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError, InvalidRangeError } from './errors/index.ts';
import { Parser } from './parser.ts';

/**
 * Parses a finite `number`, optionally restricted to integers and to an
 * inclusive range. `NaN`, `Infinity` and `-Infinity` are always rejected.
 *
 * @example
 * ```ts
 * const parser = new NumberParser({ min: 0, max: 10 });
 * parser.parse(5);        // 5
 * parser.parse(5.5);      // throws InvalidValueError (not an integer)
 * parser.parse(11);       // throws InvalidValueError (out of range)
 * ```
 */
export class NumberParser<O extends NumberParserOptions> extends Parser<number, O> {
    /** Description of the accepted values, used in error messages. */
    #expected: string;

    /** Whether non-integer numbers are accepted. */
    #float: boolean;
    /** If `true`, any finite number is accepted. Otherwise, only integers. */
    get float(): boolean {
        return this.#float;
    }

    /** The inclusive lower limit, if any. */
    #min: number | undefined;
    /** The inclusive lower limit of the accepted values, if any. */
    get min(): number | undefined {
        return this.#min;
    }

    /** The inclusive upper limit, if any. */
    #max: number | undefined;
    /** The inclusive upper limit of the accepted values, if any. */
    get max(): number | undefined {
        return this.#max;
    }

    /**
     * @param options The options of the parser.
     * @throws {InvalidRangeError} If `min` or `max` is `NaN`, or if `min` is greater than `max`.
     */
    constructor(options?: O) {
        super(options);
        this.#float = !!options?.float;
        this.#min = options?.min;
        this.#max = options?.max;

        if (
            Number.isNaN(this.#min) ||
            Number.isNaN(this.#max) ||
            (
                typeof this.#min === 'number' &&
                typeof this.#max === 'number' &&
                this.#min > this.#max
            )
        ) {
            throw new InvalidRangeError(this.#min, this.#max);
        }

        const range: string[] = [];
        if (typeof this.#min === 'number') {
            range.push(`>= ${this.#min}`);
        }

        if (typeof this.#max === 'number') {
            range.push(`<= ${this.#max}`);
        }

        this.#expected = [
            this.#float ? 'a finite number' : 'an integer',
            range.join(' && ')
        ]
            .filter(x => x.length > 0)
            .join(' ');
    }

    /**
     * Validates that the input is a finite number that satisfies the options.
     * @param input The raw value to parse.
     * @throws {RequiredValueError} If `input` is `undefined` and the parser is required.
     * @throws {InvalidValueError} If `input` is not a finite number, is not an
     * integer when `float` is disabled, or is outside the `min`/`max` range.
     * @returns The same number received.
     */
    parse(input: unknown): ParserResult<number, O>;
    parse(input: unknown): number | undefined {
        if (input === undefined) {
            if (this.required) {
                throw new RequiredValueError(this);
            }

            return input;
        }

        if (
            typeof input === 'number' &&
            Number.isFinite(input) &&
            (this.#float || Number.isInteger(input)) &&
            (typeof this.#min !== 'number' || input >= this.#min) &&
            (typeof this.#max !== 'number' || input <= this.#max)
        ) {
            return input;
        }

        throw new InvalidValueError(this, this.#expected, input);
    }
}
