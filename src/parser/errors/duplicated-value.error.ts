import { inspect } from 'node:util';

export class DuplicatedValueError extends Error {
    readonly value: string;
    readonly existing: string;
    readonly ignoreCase: boolean;

    constructor(value: string, existing: string, ignoreCase: boolean) {
        super(
            ignoreCase
            ?   `The value ${inspect(value)} collides with ${inspect(existing)} when ignoring case`
            :   `The value ${inspect(value)} is duplicated`
        );

        this.name = 'DuplicatedValueError';
        this.value = value;
        this.existing = existing;
        this.ignoreCase = ignoreCase;
    }
}
