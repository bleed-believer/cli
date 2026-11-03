import { InvalidRangeError } from './invalid-range.error.ts';
import { describe, it } from 'node:test';

describe('new InvalidRangeError(min, max); → error', () => {
    it(`name = 'InvalidRangeError'`, (t: it.TestContext) => {
        const err = new InvalidRangeError(10, 5);
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidRangeError');
    });

    it(`min > max; message`, (t: it.TestContext) => {
        const err = new InvalidRangeError(10, 5);
        t.assert.strictEqual(err.message, 'The range min (10) cannot be greater than max (5)');
    });

    it(`min = NaN; message`, (t: it.TestContext) => {
        const err = new InvalidRangeError(NaN, 5);
        t.assert.strictEqual(err.message, 'The range limits cannot be NaN. Received min = NaN, max = 5');
    });

    it(`max = NaN; message`, (t: it.TestContext) => {
        const err = new InvalidRangeError(undefined, NaN);
        t.assert.strictEqual(err.message, 'The range limits cannot be NaN. Received min = undefined, max = NaN');
    });

    it(`exposes min and max`, (t: it.TestContext) => {
        const err = new InvalidRangeError(10, 5);
        t.assert.strictEqual(err.min, 10);
        t.assert.strictEqual(err.max, 5);
    });
});
