import { describe, it } from 'node:test';

import { isRecord } from './package-resolver.is-record.ts';

describe('isRecord(value); → boolean', () => {
    const cases: [ string, unknown, boolean ][] = [
        [ 'object',     { a: 1 },   true  ],
        [ 'empty',      {},         true  ],
        [ 'null',       null,       false ],
        [ 'array',      [],         false ],
        [ 'string',     './a.json', false ],
        [ 'undefined',  undefined,  false ],
    ];

    for (const [ name, value, expected ] of cases) {
        it(`${name} → ${expected}`, (t: it.TestContext) => {
            t.assert.strictEqual(isRecord(value), expected);
        });
    }
});
