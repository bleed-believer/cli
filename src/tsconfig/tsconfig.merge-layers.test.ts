import { describe, it } from 'node:test';

import { mergeLayers } from './tsconfig.merge-layers.ts';

describe('mergeLayers(base, child); → merged layer', () => {
    it(`child options override base options`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            mergeLayers(
                { compilerOptions: { strict: true, target: 'es2020' } },
                { compilerOptions: { target: 'esnext' } }
            ),
            { compilerOptions: { strict: true, target: 'esnext' } }
        );
    });

    it(`"paths" and arrays are replaced as a whole`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            mergeLayers(
                { compilerOptions: { paths: { '@a/*': [ './a/*' ] }, lib: [ 'es2024' ] } },
                { compilerOptions: { paths: { '@b/*': [ './b/*' ] }, lib: [ 'dom' ] } }
            ),
            { compilerOptions: { paths: { '@b/*': [ './b/*' ] }, lib: [ 'dom' ] } }
        );
    });

    it(`include and exclude are inherited independently`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            mergeLayers({ include: [ './src' ], exclude: [ './x' ] }, { include: [ './own' ] }),
            { include: [ './own' ], exclude: [ './x' ] }
        );
    });

    it(`null values are kept to unset the option`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            mergeLayers(
                { include: [ './src' ], compilerOptions: { outDir: './dist', strict: true } },
                { include: null, compilerOptions: { outDir: null } }
            ),
            { include: null, compilerOptions: { outDir: null, strict: true } }
        );
    });

    it(`only base compilerOptions → inherited`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            mergeLayers({ compilerOptions: { strict: true } }, { include: [ './src' ] }),
            { compilerOptions: { strict: true }, include: [ './src' ] }
        );
    });

    it(`no compilerOptions at all → not added`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(mergeLayers({}, {}), {});
    });

    it(`the inputs are not modified`, (t: it.TestContext) => {
        const base = { compilerOptions: { strict: true } };
        mergeLayers(base, { compilerOptions: { strict: false } });
        t.assert.deepStrictEqual(base, { compilerOptions: { strict: true } });
    });
});
