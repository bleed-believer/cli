/**
 * Thrown by a `NumberParser` when its `min`/`max` options do not form a
 * valid range: one of them is `NaN`, or `min` is greater than `max`.
 */
export class InvalidRangeError extends Error {
    /** The `min` option received. */
    readonly min: number | undefined;
    /** The `max` option received. */
    readonly max: number | undefined;

    /**
     * @param min The `min` option received.
     * @param max The `max` option received.
     */
    constructor(min: number | undefined, max: number | undefined) {
        super(
            Number.isNaN(min) || Number.isNaN(max)
            ?   `The range limits cannot be NaN. Received min = ${min}, max = ${max}`
            :   `The range min (${min}) cannot be greater than max (${max})`
        );

        this.name = 'InvalidRangeError';
        this.min = min;
        this.max = max;
    }
}
