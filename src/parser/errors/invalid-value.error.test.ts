import { InvalidValueError } from './invalid-value.error.ts';
import { BooleanParser } from '../boolean.parser.ts';
import { describe, it } from 'node:test';

describe('new InvalidValueError(parser, expected, received); → error', () => {
    const parser = new BooleanParser();
    const err = new InvalidValueError(parser, 'of type boolean', 'caca');

    it(`name = 'InvalidValueError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidValueError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The value for BooleanParser must be of type boolean. Received type string ('caca')`
        );
    });

    it(`exposes parser, expected and received`, (t: it.TestContext) => {
        t.assert.strictEqual(err.parser, parser);
        t.assert.strictEqual(err.expected, 'of type boolean');
        t.assert.strictEqual(err.received, 'caca');
    });
});
