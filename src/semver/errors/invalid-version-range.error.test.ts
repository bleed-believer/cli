import { InvalidVersionRangeError } from './invalid-version-range.error.ts';
import { describe, it } from 'node:test';

describe('new InvalidVersionRangeError(text); → error', () => {
    const err = new InvalidVersionRangeError('foo');

    it(`name = 'InvalidVersionRangeError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidVersionRangeError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(err.message, `"foo" is not a valid version range`);
    });

    it(`exposes text`, (t: it.TestContext) => {
        t.assert.strictEqual(err.text, 'foo');
    });
});
