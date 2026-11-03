import { InvalidValueError, RequiredValueError } from './errors/index.ts';
import { StringParser } from './string.parser.ts';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

describe('StringParser', () => {
    describe('input = undefined', () => {
        it(`required = true; throws RequiredValueError`, (t: it.TestContext) => {
            const p = new StringParser({ required: true });
            t.assert.throws(
                () => p.parse(undefined),
                RequiredValueError
            );
        });

        it(`required = false; returns undefined`, (t: it.TestContext) => {
            const p = new StringParser({ required: false });
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });

        it(`options not defined; returns undefined`, (t: it.TestContext) => {
            const p = new StringParser();
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });
    });

    describe('input is not a string', () => {
        const inputs: unknown[] = [
            null,
            666,
            0,
            NaN,
            true,
            false,
            666n,
            Symbol('foo'),
            () => 'caca',
            {},
            [ 'caca' ],
            new String('caca'),
            new Date(),
            Object.create(null)
        ];

        for (const input of inputs) {
            it(`input = ${inspect(input)}; throws InvalidValueError`, (t: it.TestContext) => {
                const p = new StringParser({ required: true });
                t.assert.throws(
                    () => p.parse(input),
                    InvalidValueError
                );
            });
        }
    });

    describe('trim option', () => {
        it(`options not defined; trim = false`, (t: it.TestContext) => {
            const p = new StringParser();
            t.assert.strictEqual(p.trim, false);
        });

        it(`trim = true; getter returns true`, (t: it.TestContext) => {
            const p = new StringParser({ trim: true });
            t.assert.strictEqual(p.trim, true);
        });
    });

    const suites: [ boolean, [ string, string ][] ][] = [
        [ false, [
            [ 'caca',               'caca' ],
            [ '',                   '' ],
            [ '  caca  ',           '  caca  ' ],
            [ '   ',                '   ' ],
            [ '\t\ncaca\r\n',       '\t\ncaca\r\n' ],
            [ ' ñee  caca ',        ' ñee  caca ' ]
        ] ],
        [ true, [
            [ 'caca',               'caca' ],
            [ '',                   '' ],
            [ '  caca  ',           'caca' ],
            [ '   ',                '' ],
            [ '\t\ncaca\r\n',       'caca' ],
            [ ' ñee  caca ',        'ñee  caca' ],
            [ ' caca　',   'caca' ],
            [ '﻿caca',         'caca' ],
            [ '​caca',         '​caca' ]
        ] ]
    ];

    for (const [ trim, cases ] of suites) {
        describe(`trim = ${trim}`, () => {
            for (const [ input, expected ] of cases) {
                it(`input = ${inspect(input)}; returns ${inspect(expected)}`, (t: it.TestContext) => {
                    const p = new StringParser({ trim });
                    const v = p.parse(input);
                    t.assert.strictEqual(v, expected);
                });
            }
        });
    }

    describe('edge cases', () => {
        it(`trim = true; required = true; whitespace-only input returns ''`, (t: it.TestContext) => {
            const p = new StringParser({ trim: true, required: true });
            const v = p.parse('   ');
            t.assert.strictEqual(v, '');
        });

        it(`trim = true; input = undefined; returns undefined`, (t: it.TestContext) => {
            const p = new StringParser({ trim: true });
            const v = p.parse(undefined);
            t.assert.strictEqual(v, undefined);
        });

        it(`error message`, (t: it.TestContext) => {
            const p = new StringParser();
            t.assert.throws(
                () => p.parse(666),
                {
                    name: 'InvalidValueError',
                    message: 'The value for StringParser must be of type string. Received type number (666)'
                }
            );
        });
    });
});
