import { describe, it } from 'node:test';

import { InvalidExtendsError } from './invalid-extends.error.ts';

describe('new InvalidExtendsError(value); → error', () => {
    const err = new InvalidExtendsError('');

    it(`name = 'InvalidExtendsError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidExtendsError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The "extends" value must be a non-empty string or an array of them. Received ''`
        );
    });

    it(`exposes value`, (t: it.TestContext) => {
        t.assert.strictEqual(err.value, '');
    });
});
