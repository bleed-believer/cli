import type { NumberParserOptions } from './interfaces/index.ts';

import { InvalidRangeError, InvalidValueError, RequiredValueError } from './errors/index.ts';
import { NumberParser } from './number.parser.ts';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

type ErrorConstructor = (new(...a: any[]) => Error);

interface TestSuite {
    options: NumberParserOptions;
    valid: number[];
    invalid: unknown[];
}

const suites: TestSuite[] = [
    {
        options: {},
        valid: [ 0, -0, 1, -1, 666, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e21 ],
        invalid: [ 0.5, -1.5, Number.EPSILON ]
    },
    {
        options: { float: true },
        valid: [ 0, 1, -1, 0.5, -1.5, Number.EPSILON, Number.MAX_VALUE, -Number.MAX_VALUE ],
        invalid: []
    },
    {
        options: { min: 0 },
        valid: [ 0, -0, 1, 666 ],
        invalid: [ -1, 0.5 ]
    },
    {
        options: { max: 10 },
        valid: [ -666, 0, 10 ],
        invalid: [ 11, 9.5 ]
    },
    {
        options: { min: 0, max: 10 },
        valid: [ 0, 5, 10 ],
        invalid: [ -1, 11, 5.5 ]
    },
    {
        options: { min: 5, max: 5 },
        valid: [ 5 ],
        invalid: [ 4, 6 ]
    },
    {
        options: { float: true, min: 0, max: 1 },
        valid: [ 0, 0.5, 1, Number.EPSILON ],
        invalid: [ -Number.EPSILON, 1.0000001 ]
    },
    {
        options: { min: -10, max: -5 },
        valid: [ -10, -7, -5 ],
        invalid: [ -11, -4, 0 ]
    },
    {
        options: { min: 0.5, max: 3.5 },
        valid: [ 1, 2, 3 ],
        invalid: [ 0, 0.5, 3.5, 4 ]
    },
    {
        options: { min: -Infinity, max: Infinity },
        valid: [ 0, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER ],
        invalid: []
    }
];

