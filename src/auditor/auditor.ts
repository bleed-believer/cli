import type { AuditorResult } from './interfaces/index.ts';

export abstract class Auditor<T, R extends boolean> {
    #required: R;
    get required(): R {
        return this.#required;
    }

    constructor(required?: R) {
        this.#required = !!required as R;
    }

    abstract audit(input: unknown): AuditorResult<T, R>;
}