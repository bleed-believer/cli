import { DuplicatedValueError } from './duplicated-value.error.ts';
import { describe, it } from 'node:test';

describe('new DuplicatedValueError(value, existing, ignoreCase); → error', () => {
    it(`name = 'DuplicatedValueError'`, (t: it.TestContext) => {
        const err = new DuplicatedValueError('bar', 'bar', false);
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'DuplicatedValueError');
    });

    it(`ignoreCase = false; message`, (t: it.TestContext) => {
        const err = new DuplicatedValueError('bar', 'bar', false);
        t.assert.strictEqual(err.message, `The value 'bar' is duplicated`);
    });

    it(`ignoreCase = true; message`, (t: it.TestContext) => {
        const err = new DuplicatedValueError('BAR', 'bar', true);
        t.assert.strictEqual(err.message, `The value 'BAR' collides with 'bar' when ignoring case`);
    });

    it(`exposes value, existing and ignoreCase`, (t: it.TestContext) => {
        const err = new DuplicatedValueError('BAR', 'bar', true);
        t.assert.strictEqual(err.value, 'BAR');
        t.assert.strictEqual(err.existing, 'bar');
        t.assert.strictEqual(err.ignoreCase, true);
    });
});
