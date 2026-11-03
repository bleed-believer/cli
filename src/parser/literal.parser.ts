import type { ParserResult, LiteralParserOptions } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError, DuplicatedValueError } from './errors/index.ts';
import { Parser } from './parser.ts';
import { inspect } from 'node:util';

export class LiteralParser<
    const T extends string,
    O extends LiteralParserOptions
> extends Parser<T, O> {
    #values: Map<string, T>;
    #expected: string;

    #ignoreCase: boolean;
    get ignoreCase(): boolean {
        return this.#ignoreCase;
    }

    constructor(values: [ T, ...T[] ], options?: O) {
        super(options);
        this.#ignoreCase = !!options?.ignoreCase;
        this.#values = new Map();
        for (const value of values) {
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

    #keyOf(value: string): string {
        return this.#ignoreCase
        ?   value.normalize().toUpperCase().toLowerCase()
        :   value.normalize();
    }

    parse(input: unknown): ParserResult<T, O>;
    parse(input: unknown): T | undefined {
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