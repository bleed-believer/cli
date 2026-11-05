import { ParseObjectError } from './parse-object.error.ts';
import { BooleanParser } from '../boolean.parser.ts';
import { describe, it } from 'node:test';

describe('new ParseObjectError(parser, key, cause); → error', () => {
    const parser = new BooleanParser();
    const cause = new Error('caca');
    const err = new ParseObjectError(parser, 'strict', cause);

    it(`name = 'ParseObjectError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'ParseObjectError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The object key 'strict' could not be parsed by BooleanParser`
        );
    });

    it(`exposes parser, key and cause`, (t: it.TestContext) => {
        t.assert.strictEqual(err.parser, parser);
        t.assert.strictEqual(err.key, 'strict');
        t.assert.strictEqual(err.cause, cause);
    });
});
