import { InvalidLiteralError, InvalidValueError, ParseArrayError, ParseObjectError, RequiredValueError } from './errors/index.ts';
import { BooleanParser } from './boolean.parser.ts';
import { LiteralParser } from './literal.parser.ts';
import { ObjectParser } from './object.parser.ts';
import { ArrayParser } from './array.parser.ts';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

type ErrorValidator = (err: unknown) => boolean;

function isError(ctor: new (...a: any[]) => Error): ErrorValidator {
    return (err: unknown) => err instanceof ctor;
}

function isItemError(index: number, cause: ErrorValidator): ErrorValidator {
    return (err: unknown) =>
        err instanceof ParseArrayError &&
        err.index === index &&
        cause(err.cause);
}

function createParser(required?: boolean) {
    return new ArrayParser({
        required,
        parser: new LiteralParser({
            values: [ 'esnext', 'esm' ],
            ignoreCase: true
        })
    });
}

describe('ArrayParser', () => {
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

    describe('input is not an array', () => {
        const inputs: unknown[] = [
            null,
            666,
            0,
            NaN,
            'esnext',
            '',
            true,
            false,
            666n,
            Symbol('foo'),
            () => [ 'esm' ],
            {},
            { 0: 'esm', length: 1 },
            new Set([ 'esm' ]),
            new Map([ [ 0, 'esm' ] ]),
            new Uint8Array([ 1, 2 ]),
            new Date(),
            Object.create(null)
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

    describe('input is an array', () => {
        it(`input = []; returns []`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse([]);
            t.assert.deepStrictEqual(v, []);
        });

        it(`input = []; required = true; returns []`, (t: it.TestContext) => {
            const p = createParser(true);
            const v = p.parse([]);
            t.assert.deepStrictEqual(v, []);
        });

        it(`all items valid`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse([ 'esnext', 'esm' ]);
            t.assert.deepStrictEqual(v, [ 'esnext', 'esm' ]);
        });

        it(`normalizes items through the inner parser`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse([ 'ESNext', 'ESM' ]);
            t.assert.deepStrictEqual(v, [ 'esnext', 'esm' ]);
        });

        it(`keeps the order and duplicated items`, (t: it.TestContext) => {
            const p = createParser();
            const v = p.parse([ 'esm', 'esnext', 'ESM', 'esm' ]);
            t.assert.deepStrictEqual(v, [ 'esm', 'esnext', 'esm', 'esm' ]);
        });

        it(`returns a new array instead of the input`, (t: it.TestContext) => {
            const p = createParser();
            const input = [ 'esm' ];
            const v = p.parse(input);
            t.assert.notStrictEqual(v, input);
        });

        it(`does not mutate the input`, (t: it.TestContext) => {
            const p = createParser();
            const input = [ 'ESM', 'ESNext' ];
            p.parse(input);
            t.assert.deepStrictEqual(input, [ 'ESM', 'ESNext' ]);
        });

        it(`invalid item; throws ParseArrayError caused by InvalidLiteralError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse([ 'esm', 'esmss' ]),
                isItemError(1, isError(InvalidLiteralError))
            );
        });

        it(`null item; throws ParseArrayError caused by InvalidLiteralError`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse([ 'esm', null ]),
                isItemError(1, isError(InvalidLiteralError))
            );
        });

        it(`does not parse items after the first invalid one`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            const parse = t.mock.method(inner, 'parse');
            const p = new ArrayParser({ parser: inner });

            t.assert.throws(
                () => p.parse([ true, 'caca', false ]),
                isItemError(1, isError(InvalidValueError))
            );
            t.assert.strictEqual(parse.mock.callCount(), 2);
        });
    });

    describe('undefined items', () => {
        it(`required inner parser; throws ParseArrayError caused by RequiredValueError`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser({ required: true }) });
            t.assert.throws(
                () => p.parse([ true, undefined ]),
                isItemError(1, isError(RequiredValueError))
            );
        });

        it(`optional inner parser; keeps undefined in place`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser() });
            const v = p.parse([ true, undefined, false ]);
            t.assert.deepStrictEqual(v, [ true, undefined, false ]);
        });

        it(`sparse array; holes are parsed as undefined`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser() });
            const v = p.parse([ true, , false ]);
            t.assert.deepStrictEqual(v, [ true, undefined, false ]);
            t.assert.ok(Object.hasOwn(v!, 1));
        });

        it(`sparse array with required inner parser; throws ParseArrayError caused by RequiredValueError`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser({ required: true }) });
            t.assert.throws(
                () => p.parse(new Array(3)),
                isItemError(0, isError(RequiredValueError))
            );
        });
    });

    describe('nested parsers', () => {
        it(`array of arrays`, (t: it.TestContext) => {
            const p = new ArrayParser({
                parser: new ArrayParser({
                    required: true,
                    parser: new BooleanParser({ required: true })
                })
            });

            const v = p.parse([ [ true ], [], [ false, true ] ]);
            t.assert.deepStrictEqual(v, [ [ true ], [], [ false, true ] ]);
        });

        it(`array of arrays; invalid nested item; throws ParseArrayError chain`, (t: it.TestContext) => {
            const p = new ArrayParser({
                parser: new ArrayParser({ parser: new BooleanParser() })
            });

            t.assert.throws(
                () => p.parse([ [ true ], [ true, 'caca' ] ]),
                isItemError(1, isItemError(1, isError(InvalidValueError)))
            );
        });

        it(`array of arrays; nested item is not an array; throws ParseArrayError caused by InvalidValueError`, (t: it.TestContext) => {
            const p = new ArrayParser({
                parser: new ArrayParser({ parser: new BooleanParser() })
            });

            t.assert.throws(
                () => p.parse([ [ true ], true ]),
                isItemError(1, isError(InvalidValueError))
            );
        });

        it(`array of objects`, (t: it.TestContext) => {
            const p = new ArrayParser({
                parser: new ObjectParser({
                    required: true,
                    keys: { strict: new BooleanParser({ required: true }) }
                })
            });

            const v = p.parse([ { strict: true, caca: 666 }, { strict: false } ]);
            t.assert.deepStrictEqual(v, [ { strict: true }, { strict: false } ]);
        });

        it(`array of objects; missing required key; throws ParseArrayError → ParseObjectError chain`, (t: it.TestContext) => {
            const p = new ArrayParser({
                parser: new ObjectParser({
                    keys: { strict: new BooleanParser({ required: true }) }
                })
            });

            t.assert.throws(
                () => p.parse([ { strict: true }, {} ]),
                isItemError(1, (err: unknown) =>
                    err instanceof ParseObjectError &&
                    err.key === 'strict' &&
                    err.cause instanceof RequiredValueError
                )
            );
        });

        it(`object with an array key`, (t: it.TestContext) => {
            const p = new ObjectParser({
                keys: {
                    targets: new ArrayParser({
                        required: true,
                        parser: new LiteralParser({ values: [ 'esnext', 'esm' ], ignoreCase: true })
                    })
                }
            });

            const v = p.parse({ targets: [ 'ESM' ] });
            t.assert.deepStrictEqual(v, { targets: [ 'esm' ] });
        });
    });

    describe('ParseArrayError', () => {
        it(`message names the inner parser and the index`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser() });
            t.assert.throws(
                () => p.parse([ true, false, 'caca' ]),
                {
                    name: 'ParseArrayError',
                    message: 'The array item at index 2 could not be parsed by BooleanParser'
                }
            );
        });

        it(`first item fails; index = 0`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse([ 'caca', 'esm' ]),
                isItemError(0, isError(InvalidLiteralError))
            );
        });

        it(`cause is the same error thrown by the inner parser`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            const original = new Error('caca');
            t.mock.method(inner, 'parse', () => { throw original; });
            const p = new ArrayParser({ parser: inner });

            t.assert.throws(
                () => p.parse([ true ]),
                (err: unknown) => err instanceof ParseArrayError && err.cause === original
            );
        });

        it(`wraps non-Error values thrown by the inner parser`, (t: it.TestContext) => {
            const inner = new BooleanParser();
            t.mock.method(inner, 'parse', () => { throw 'caca'; });
            const p = new ArrayParser({ parser: inner });

            t.assert.throws(
                () => p.parse([ true ]),
                (err: unknown) => err instanceof ParseArrayError && err.cause === 'caca'
            );
        });

        it(`input itself is invalid; not wrapped`, (t: it.TestContext) => {
            const p = createParser(true);
            t.assert.throws(() => p.parse('esm'), InvalidValueError);
            t.assert.throws(() => p.parse(undefined), RequiredValueError);
        });

        it(`wrapped by ObjectParser in a ParseObjectError`, (t: it.TestContext) => {
            const p = new ObjectParser({
                keys: { flags: new ArrayParser({ parser: new BooleanParser() }) }
            });

            t.assert.throws(
                () => p.parse({ flags: [ true, 'caca' ] }),
                (err: unknown) =>
                    err instanceof ParseObjectError &&
                    err.key === 'flags' &&
                    isItemError(1, isError(InvalidValueError))(err.cause)
            );
        });
    });

    describe('edge cases', () => {
        it(`Array subclass; returns a plain Array`, (t: it.TestContext) => {
            class MyArray<T> extends Array<T> {}
            const p = new ArrayParser({ parser: new BooleanParser() });
            const input = MyArray.from([ true, false ]);

            const v = p.parse(input);
            t.assert.deepStrictEqual(v, [ true, false ]);
            t.assert.strictEqual(Object.getPrototypeOf(v), Array.prototype);
        });

        it(`Proxy of an array`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser() });
            const v = p.parse(new Proxy([ true, false ], {}));
            t.assert.deepStrictEqual(v, [ true, false ]);
        });

        it(`ignores non-index properties of the input`, (t: it.TestContext) => {
            const p = new ArrayParser({ parser: new BooleanParser() });
            const input = Object.assign([ true ], { foo: 'caca' });

            const v = p.parse(input);
            t.assert.deepStrictEqual(v, [ true ]);
            t.assert.ok(!Object.hasOwn(v!, 'foo'));
        });

        it(`input with null prototype; error message names the received value`, (t: it.TestContext) => {
            const p = createParser();
            t.assert.throws(
                () => p.parse(Object.create(null)),
                (err: unknown) => err instanceof InvalidValueError &&
                    err.message.includes('Object')
            );
        });
    });
});