describe('NumberParser', () => {
    describe('input = undefined', () => {
        it(`required = true; throws RequiredValueError`, (t: it.TestContext) => {
            const p = new NumberParser({ required: true });
            t.assert.throws(
                () => p.parse(undefined),
                RequiredValueError
            );
        });

        it(`required = false; returns undefined`, (t: it.TestContext) => {
            const p = new NumberParser({ required: false });
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });

        it(`options not defined; returns undefined`, (t: it.TestContext) => {
            const p = new NumberParser();
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });
    });

    describe('input is not a finite number', () => {
        const inputs: unknown[] = [
            null,
            '666',
            '',
            true,
            false,
            666n,
            Symbol('foo'),
            () => 666,
            {},
            [ 666 ],
            new Number(666),
            new Date(),
            NaN,
            Infinity,
            -Infinity
        ];

        for (const input of inputs) {
            it(`input = ${inspect(input)}; throws InvalidValueError`, (t: it.TestContext) => {
                const p = new NumberParser({ float: true, required: true });
                t.assert.throws(
                    () => p.parse(input),
                    InvalidValueError
                );
            });
        }

        it(`input = Infinity; max not defined; throws InvalidValueError`, (t: it.TestContext) => {
            const p = new NumberParser({ float: true, min: 0 });
            t.assert.throws(
                () => p.parse(Infinity),
                InvalidValueError
            );
        });

        it(`input = -Infinity; min = -Infinity; throws InvalidValueError`, (t: it.TestContext) => {
            const p = new NumberParser({ float: true, min: -Infinity });
            t.assert.throws(
                () => p.parse(-Infinity),
                InvalidValueError
            );
        });
    });

    for (const { options, valid, invalid } of suites) {
        describe(`options = ${inspect(options)}`, () => {
            for (const input of valid) {
                it(`input = ${inspect(input)}; returns ${inspect(input)}`, (t: it.TestContext) => {
                    const p = new NumberParser(options);
                    const v = p.parse(input);
                    t.assert.strictEqual(v, input);
                });
            }

            for (const input of invalid) {
                it(`input = ${inspect(input)}; throws InvalidValueError`, (t: it.TestContext) => {
                    const p = new NumberParser(options);
                    t.assert.throws(
                        () => p.parse(input),
                        InvalidValueError
                    );
                });
            }
        });
    }

    describe('getters', () => {
        it(`options not defined; float = false, min = undefined, max = undefined`, (t: it.TestContext) => {
            const p = new NumberParser();
            t.assert.strictEqual(p.float, false);
            t.assert.strictEqual(p.min, undefined);
            t.assert.strictEqual(p.max, undefined);
        });

        it(`returns the options given`, (t: it.TestContext) => {
            const p = new NumberParser({ float: true, min: -1, max: 1 });
            t.assert.strictEqual(p.float, true);
            t.assert.strictEqual(p.min, -1);
            t.assert.strictEqual(p.max, 1);
        });
    });

    describe('invalid range', () => {
        const cases: [ NumberParserOptions, ErrorConstructor ][] = [
            [ { min: 10, max: 5 },              InvalidRangeError ],
            [ { min: 0.6, max: 0.5 },           InvalidRangeError ],
            [ { min: Infinity, max: -Infinity}, InvalidRangeError ],
            [ { min: NaN },                     InvalidRangeError ],
            [ { max: NaN },                     InvalidRangeError ],
            [ { min: NaN, max: NaN },           InvalidRangeError ]
        ];

        for (const [ options, error ] of cases) {
            it(`options = ${inspect(options)}; throws ${error.name}`, (t: it.TestContext) => {
                t.assert.throws(
                    () => new NumberParser(options),
                    error
                );
            });
        }

        it(`min = max; does not throw`, (t: it.TestContext) => {
            t.assert.doesNotThrow(() => new NumberParser({ min: 5, max: 5 }));
        });

        it(`integer range without integers inside; rejects every input`, (t: it.TestContext) => {
            const p = new NumberParser({ min: 0.2, max: 0.8 });
            t.assert.throws(
                () => p.parse(0),
                InvalidValueError
            );
        });
    });

    describe('error messages', () => {
        const cases: [ NumberParserOptions, unknown, string ][] = [
            [ {},                               0.5,    'an integer. Received type number (0.5)' ],
            [ { float: true },                  NaN,    'a finite number. Received type number (NaN)' ],
            [ { min: 0 },                       -1,     'an integer >= 0. Received type number (-1)' ],
            [ { max: 10 },                      11,     'an integer <= 10. Received type number (11)' ],
            [ { min: 0, max: 10 },              '5',    `an integer >= 0 && <= 10. Received type string ('5')` ],
            [ { float: true, min: -1, max: 1 }, 2,      'a finite number >= -1 && <= 1. Received type number (2)' ]
        ];

        for (const [ options, input, expected ] of cases) {
            it(`options = ${inspect(options)}; input = ${inspect(input)}`, (t: it.TestContext) => {
                const p = new NumberParser(options);
                t.assert.throws(
                    () => p.parse(input),
                    {
                        name: 'InvalidValueError',
                        message: `The value for NumberParser must be ${expected}`
                    }
                );
            });
        }
    });

    describe('edge cases', () => {
        it(`input = -0; returns -0`, (t: it.TestContext) => {
            const p = new NumberParser();
            const v = p.parse(-0);
            t.assert.ok(Object.is(v, -0));
        });

        it(`unsafe integers are accepted`, (t: it.TestContext) => {
            const p = new NumberParser();
            const v = p.parse(2 ** 60);
            t.assert.strictEqual(v, 2 ** 60);
        });

        it(`input = 1.0; is an integer`, (t: it.TestContext) => {
            const p = new NumberParser();
            const v = p.parse(1.0);
            t.assert.strictEqual(v, 1);
        });
    });
});
