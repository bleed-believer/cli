import { ParseMapError } from './parse-map.error.ts';
import { BooleanParser } from '../boolean.parser.ts';
import { describe, it } from 'node:test';

describe('new ParseMapError(parser, key, cause); → error', () => {
    const parser = new BooleanParser();
    const cause = new Error('caca');
    const err = new ParseMapError(parser, '@app/*', cause);

    it(`name = 'ParseMapError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'ParseMapError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The map value at key '@app/*' could not be parsed by BooleanParser`
        );
    });

    it(`exposes parser, key and cause`, (t: it.TestContext) => {
        t.assert.strictEqual(err.parser, parser);
        t.assert.strictEqual(err.key, '@app/*');
        t.assert.strictEqual(err.cause, cause);
    });
});
