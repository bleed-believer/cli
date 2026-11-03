import type { ParserOptions, ParserResult } from './interfaces/index.ts';

/**
 * Base class of every parser. A parser validates an unknown input
 * (e.g. a value read from a JSON file) and returns it typed and normalized.
 *
 * @typeParam T The type of the parsed value.
 * @typeParam O The options of the parser.
 */
export abstract class Parser<T, O extends ParserOptions> {
    /** Whether `undefined` is rejected instead of returned as is. */
    #required: boolean;
    /** If `true`, parsing `undefined` throws a `RequiredValueError`. */
    get required(): boolean {
        return this.#required;
    }

    /**
     * @param options The options of the parser.
     */
    constructor(options?: O) {
        this.#required = !!options?.required;
    }

    /**
     * Validates and normalizes the given input.
     * @param input The raw value to parse.
     * @returns The parsed value, or `undefined` when the input is `undefined`
     * and the parser is not required.
     */
    abstract parse(input: unknown): ParserResult<T, O>;
}