import { describe, it } from 'node:test';

import { InvalidExtendsError } from './errors/index.ts';
import { parseExtends } from './tsconfig.extends.ts';

describe('parseExtends(value); → specifiers', () => {
    it(`undefined → []`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseExtends(undefined), []);
    });

    it(`string → [ string ]`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseExtends('./base.json'), [ './base.json' ]);
    });

    it(`array → same order`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseExtends([ './a.json', 'pkg' ]), [ './a.json', 'pkg' ]);
    });

    it(`[] → []`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseExtends([]), []);
    });

    for (const value of [ '', null, 666, {}, [ './a.json', '' ], [ 1 ] ]) {
        it(`${JSON.stringify(value)} → InvalidExtendsError`, (t: it.TestContext) => {
            t.assert.throws(() => parseExtends(value), (err: any) => {
                t.assert.ok(err instanceof InvalidExtendsError);
                t.assert.strictEqual(err.value, value);
                return true;
            });
        });
    }
});
