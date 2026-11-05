import { inspect } from 'node:util';

/** Thrown when the `extends` value is not a non-empty string or an array of them. */
export class InvalidExtendsError extends Error {
    /** The value that was rejected. */
    readonly value: unknown;

    /**
     * @param value The value that was rejected.
     */
    constructor(value: unknown) {
        super(`The "extends" value must be a non-empty string or an array of them. Received ${inspect(value)}`);
        this.name = 'InvalidExtendsError';
        this.value = value;
    }
}
