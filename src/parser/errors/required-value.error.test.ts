import { RequiredValueError } from './required-value.error.ts';
import { BooleanParser } from '../boolean.parser.ts';
import { describe, it } from 'node:test';

describe('new RequiredValueError(parser); → error', () => {
    const parser = new BooleanParser();
    const err = new RequiredValueError(parser);

    it(`name = 'RequiredValueError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'RequiredValueError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            'The value for BooleanParser is required. Received undefined'
        );
    });

    it(`exposes parser`, (t: it.TestContext) => {
        t.assert.strictEqual(err.parser, parser);
    });
});
