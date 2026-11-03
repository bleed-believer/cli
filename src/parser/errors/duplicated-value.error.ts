import { inspect } from 'node:util';

/** Thrown by a `LiteralParser` when its `values` option contains duplicates. */
export class DuplicatedValueError extends Error {
    /** The duplicated value. */
    readonly value: string;
    /** The previously declared value that collides with `value`. */
    readonly existing: string;
    /** Whether the collision was detected ignoring case. */
    readonly ignoreCase: boolean;

    /**
     * @param value The duplicated value.
     * @param existing The previously declared value that collides with `value`.
     * @param ignoreCase Whether the collision was detected ignoring case.
     */
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
