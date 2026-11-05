import { describe, it } from 'node:test';

import { InvalidValueError, ParseObjectError } from '../parser/index.ts';
import { parseTsconfigLayer } from './tsconfig.parse-layer.ts';
import { InvalidExtendsError } from './errors/index.ts';

describe('parseTsconfigLayer(raw); → valid files', () => {
    it(`validates and normalizes with tsconfigParser`, (t: it.TestContext) => {
        const { layer } = parseTsconfigLayer({
            include: [ 'src' ],
            compilerOptions: { strict: true, outDir: './dist' }
        });

        t.assert.deepStrictEqual(layer, {
            include: [ 'src' ],
            compilerOptions: { strict: true, outDir: './dist' }
        });
    });

    it(`unknown keys are ignored`, (t: it.TestContext) => {
        const { layer } = parseTsconfigLayer({ files: [ 'a.ts' ], compilerOptions: { foo: 1 } });
        t.assert.deepStrictEqual(layer, { compilerOptions: {} });
    });

    it(`extends is returned apart`, (t: it.TestContext) => {
        const result = parseTsconfigLayer({ extends: [ './a.json', 'pkg' ] });
        t.assert.deepStrictEqual(result, { extends: [ './a.json', 'pkg' ], layer: {} });
    });

    it(`without extends → []`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseTsconfigLayer({}).extends, []);
    });
});

describe('parseTsconfigLayer(raw); → null values', () => {
    it(`null compiler options are kept as null`, (t: it.TestContext) => {
        const { layer } = parseTsconfigLayer({ compilerOptions: { outDir: null, paths: null, strict: true } });
        t.assert.deepStrictEqual(layer, { compilerOptions: { strict: true, outDir: null, paths: null } });
    });

    it(`null include/exclude are kept as null`, (t: it.TestContext) => {
        const { layer } = parseTsconfigLayer({ include: null, exclude: [ 'x' ] });
        t.assert.deepStrictEqual(layer, { exclude: [ 'x' ], include: null });
    });

    it(`"compilerOptions": null is ignored`, (t: it.TestContext) => {
        const { layer } = parseTsconfigLayer({ compilerOptions: null });
        t.assert.deepStrictEqual(layer, {});
    });
});

describe('parseTsconfigLayer(raw); → invalid files', () => {
    for (const raw of [ [], 'x', 1, null ]) {
        it(`root ${JSON.stringify(raw)} → InvalidValueError`, (t: it.TestContext) => {
            t.assert.throws(() => parseTsconfigLayer(raw), InvalidValueError);
        });
    }

    it(`invalid option → ParseObjectError`, (t: it.TestContext) => {
        t.assert.throws(
            () => parseTsconfigLayer({ compilerOptions: { strict: 'yes' } }),
            ParseObjectError
        );
    });

    it(`compilerOptions not an object → ParseObjectError`, (t: it.TestContext) => {
        t.assert.throws(() => parseTsconfigLayer({ compilerOptions: [] }), ParseObjectError);
    });

    it(`invalid extends → InvalidExtendsError`, (t: it.TestContext) => {
        t.assert.throws(() => parseTsconfigLayer({ extends: '' }), InvalidExtendsError);
    });
});
