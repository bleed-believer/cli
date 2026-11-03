import { InvalidValueError, RequiredValueError } from './errors/index.ts';
import { BooleanParser } from './boolean.parser.ts';
import { LiteralParser } from './literal.parser.ts';
import { ObjectParser } from './object.parser.ts';
import { describe, it } from 'node:test';

function createParser(required?: boolean) {
    return new ObjectParser({
        required,
        keys: {
            target: new LiteralParser({
                values: [ 'esnext', 'esm' ],
                ignoreCase: true
            }),
            strict: new BooleanParser(),
            watch: new BooleanParser({ required: true })
        }
    });
}

describe('ObjectParser', () => {
    describe('input = undefined', () => {
        it(`required = true; throws RequiredValueError`, (t: it.TestContext) => {
            const p = createParser(true);
            t.assert.throws(
                () => p.parse(undefined),
                RequiredValueError
            );
        });

        it(`required = false; returns undefined`, (t: it.TestContext) => {
            const p = createParser(false);
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });

        it(`required not defined; returns undefined`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });
    });

    describe('input is not an object', () => {
        const inputs: unknown[] = [
            null,
            666,
            0,
            'esnext',
            '',
            true,
            false,
            666n,
            Symbol('foo'),
            () => ({ watch: true })
        ];

        for (const input of inputs) {
            it(`input = ${String(input)}; throws InvalidValueError`, (t: it.TestContext) => {
                const p = createParser();
                t.assert.throws(
                    () => p.parse(input),
                    InvalidValueError
                );
            });
        }

        it(`input = null; required = true; throws InvalidValueError`, (t: it.TestContext) => {
            const p = createParser(true);
            t.assert.throws(
                () => p.parse(null),
                InvalidValueError
            );
        });
    });

    describe('input is an object', () => {
        it(`all keys defined`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ target: 'esm', strict: false, watch: true });
            t.assert.deepStrictEqual(v, { target: 'esm', strict: false, watch: true });
        });

        it(`normalizes values through the inner parsers`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ target: 'ESNext', watch: false });
            t.assert.deepStrictEqual(v, { target: 'esnext', watch: false });
        });

        it(`omits optional keys not defined`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ watch: true });
            t.assert.deepStrictEqual(v, { watch: true });
            t.assert.ok(!Object.hasOwn(v!, 'target'));
            t.assert.ok(!Object.hasOwn(v!, 'strict'));
        });

        it(`omits optional keys explicitly set to undefined`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ target: undefined, strict: undefined, watch: true });
            t.assert.deepStrictEqual(v, { watch: true });
        });

        it(`ignores unknown keys`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ caca: false, ñee: 666, watch: true });
            t.assert.deepStrictEqual(v, { watch: true });
        });

        it(`returns a new object instead of the input`, (t: it.TestContext) => {
            const p = createParser();
            const input = { target: 'esm', strict: true, watch: true };
            const v = p.parse(input);
            t.assert.notStrictEqual(v, input);
        });

        it(`does not mutate the input`, (t: it.TestContext) => {
            const p = createParser();
            const input = { target: 'ESM', caca: 666, watch: true };
            p.parse(input);
            t.assert.deepStrictEqual(input, { target: 'ESM', caca: 666, watch: true });
        });

        it(`missing required key; throws RequiredValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ target: 'esm', strict: true }),
                RequiredValueError
            );
        });

        it(`empty object with a required key; throws RequiredValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({}),
                RequiredValueError
            );
        });

        it(`invalid literal value; throws InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ target: 'esmss', watch: true }),
                InvalidValueError
            );
        });

        it(`invalid boolean value; throws InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ strict: 'true', watch: true }),
                InvalidValueError
            );
        });

        it(`required key set to null; throws InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ watch: null }),
                InvalidValueError
            );
        });

        it(`object without prototype`, (t: it.TestContext) => {
            const p = createParser();
            const input = Object.assign(Object.create(null), { target: 'esm', watch: true });
            const v = p.parse(input);
            t.assert.deepStrictEqual(v, { target: 'esm', watch: true });
        });
    });

    describe('empty keys', () => {
        it(`input = {}; returns {}`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: {} });
            const v = p.parse({});
            t.assert.deepStrictEqual(v, {});
        });

        it(`input with unknown keys; returns {}`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: {} });
            const v = p.parse({ foo: 'bar' });
            t.assert.deepStrictEqual(v, {});
        });
    });

    describe('nested ObjectParser', () => {
        const p = new ObjectParser({
            keys: {
                compiler: new ObjectParser({
                    required: true,
                    keys: {
                        strict: new BooleanParser({ required: true })
                    }
                }),
                extra: new ObjectParser({
                    keys: {
                        strict: new BooleanParser()
                    }
                })
            }
        });

        it(`parses nested values`, (t: it.TestContext) => {
            const v = p.parse({ compiler: { strict: true, caca: 666 }, extra: {} });
            t.assert.deepStrictEqual(v, { compiler: { strict: true }, extra: {} });
        });

        it(`omits optional nested object not defined`, (t: it.TestContext) => {
            const v = p.parse({ compiler: { strict: false } });
            t.assert.deepStrictEqual(v, { compiler: { strict: false } });
        });

        it(`missing required nested object; throws RequiredValueError`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ extra: {} }),
                RequiredValueError
            );
        });

        it(`missing required key in nested object; throws RequiredValueError`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ compiler: {} }),
                RequiredValueError
            );
        });

        it(`nested value is not an object; throws InvalidValueError`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ compiler: 'strict' }),
                InvalidValueError
            );
        });
    });

    describe('edge cases', () => {
        it(`input = []; throws InvalidValueError`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: { strict: new BooleanParser() } });
            t.assert.throws(
                () => p.parse([]),
                InvalidValueError
            );
        });

        it(`input = new Date(); throws InvalidValueError`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: { strict: new BooleanParser() } });
            t.assert.throws(
                () => p.parse(new Date()),
                InvalidValueError
            );
        });

        it(`does not read keys from the prototype chain`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: { strict: new BooleanParser() } });
            const input = Object.create({ strict: true });
            const v = p.parse(input);
            t.assert.deepStrictEqual(v, {});
        });

        it(`key named like an Object.prototype member`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: { toString: new BooleanParser() } });
            const v = p.parse({});
            t.assert.deepStrictEqual(v, {});
        });

        it(`key named "__proto__"`, (t: it.TestContext) => {
            const p = new ObjectParser({
                keys: { ['__proto__']: new BooleanParser() }
            });
            const input = JSON.parse('{ "__proto__": true }');
            const v = p.parse(input);
            t.assert.strictEqual(Object.getPrototypeOf(v), Object.prototype);
            t.assert.strictEqual(Object.getOwnPropertyDescriptor(v, '__proto__')?.value, true);
        });
    });
});
