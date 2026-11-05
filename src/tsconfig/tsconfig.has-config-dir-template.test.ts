import { describe, it } from 'node:test';

import { hasConfigDirTemplate } from './tsconfig.has-config-dir-template.ts';

describe('hasConfigDirTemplate(path);', () => {
    const cases: [ string, boolean ][] = [
        [ '${configDir}',           true  ],
        [ '${configDir}/src',       true  ],
        [ '${CONFIGDIR}/src',       true  ],
        [ '${ConfigDir}\\src',      true  ],
        [ './${configDir}/src',     false ],
        [ 'x/${configDir}',         false ],
        [ '$configDir/src',         false ],
        [ './src',                  false ],
    ];

    for (const [ path, expected ] of cases) {
        it(`'${path}' → ${expected}`, (t: it.TestContext) => {
            t.assert.strictEqual(hasConfigDirTemplate(path), expected);
        });
    }
});
