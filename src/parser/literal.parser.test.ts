import type { LiteralParserOptions } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError, DuplicatedValueError } from './errors/index.ts';
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
    options: LiteralParserOptions;
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
            { input: 666,       expected: InvalidValueError }
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
            { input: 'FOO',     expected: InvalidValueError },
            { input: 'BAR',     expected: InvalidValueError },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidValueError }
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
            { input: 666,       expected: InvalidValueError }
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
            { input: 'FOO',     expected: InvalidValueError },
            { input: 'BAR',     expected: InvalidValueError },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidValueError }
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
            { input: 666,       expected: InvalidValueError }
        ]
    },
    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: true,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: InvalidValueError },
            { input: 'bar',     expected: InvalidValueError },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: RequiredValueError },
            { input: 666,       expected: InvalidValueError }
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
            { input: 666,       expected: InvalidValueError }
        ]
    },
    {
        values: [ 'FOO', 'BAR' ],
        options: {
            required: false,
            ignoreCase: false
        },
        testCases: [
            { input: 'foo',     expected: InvalidValueError },
            { input: 'bar',     expected: InvalidValueError },
            { input: 'FOO',     expected: 'FOO' },
            { input: 'BAR',     expected: 'BAR' },
            { input: undefined, expected: undefined },
            { input: 666,       expected: InvalidValueError }
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
                        () => new LiteralParser(values, options),
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
                                const p = new LiteralParser(values, options);
                                const v = p.parse(input);
                                t.assert.strictEqual(v, expected);
                            });
                            break;
                        }

                        default: {
                            const title = `input = ${JSON.stringify(input)}; expects ${expected.name}`;
                            it(title, (t: it.TestContext) => {
                                const p = new LiteralParser(values, options);
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