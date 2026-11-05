import { describe, it } from 'node:test';

import { matchPatternKey } from './package-resolver.match-pattern.ts';

describe('matchPatternKey(key, subpath); → matched text', () => {
    const cases: [ string, string, string | undefined ][] = [
        [ './*',            './a.json',         'a.json'        ],
        [ './cfg/*',        './cfg/node',       'node'          ],
        [ './cfg/*',        './cfg/a/b',        'a/b'           ],
        [ './*.json',       './a.json',         'a'             ],
        [ './*.json',       './a.yml',          undefined       ],
        [ './cfg/*',        './other/a',        undefined       ],
        [ './a*a',          './a',              undefined       ],
        [ './cfg/',         './cfg/x.json',     'x.json'        ],
        [ './cfg/',         './other/x.json',   undefined       ],
        [ './cfg',          './cfg',            undefined       ],
        [ './*/*',          './a/b',            undefined       ],
    ];

    for (const [ key, subpath, expected ] of cases) {
        it(`'${key}' with '${subpath}' → ${expected === undefined ? 'no match' : `'${expected}'`}`, (t: it.TestContext) => {
            t.assert.strictEqual(matchPatternKey(key, subpath), expected);
        });
    }
});
