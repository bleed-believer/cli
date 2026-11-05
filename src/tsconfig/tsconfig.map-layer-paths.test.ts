import { describe, it } from 'node:test';

import { mapLayerPaths } from './tsconfig.map-layer-paths.ts';

const mark = (path: string) => `<${path}>`;

describe('mapLayerPaths(layer, transform); → path options', () => {
    const layer = {
        include: [ '../src/**/*' ],
        exclude: [ './tmp' ],
        compilerOptions: {
            outDir: '../dist',
            rootDir: '../src',
            generateTrace: './trace',
            declarationDir: './types',
            tsBuildInfoFile: './tb',
            generateCpuProfile: './cpu.prof',
            rootDirs: [ './r1', './r2' ],
            typeRoots: [ './node_modules/@types' ],
            paths: { '@app/*': [ '../src/app/*', '../lib/*' ] }
        }
    };

    const result = mapLayerPaths(layer, mark);

    it(`include and exclude`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(result.include, [ '<../src/**/*>' ]);
        t.assert.deepStrictEqual(result.exclude, [ '<./tmp>' ]);
    });

    it(`string path options`, (t: it.TestContext) => {
        const options = result.compilerOptions!;
        t.assert.strictEqual(options.outDir, '<../dist>');
        t.assert.strictEqual(options.rootDir, '<../src>');
        t.assert.strictEqual(options.generateTrace, '<./trace>');
        t.assert.strictEqual(options.declarationDir, '<./types>');
        t.assert.strictEqual(options.tsBuildInfoFile, '<./tb>');
        t.assert.strictEqual(options.generateCpuProfile, '<./cpu.prof>');
    });

    it(`list path options`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(result.compilerOptions!.rootDirs, [ '<./r1>', '<./r2>' ]);
        t.assert.deepStrictEqual(result.compilerOptions!.typeRoots, [ '<./node_modules/@types>' ]);
    });

    it(`paths targets (keys are kept)`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(result.compilerOptions!.paths, { '@app/*': [ '<../src/app/*>', '<../lib/*>' ] });
    });

    it(`the input is not modified`, (t: it.TestContext) => {
        t.assert.strictEqual(layer.compilerOptions.outDir, '../dist');
        t.assert.deepStrictEqual(layer.include, [ '../src/**/*' ]);
    });
});

describe('mapLayerPaths(layer, transform); → untouched values', () => {
    it(`mapRoot and sourceRoot are not transformed`, (t: it.TestContext) => {
        const result = mapLayerPaths({ compilerOptions: { mapRoot: './mr', sourceRoot: './sr' } }, mark);
        t.assert.deepStrictEqual(result, { compilerOptions: { mapRoot: './mr', sourceRoot: './sr' } });
    });

    it(`non-path options are kept`, (t: it.TestContext) => {
        const result = mapLayerPaths({ compilerOptions: { strict: true, types: [ 'node' ] } }, mark);
        t.assert.deepStrictEqual(result, { compilerOptions: { strict: true, types: [ 'node' ] } });
    });

    it(`null values are kept`, (t: it.TestContext) => {
        const result = mapLayerPaths({ include: null, compilerOptions: { outDir: null, paths: null, typeRoots: null } }, mark);
        t.assert.deepStrictEqual(result, { include: null, compilerOptions: { outDir: null, paths: null, typeRoots: null } });
    });

    it(`missing keys are not added`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(mapLayerPaths({}, mark), {});
    });
});
