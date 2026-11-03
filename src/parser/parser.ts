import type { ParserOptions, ParserResult } from './interfaces/index.ts';

export abstract class Parser<T, O extends ParserOptions> {
    #required: boolean;
    get required(): boolean {
        return this.#required;
    }

    constructor(options?: O) {
        this.#required = !!options?.required;
    }

    abstract parse(input: unknown): ParserResult<T, O>;
}