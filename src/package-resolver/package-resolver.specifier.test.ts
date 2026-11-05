import { describe, it } from 'node:test';

import { parsePackageSpecifier } from './package-resolver.specifier.ts';

describe('parsePackageSpecifier(specifier); → { name, subpath }', () => {
    const cases: [ string, string, string ][] = [
        [ 'pkg',                'pkg',              ''          ],
        [ 'pkg/',               'pkg',              ''          ],
        [ 'pkg/a/b',            'pkg',              'a/b'       ],
        [ 'pkg//a/',            'pkg',              'a'         ],
        [ 'pkg.json',           'pkg.json',         ''          ],
        [ '@s/pkg',             '@s/pkg',           ''          ],
        [ '@s/pkg/cfg/x.json',  '@s/pkg',           'cfg/x.json'],
        [ '@s',                 '@s',               ''          ],
        [ '@tsconfig/node22',   '@tsconfig/node22', ''          ],
    ];

    for (const [ specifier, name, subpath ] of cases) {
        it(`'${specifier}' → '${name}' + '${subpath}'`, (t: it.TestContext) => {
            t.assert.deepStrictEqual(parsePackageSpecifier(specifier), { name, subpath });
        });
    }
});
