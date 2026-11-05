import { describe, it } from 'node:test';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';

import { rebasePath } from './tsconfig.rebase-path.ts';

describe('rebasePath(path, fromDir, toDir, pathModule); → posix', () => {
    const cases: [ string, string, string, string ][] = [
        [ './dist',         '/p/cfg',   '/p',       './cfg/dist'        ],
        [ '../dist',        '/p/cfg',   '/p',       './dist'            ],
        [ 'src/**/*',       '/p/cfg',   '/p',       './cfg/src/**/*'    ],
        [ './src/*',        '/p',       '/p',       './src/*'           ],
        [ './a/../b/',      '/p',       '/p',       './b'               ],
        [ '.',              '/p/cfg',   '/p/cfg',   '.'                 ],
        [ './',             '/p',       '/p/cfg',   '..'                ],
        [ './x',            '/p',       '/p/cfg',   '../x'              ],
        [ './x',            '/a',       '/b/c',     '../../a/x'         ],
        [ './..foo',        '/p',       '/p',       './..foo'           ],
        [ '/abs/path',      '/p/cfg',   '/p',       '/abs/path'         ],
    ];

    for (const [ path, fromDir, toDir, expected ] of cases) {
        it(`'${path}' from '${fromDir}' to '${toDir}' → '${expected}'`, (t: it.TestContext) => {
            t.assert.strictEqual(rebasePath(path, fromDir, toDir, posix), expected);
        });
    }
});

describe('rebasePath(path, fromDir, toDir, pathModule); → win32', () => {
    it(`uses the platform separator`, (t: it.TestContext) => {
        t.assert.strictEqual(rebasePath('./dist', 'C:\\p\\cfg', 'C:\\p', win32), '.\\cfg\\dist');
    });

    it(`accepts "/" in the path`, (t: it.TestContext) => {
        t.assert.strictEqual(rebasePath('../src/*', 'C:\\p\\cfg', 'C:\\p', win32), '.\\src\\*');
    });

    it(`absolute paths are returned as-is`, (t: it.TestContext) => {
        t.assert.strictEqual(rebasePath('D:\\x', 'C:\\p\\cfg', 'C:\\p', win32), 'D:\\x');
    });
});
