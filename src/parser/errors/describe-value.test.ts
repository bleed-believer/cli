import { describeValue } from './describe-value.ts';
import { describe, it } from 'node:test';
import { inspect } from 'node:util';

describe('describeValue(value); → Node.js style description', () => {
    const cases: [ unknown, string ][] = [
        [ undefined,            'undefined' ],
        [ null,                 'null' ],
        [ true,                 'type boolean (true)' ],
        [ 666,                  'type number (666)' ],
        [ NaN,                  'type number (NaN)' ],
        [ 666n,                 'type bigint (666n)' ],
        [ 'caca',               `type string ('caca')` ],
        [ '',                   `type string ('')` ],
        [ Symbol('foo'),        'type symbol (Symbol(foo))' ],
        [ 'x'.repeat(26),       `type string ('${'x'.repeat(26)}')` ],
        [ 'x'.repeat(27),       `type string ('${'x'.repeat(24)}...)` ],
        [ function foo() {},    'function foo' ],
        [ () => {},             'an anonymous function' ],
        [ {},                   'an instance of Object' ],
        [ [],                   'an instance of Array' ],
        [ new Date(),           'an instance of Date' ],
        [ new (class Foo {}),   'an instance of Foo' ],
        [ Object.create(null),  '[Object: null prototype] {}' ]
    ];

    for (const [ value, expected ] of cases) {
        it(`value = ${inspect(value)}; returns ${JSON.stringify(expected)}`, (t: it.TestContext) => {
            t.assert.strictEqual(describeValue(value), expected);
        });
    }

    it(`does not include ANSI colors`, (t: it.TestContext) => {
        t.assert.doesNotMatch(describeValue('caca'), /\x1b\[/);
    });
});
