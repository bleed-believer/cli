import { describe, it } from 'node:test';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';

import { substituteConfigDir } from './tsconfig.substitute-config-dir.ts';

describe('substituteConfigDir(layer, dir, pathModule); → posix', () => {
    const cases: [ string, string ][] = [
        [ '${configDir}',               '.'                 ],
        [ '${configDir}/',              '.'                 ],
        [ '${configDir}/dist',          './dist'            ],
        [ '${configDir}dist',           './dist'            ],
        [ '${configDir}/src/**/*',      './src/**/*'        ],
        [ '${configDir}/../shared',     '../shared'         ],
        // Detected ignoring the case, but only the exact text is replaced (like tsc)
        [ '${CONFIGDIR}/dist',          './${CONFIGDIR}/dist' ],
        // Paths without the template are not touched
        [ '../base/dist',               '../base/dist'      ],
        [ 'x/${configDir}',             'x/${configDir}'    ],
    ];

    for (const [ path, expected ] of cases) {
        it(`'${path}' → '${expected}'`, (t: it.TestContext) => {
            const result = substituteConfigDir({ compilerOptions: { outDir: path } }, '/p/app', posix);
            t.assert.strictEqual(result.compilerOptions!.outDir, expected);
        });
    }

    it(`every path option is substituted`, (t: it.TestContext) => {
        const layer = {
            include: [ '${configDir}/src' ],
            exclude: [ '${configDir}/node_modules' ],
            compilerOptions: {
                typeRoots: [ '${configDir}/types' ],
                paths: { '@/*': [ '${configDir}/src/*', '../base/lib/*' ] },
                mapRoot: '${configDir}/maps'
            }
        };

        t.assert.deepStrictEqual(substituteConfigDir(layer, '/p/app', posix), {
            include: [ './src' ],
            exclude: [ './node_modules' ],
            compilerOptions: {
                typeRoots: [ './types' ],
                paths: { '@/*': [ './src/*', '../base/lib/*' ] },
                mapRoot: '${configDir}/maps'
            }
        });
    });

    it(`the input is not modified`, (t: it.TestContext) => {
        const layer = { include: [ '${configDir}/src' ] };
        substituteConfigDir(layer, '/p/app', posix);
        t.assert.deepStrictEqual(layer, { include: [ '${configDir}/src' ] });
    });
});

describe('substituteConfigDir(layer, dir, pathModule); → win32', () => {
    it(`uses the platform separator`, (t: it.TestContext) => {
        const result = substituteConfigDir({ compilerOptions: { outDir: '${configDir}\\dist' } }, 'C:\\p\\app', win32);
        t.assert.strictEqual(result.compilerOptions!.outDir, '.\\dist');
    });
});
