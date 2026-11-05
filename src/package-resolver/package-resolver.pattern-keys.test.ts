import { describe, it } from 'node:test';

import { comparePatternKeys } from './package-resolver.pattern-keys.ts';

describe('comparePatternKeys(a, b); → sort order', () => {
    const sort = (keys: string[]) => [ ...keys ].sort(comparePatternKeys);

    it(`longer base before "*" first`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(sort([ './*', './cfg/*' ]), [ './cfg/*', './*' ]);
    });

    it(`"./a/*" before "./a*"`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(sort([ './a*', './a/*' ]), [ './a/*', './a*' ]);
    });

    it(`with the same base, a pattern before an exact key`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(sort([ './cfg/', './cfg/*' ]), [ './cfg/*', './cfg/' ]);
    });

    it(`with the same base, the longer key first`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(sort([ './a/*', './a/*.json' ]), [ './a/*.json', './a/*' ]);
    });

    it(`equal keys → 0`, (t: it.TestContext) => {
        t.assert.strictEqual(comparePatternKeys('./a/*', './a/*'), 0);
    });
});
