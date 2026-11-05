import { InvalidLiteralError } from './invalid-literal.error.ts';
import { LiteralParser } from '../literal.parser.ts';
import { describe, it } from 'node:test';

describe('new InvalidLiteralError(parser, expected, received); → error', () => {
    const parser = new LiteralParser({ values: [ 'esm', 'esnext' ] });
    const expected = [ 'esm', 'esnext' ];
    const err = new InvalidLiteralError(parser, expected, 'cjs');

    it(`name = 'InvalidLiteralError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidLiteralError');
    });

    it(`several values; message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The value for LiteralParser must be one of 'esm', 'esnext'. Received type string ('cjs')`
        );
    });

    it(`single value; message`, (t: it.TestContext) => {
        const err = new InvalidLiteralError(parser, [ 'esm' ], 666);
        t.assert.strictEqual(
            err.message,
            `The value for LiteralParser must be 'esm'. Received type number (666)`
        );
    });

    it(`values with quotes are escaped`, (t: it.TestContext) => {
        const err = new InvalidLiteralError(parser, [ `it's`, 'foo' ], 'bar');
        t.assert.strictEqual(
            err.message,
            `The value for LiteralParser must be one of "it's", 'foo'. Received type string ('bar')`
        );
    });

    it(`exposes parser, expected and received`, (t: it.TestContext) => {
        t.assert.strictEqual(err.parser, parser);
        t.assert.strictEqual(err.expected, expected);
        t.assert.strictEqual(err.received, 'cjs');
    });
});
