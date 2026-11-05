import { describe, it } from 'node:test';

import { splitNulls } from './tsconfig.split-nulls.ts';

describe('splitNulls(record); → { values, nulls }', () => {
    it(`separates null values`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            splitNulls({ a: 1, b: null, c: undefined, d: false, e: null }),
            { values: { a: 1, c: undefined, d: false }, nulls: [ 'b', 'e' ] }
        );
    });

    it(`empty object`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(splitNulls({}), { values: {}, nulls: [] });
    });

    it(`doesn't modify the input`, (t: it.TestContext) => {
        const input = { a: null };
        splitNulls(input);
        t.assert.deepStrictEqual(input, { a: null });
    });
});
