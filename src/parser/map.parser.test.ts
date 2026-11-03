import { InvalidValueError, ParseArrayError, ParseMapError, RequiredValueError } from './errors/index.ts';
import { BooleanParser } from './boolean.parser.ts';
import { StringParser } from './string.parser.ts';
import { ObjectParser } from './object.parser.ts';
import { ArrayParser } from './array.parser.ts';
import { MapParser } from './map.parser.ts';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

type ErrorValidator = (err: unknown) => boolean;

function isError(ctor: new (...a: any[]) => Error): ErrorValidator {
    return (err: unknown) => err instanceof ctor;
}

function isValueError(key: string, cause: ErrorValidator): ErrorValidator {
    return (err: unknown) =>
        err instanceof ParseMapError &&
        err.key === key &&
        cause(err.cause);
}

function createParser(required?: boolean) {
    return new MapParser({
        required,
        parser: new BooleanParser({ required: true })
    });
}

describe('MapParser', () => {
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
            'caca',
            '',
            true,
            false,
            666n,
            Symbol('foo'),
            () => ({ foo: true }),
            [],
            [ true ],
            new Date()
        ];

        for (const input of inputs) {
            it(`input = ${inspect(input)}; throws InvalidValueError`, (t: it.TestContext) => {
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
        it(`input = {}; returns {}`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({});
            t.assert.deepStrictEqual(v, {});
        });

        it(`input = {}; required = true; returns {}`, (t: it.TestContext) => {
            const p = createParser(true);
            const v = p.parse({});
            t.assert.deepStrictEqual(v, {});
        });

        it(`parses every key`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ foo: true, bar: false, 'ñee caca': true });
            t.assert.deepStrictEqual(v, { foo: true, bar: false, 'ñee caca': true });
        });

        it(`normalizes values through the inner parser`, (t: it.TestContext) => {
            const p = new MapParser({ parser: new StringParser({ trim: true }) });
            const v = p.parse({ foo: '  bar  ' });
            t.assert.deepStrictEqual(v, { foo: 'bar' });
        });

        it(`keeps the key order of the input`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ c: true, a: true, b: true });
            t.assert.deepStrictEqual(Object.keys(v!), [ 'c', 'a', 'b' ]);
        });

        it(`returns a new object instead of the input`, (t: it.TestContext) => {
            const p = createParser();
            const input = { foo: true };
            const v = p.parse(input);
            t.assert.notStrictEqual(v, input);
        });

        it(`does not mutate the input`, (t: it.TestContext) => {
            const p = new MapParser({ parser: new StringParser({ trim: true }) });
            const input = { foo: ' bar ', baz: undefined };
            p.parse(input);
            t.assert.deepStrictEqual(input, { foo: ' bar ', baz: undefined });
        });

        it(`object without prototype`, (t: it.TestContext) => {
            const p = createParser();
            const input = Object.assign(Object.create(null), { foo: true });
            const v = p.parse(input);
            t.assert.deepStrictEqual(v, { foo: true });
        });
    });

    describe('invalid values', () => {
        it(`invalid value; throws ParseMapError caused by InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ foo: true, bar: 'caca' }),
                isValueError('bar', isError(InvalidValueError))
            );
        });

        it(`null value; throws ParseMapError caused by InvalidValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ foo: null }),
                isValueError('foo', isError(InvalidValueError))
            );
        });

        it(`does not parse values after the first invalid one`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            const parse = t.mock.method(inner, 'parse');
            const p = new MapParser({ parser: inner });

            t.assert.throws(
                () => p.parse({ a: true, b: 'caca', c: false }),
                isValueError('b', isError(InvalidValueError))
            );
            t.assert.strictEqual(parse.mock.callCount(), 2);
        });

        it(`cause is the same error thrown by the inner parser`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            const original = new Error('caca');
            t.mock.method(inner, 'parse', () => { throw original; });
            const p = new MapParser({ parser: inner });

            t.assert.throws(
                () => p.parse({ foo: true }),
                (err: unknown) => err instanceof ParseMapError && err.cause === original
            );
        });

        it(`message names the inner parser and the key`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ '@app/*': 'caca' }),
                {
                    name: 'ParseMapError',
                    message: `The map value at key '@app/*' could not be parsed by BooleanParser`
                }
            );
        });
    });

    describe('undefined values', () => {
        it(`required inner parser; throws ParseMapError caused by RequiredValueError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse({ foo: true, bar: undefined }),
                isValueError('bar', isError(RequiredValueError))
            );
        });

        it(`optional inner parser; omits the key`, (t: it.TestContext) => {
            const p = new MapParser({ parser: new BooleanParser() });
            const v = p.parse({ foo: true, bar: undefined });
            t.assert.deepStrictEqual(v, { foo: true });
            t.assert.ok(!Object.hasOwn(v!, 'bar'));
        });
    });

    describe('nested parsers', () => {
        it(`map of string arrays (tsconfig paths)`, (t: it.TestContext) => {
            const p = new MapParser({
                parser: new ArrayParser({
                    required: true,
                    parser: new StringParser({ required: true })
                })
            });

            const input = {
                '@app/*': [ './src/app/*' ],
                '@lib/*': [ './src/lib/*', './vendor/lib/*' ],
                'empty': []
            };

            const v = p.parse(input);
            t.assert.deepStrictEqual(v, input);
        });

        it(`map of string arrays; invalid item; throws ParseMapError → ParseArrayError chain`, (t: it.TestContext) => {
            const p = new MapParser({
                parser: new ArrayParser({ parser: new StringParser() })
            });

            t.assert.throws(
                () => p.parse({ '@app/*': [ './src/app/*' ], '@lib/*': [ './src/lib/*', 666 ] }),
                isValueError('@lib/*', (err: unknown) =>
                    err instanceof ParseArrayError &&
                    err.index === 1 &&
                    err.cause instanceof InvalidValueError
                )
            );
        });

        it(`map of maps`, (t: it.TestContext) => {
            const p = new MapParser({
                parser: new MapParser({ required: true, parser: new BooleanParser() })
            });

            const v = p.parse({ foo: { a: true }, bar: {} });
            t.assert.deepStrictEqual(v, { foo: { a: true }, bar: {} });
        });

        it(`map of maps; invalid nested value; throws ParseMapError chain`, (t: it.TestContext) => {
            const p = new MapParser({
                parser: new MapParser({ parser: new BooleanParser() })
            });

            t.assert.throws(
                () => p.parse({ foo: { a: true }, bar: { b: 'caca' } }),
                isValueError('bar', isValueError('b', isError(InvalidValueError)))
            );
        });

        it(`object with a map key`, (t: it.TestContext) => {
            const p = new ObjectParser({
                keys: {
                    paths: new MapParser({
                        parser: new ArrayParser({ parser: new StringParser() })
                    })
                }
            });

            const v = p.parse({ paths: { '@app/*': [ './src/*' ] }, caca: 666 });
            t.assert.deepStrictEqual(v, { paths: { '@app/*': [ './src/*' ] } });
        });
    });

    describe('edge cases', () => {
        it(`ignores keys from the prototype chain`, (t: it.TestContext) => {
            const p = createParser();
            const input = Object.assign(Object.create({ inherited: true }), { own: true });
            const v = p.parse(input);
            t.assert.deepStrictEqual(v, { own: true });
        });

        it(`ignores non-enumerable keys`, (t: it.TestContext) => {
            const p = createParser();
            const input = Object.defineProperty({ foo: true }, 'hidden', {
                value: 'caca',
                enumerable: false
            });

            const v = p.parse(input);
            t.assert.deepStrictEqual(v, { foo: true });
        });

        it(`ignores symbol keys`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ foo: true, [Symbol('bar')]: 'caca' });
            t.assert.deepStrictEqual(v, { foo: true });
        });

        it(`integer-like keys follow JS property order`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ b: true, 2: true, a: true, 1: true });
            t.assert.deepStrictEqual(Object.keys(v!), [ '1', '2', 'b', 'a' ]);
        });

        it(`empty string key`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ '': true });
            t.assert.deepStrictEqual(v, { '': true });
        });

        it(`key named like an Object.prototype member`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse({ toString: true, constructor: false });
            t.assert.deepStrictEqual(v, { toString: true, constructor: false });
        });

        it(`key named "__proto__"`, (t: it.TestContext) => {
            const p = createParser();
            const input = JSON.parse('{ "__proto__": true }');
            const v = p.parse(input);
            t.assert.strictEqual(Object.getPrototypeOf(v), Object.prototype);
            t.assert.strictEqual(Object.getOwnPropertyDescriptor(v, '__proto__')?.value, true);
        });

        it(`Map instance; returns {}`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse(new Map([ [ 'foo', true ] ]));
            t.assert.deepStrictEqual(v, {});
        });

        it(`getter that throws; wrapped in ParseMapError`, (t: it.TestContext) => {
            const p = createParser();
            const input = {
                get foo(): boolean {
                    throw new Error('caca');
                }
            };

            t.assert.throws(
                () => p.parse(input),
                (err: unknown) => err instanceof ParseMapError && (err.cause as Error).message === 'caca'
            );
        });
    });
});
