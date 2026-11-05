import type { LiteralParserOptions } from './interfaces/index.ts';

import { RequiredValueError, InvalidLiteralError, InvalidValueError, DuplicatedValueError } from './errors/index.ts';
import { LiteralParser } from './literal.parser.ts';
import { describe, it } from 'node:test';

type ErrorConstructor = (new(...a: any[]) => Error);
type ExpectedValue = string | undefined | ErrorConstructor;

interface TestCase {
    input: unknown;
    expected: ExpectedValue;
}

interface TestSuite {
    values: [ string, ...string[] ];
    options: Omit<LiteralParserOptions, 'values'>;
    testCases?: TestCase[];
    testError?: ErrorConstructor;
}

const suites: TestSuite[] = [
    {
        values: [ 'foo', 'bar' ],
        options: {
            required: true,
            ignoreCase: true
        },
        testCases: [
            { input: 'foo',     expected: 'foo' },
            { input: 'bar',     expected: 'bar' },
            { input: 'FOO',     expected: 'foo' },
            { input: 'BAR',     expected: 'bar' },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'foo', 'bar' ],
        options: {
            required: true,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: 'foo' },
            { input: 'bar',     expected: 'bar' },
            { input: 'FOO',     expected: InvalidLiteralError },
            { input: 'BAR',     expected: InvalidLiteralError },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'foo', 'bar' ],
        options: {
            required: false,
            ignoreCase: true
        },
        testCases: [
            { input: 'foo',     expected: 'foo' },
            { input: 'bar',     expected: 'bar' },
            { input: 'FOO',     expected: 'foo' },
            { input: 'BAR',     expected: 'bar' },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'foo', 'bar' ],
        options: {
            required: false,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: 'foo' },
            { input: 'bar',     expected: 'bar' },
            { input: 'FOO',     expected: InvalidLiteralError },
            { input: 'BAR',     expected: InvalidLiteralError },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },

    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: true,
            ignoreCase: true
        },
        testCases: [
            { input: 'foo',     expected: 'FOO' },
            { input: 'bar',     expected: 'BAR' },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: true,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: InvalidLiteralError },
            { input: 'bar',     expected: InvalidLiteralError },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: false,
            ignoreCase: true
        },
        testCases: [
            { input: 'foo',     expected: 'FOO' },
            { input: 'bar',     expected: 'BAR' },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },
    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: false,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: InvalidLiteralError },
            { input: 'bar',     expected: InvalidLiteralError },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidLiteralError }
        ]
    },

    {
        values: [ 'foo', 'bar', 'bak', 'bar' ],
        options: { ignoreCase: false },
        testError: DuplicatedValueError
    },
    {
        values: [ 'foo', 'bar', 'bak', 'bar' ],
        options: { ignoreCase: true },
        testError: DuplicatedValueError
    },

    {
        values: [ 'foo', 'bar', 'bak', 'BAR' ],
        options: { ignoreCase: false },
        testCases: [
            { input: 'bar', expected: 'bar' },
            { input: 'BAR', expected: 'BAR' }
        ]
    },
    {
        values: [ 'foo', 'bar', 'bak', 'BAR' ],
        options: { ignoreCase: true },
        testError: DuplicatedValueError
    }
];

describe(`LiteralParser`, () => {
    for (const { values, options, testCases, testError } of suites) {
        const title = [
            `values = ${JSON.stringify(values)}`,
            `required = ${options.required}`,
            `ignoreCase = ${options.ignoreCase}`,
        ];

        describe(title.join('; '), () => {
            if (testError) {
                it(`Throws ${testError.name}`, (t: it.TestContext) => {
                    t.assert.throws(
                        () => new LiteralParser({ ...options, values }),
                        testError
                    );
                });

            } else if (testCases) {
                for (const { input, expected } of testCases) {
                    switch (typeof expected) {
                        case 'string':
                        case 'undefined': {
                            const title = `input = ${JSON.stringify(input)}; expects ${JSON.stringify(expected)}`;
                            it(title, (t: it.TestContext) => {
                                const p = new LiteralParser({ ...options, values });
                                const v = p.parse(input);
                                t.assert.strictEqual(v, expected);
                            });
                            break;
                        }

                        default: {
                            const title = `input = ${JSON.stringify(input)}; expects ${expected.name}`;
                            it(title, (t: it.TestContext) => {
                                const p = new LiteralParser({ ...options, values });
                                t.assert.throws(
                                    () => p.parse(input),
                                    expected
                                );
                            });
                            break;
                        }
                    }
                }

            }
        });
    }
});
describe('LiteralParser → InvalidLiteralError', () => {
    function getError(parser: LiteralParser<LiteralParserOptions>, input: unknown): InvalidLiteralError {
        try {
            parser.parse(input);
        } catch (err) {
            if (err instanceof InvalidLiteralError) {
                return err;
            }

            throw err;
        }

        throw new Error('Expected an InvalidLiteralError');
    }

    it(`expected contains every value, in declaration order`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'foo', 'bar', 'baz' ] });
        const err = getError(p, 'caca');
        t.assert.deepStrictEqual(err.expected, [ 'foo', 'bar', 'baz' ]);
    });

    it(`ignoreCase = true; expected keeps the declared case`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'ESNext', 'NodeNext' ], ignoreCase: true });
        const err = getError(p, 'caca');
        t.assert.deepStrictEqual(err.expected, [ 'ESNext', 'NodeNext' ]);
    });

    it(`expected is frozen`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'foo', 'bar' ] });
        const err = getError(p, 'caca');
        t.assert.ok(Object.isFrozen(err.expected));
    });

    it(`expected is not affected by mutating the values option`, (t: it.TestContext) => {
        const values: [ string, ...string[] ] = [ 'foo', 'bar' ];
        const p = new LiteralParser({ values });
        values.push('baz');

        const err = getError(p, 'baz');
        t.assert.deepStrictEqual(err.expected, [ 'foo', 'bar' ]);
    });

    it(`received is the raw input`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'foo' ] });
        const input = { foo: 'bar' };
        const err = getError(p, input);
        t.assert.strictEqual(err.received, input);
    });

    it(`parser is the LiteralParser`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'foo' ] });
        const err = getError(p, 'caca');
        t.assert.strictEqual(err.parser, p);
    });

    it(`is not an InvalidValueError`, (t: it.TestContext) => {
        const p = new LiteralParser({ values: [ 'foo' ] });
        const err = getError(p, 'caca');
        t.assert.ok(!(err instanceof InvalidValueError));
    });
});
