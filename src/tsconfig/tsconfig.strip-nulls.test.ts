import { describe, it } from 'node:test';

import { stripNulls } from './tsconfig.strip-nulls.ts';

describe('stripNulls(layer); → final options', () => {
    it(`removes null values at the root and in compilerOptions`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            stripNulls({
                include: null,
                exclude: [ './x' ],
                compilerOptions: { outDir: null, paths: null, strict: false }
            }),
            { exclude: [ './x' ], compilerOptions: { strict: false } }
        );
    });

    it(`keeps an empty compilerOptions`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(stripNulls({ compilerOptions: { outDir: null } }), { compilerOptions: {} });
    });

    it(`without compilerOptions`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(stripNulls({}), {});
    });
});
