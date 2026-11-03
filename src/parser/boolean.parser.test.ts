import { InvalidValueError, RequiredValueError } from './errors/index.ts';
import { BooleanParser } from './boolean.parser.ts';
import { describe, it } from 'node:test';

describe('BooleanParser', () => {
    describe('required = true', () => {
        const required = true;

        it(`value = true`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            const v = p.parse(true);
            t.assert.strictEqual(v, true);
        });

        it(`value = false`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            const v = p.parse(false);
            t.assert.strictEqual(v, false);
        });

        it(`value = undefined`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            t.assert.throws(
                () => p.parse(undefined),
                RequiredValueError
            );
        });

        it(`value = 'caca'`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            t.assert.throws(
                () => p.parse('caca'),
                InvalidValueError
            );
        });
    });

    describe('required = false', () => {
        const required = false;

        it(`value = true`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            const v = p.parse(true);
            t.assert.strictEqual(v, true);
        });

        it(`value = false`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            const v = p.parse(false);
            t.assert.strictEqual(v, false);
        });

        it(`value = undefined`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });

        it(`value = 'caca'`, (t: it.TestContext) => {
            const p = new BooleanParser({ required });
            t.assert.throws(
                () => p.parse('caca'),
                InvalidValueError
            );
        });
    });
});