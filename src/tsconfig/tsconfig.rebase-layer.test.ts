import { describe, it } from 'node:test';
import posix from 'node:path/posix';

import { rebaseLayer } from './tsconfig.rebase-layer.ts';

describe('rebaseLayer(layer, fromDir, toDir, pathModule);', () => {
    it(`rebases every path option`, (t: it.TestContext) => {
        const layer = {
            include: [ '../src/**/*' ],
            compilerOptions: { outDir: './out', paths: { '@/*': [ '../src/*' ] } }
        };

        t.assert.deepStrictEqual(rebaseLayer(layer, '/p/cfg', '/p', posix), {
            include: [ './src/**/*' ],
            compilerOptions: { outDir: './cfg/out', paths: { '@/*': [ './src/*' ] } }
        });
    });

    it(`paths starting with \${configDir} (any case) are kept`, (t: it.TestContext) => {
        const layer = {
            include: [ '${configDir}/src' ],
            compilerOptions: { outDir: '${CONFIGDIR}/dist', paths: { '@/*': [ '${configDir}/src/*', './lib/*' ] } }
        };

        t.assert.deepStrictEqual(rebaseLayer(layer, '/p/cfg', '/p', posix), {
            include: [ '${configDir}/src' ],
            compilerOptions: { outDir: '${CONFIGDIR}/dist', paths: { '@/*': [ '${configDir}/src/*', './cfg/lib/*' ] } }
        });
    });

    it(`\${configDir} in the middle is rebased like any other text`, (t: it.TestContext) => {
        const result = rebaseLayer({ compilerOptions: { rootDir: 'x/${configDir}' } }, '/p/cfg', '/p', posix);
        t.assert.deepStrictEqual(result, { compilerOptions: { rootDir: './cfg/x/${configDir}' } });
    });
});
