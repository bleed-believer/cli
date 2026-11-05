import { InvalidLiteralError, InvalidValueError, ParseArrayError, ParseObjectError, RequiredValueError } from './errors/index.ts';
import { BooleanParser } from './boolean.parser.ts';
import { LiteralParser } from './literal.parser.ts';
import { ObjectParser } from './object.parser.ts';
import { ArrayParser } from './array.parser.ts';
import { describe, it } from 'node:test';

type ErrorValidator = (err: unknown) => boolean;

function isError(ctor: new (...a: any[]) => Error): ErrorValidator {
    return (err: unknown) => err instanceof ctor;
}

function isKeyError(key: string, cause: ErrorValidator): ErrorValidator {
    return (err: unknown) =>
        err instanceof ParseObjectError &&
        err.key === key &&
        cause(err.cause);
}

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

        it(`missing required key; throws ParseObjectError caused by RequiredValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ target: 'esm', strict: true }),
                isKeyError('watch', isError(RequiredValueError))
            );
        });

        it(`empty object with a required key; throws ParseObjectError caused by RequiredValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({}),
                isKeyError('watch', isError(RequiredValueError))
            );
        });

        it(`invalid literal value; throws ParseObjectError caused by InvalidLiteralError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ target: 'esmss', watch: true }),
                isKeyError('target', isError(InvalidLiteralError))
            );
        });

        it(`invalid boolean value; throws ParseObjectError caused by InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ strict: 'true', watch: true }),
                isKeyError('strict', isError(InvalidValueError))
            );
        });

        it(`required key set to null; throws ParseObjectError caused by InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ watch: null }),
                isKeyError('watch', isError(InvalidValueError))
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

        it(`missing required nested object; throws ParseObjectError caused by RequiredValueError`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ extra: {} }),
                isKeyError('compiler', isError(RequiredValueError))
            );
        });

        it(`missing required key in nested object; throws ParseObjectError chain`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ compiler: {} }),
                isKeyError('compiler', isKeyError('strict', isError(RequiredValueError)))
            );
        });

        it(`nested value is not an object; throws ParseObjectError caused by InvalidValueError`, (t: it.TestContext) => {
            t.assert.throws(
                () => p.parse({ compiler: 'strict' }),
                isKeyError('compiler', isError(InvalidValueError))
            );
        });
    });

    describe('ParseObjectError', () => {
        it(`message names the key parser and the key`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ strict: 'caca', watch: true }),
                {
                    name: 'ParseObjectError',
                    message: `The object key 'strict' could not be parsed by BooleanParser`
                }
            );
        });

        it(`parser is the key parser`, (t: it.TestContext) => {
            const strict = new BooleanParser();
            const p = new ObjectParser({ keys: { strict } });
            t.assert.throws(
                () => p.parse({ strict: 'caca' }),
                (err: unknown) => err instanceof ParseObjectError && err.parser === strict
            );
        });

        it(`cause is the same error thrown by the key parser`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            const original = new Error('caca');
            t.mock.method(inner, 'parse', () => { throw original; });
            const p = new ObjectParser({ keys: { strict: inner } });

            t.assert.throws(
                () => p.parse({ strict: true }),
                (err: unknown) => err instanceof ParseObjectError && err.cause === original
            );
        });

        it(`wraps non-Error values thrown by the key parser`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            t.mock.method(inner, 'parse', () => { throw 'caca'; });
            const p = new ObjectParser({ keys: { strict: inner } });

            t.assert.throws(
                () => p.parse({ strict: true }),
                (err: unknown) => err instanceof ParseObjectError && err.cause === 'caca'
            );
        });

        it(`does not parse keys after the first invalid one`, (t: it.TestContext) => {
            const last = new BooleanParser();
            const parse = t.mock.method(last, 'parse');
            const p = new ObjectParser({
                keys: {
                    first: new BooleanParser(),
                    second: new BooleanParser(),
                    last
                }
            });

            t.assert.throws(
                () => p.parse({ first: true, second: 'caca', last: true }),
                isKeyError('second', isError(InvalidValueError))
            );
            t.assert.strictEqual(parse.mock.callCount(), 0);
        });

        it(`input itself is invalid; not wrapped`, (t: it.TestContext) => {
            const p = createParser(true);
            t.assert.throws(() => p.parse('caca'), InvalidValueError);
            t.assert.throws(() => p.parse(undefined), RequiredValueError);
        });

        it(`array key; throws ParseObjectError → ParseArrayError chain`, (t: it.TestContext) => {
            const p = new ObjectParser({
                keys: { flags: new ArrayParser({ parser: new BooleanParser() }) }
            });

            t.assert.throws(
                () => p.parse({ flags: [ true, 'caca' ] }),
                isKeyError('flags', (err: unknown) =>
                    err instanceof ParseArrayError &&
                    err.index === 1 &&
                    err.cause instanceof InvalidValueError
                )
            );
        });

        it(`getter that throws; wrapped in ParseObjectError`, (t: it.TestContext) => {
            const p = new ObjectParser({ keys: { strict: new BooleanParser() } });
            const input = {
                get strict(): boolean {
                    throw new Error('caca');
                }
            };

            t.assert.throws(
                () => p.parse(input),
                (err: unknown) => err instanceof ParseObjectError && (err.cause as Error).message === 'caca'
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
