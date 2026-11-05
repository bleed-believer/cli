import { InvalidVersionError } from './invalid-version.error.ts';
import { describe, it } from 'node:test';

describe('new InvalidVersionError(text); → error', () => {
    const err = new InvalidVersionError('7.x');

    it(`name = 'InvalidVersionError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidVersionError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(err.message, `"7.x" is not a valid version`);
    });

    it(`exposes text`, (t: it.TestContext) => {
        t.assert.strictEqual(err.text, '7.x');
    });
});
