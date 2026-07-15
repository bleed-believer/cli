import type { PathAliasInject, TsconfigObject } from './interfaces/index.ts';

import { sep, dirname, resolve, relative } from 'node:path/posix';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PathAlias } from './path-alias.ts';

const files = [
    '/path/to/project/tsconfig.json',
    '/path/to/project/src/index.ts',
    '/path/to/project/src/data-source.ts',
    '/path/to/project/src/lib/elphis/index.ts',
    '/path/to/project/src/lib/elphis/elphis.ts',
    '/path/to/project/src/lib/elphis/elphis.test.ts',
];

const tsconfig: TsconfigObject = {
    path: '/path/to/project/tsconfig.json',
    options: {
        rootDir: '/path/to/project/src',
        outDir: '/path/to/project/dist',
        paths: {
            '@lib/*':   [ 'src/lib/*' ],
            '@/*':      [ 'src/*' ],
        }
    }
};

const inject: PathAliasInject = {
    sep, dirname, resolve, relative,
    accessSync(path: string) {
        path = resolve(path);
        if (!files.includes(path)) {
            throw new Error(`The file "${path}" doesn't exists`);
        }
    },
    fileURLToPath: href => fileURLToPath(href, { windows: false })
};

describe(`rootDir`, () => {
    const pathAlias = new PathAlias(tsconfig, false, inject);

    describe(`from '/path/to/project/src/index.ts'`, () => {
        const filename = '/path/to/project/src/index.ts';

        test(`resolve '@lib/elphis/index.ts'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('@lib/elphis/index.ts', filename);
            t.assert.strictEqual(result, './lib/elphis/index.ts');
        });
        
        test(`resolve '@lib/elphis/index.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('@lib/elphis/index.js', filename);
            t.assert.strictEqual(result, './lib/elphis/index.ts');
        });
        
        test(`resolve './data-source.ts'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('./data-source.ts', filename);
            t.assert.strictEqual(result, './data-source.ts');
        });
        
        test(`resolve './data-source.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('./data-source.js', filename);
            t.assert.strictEqual(result, './data-source.ts');
        });
        
        test(`resolve 'node:path'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('node:path', filename);
            t.assert.strictEqual(result, 'node:path');
        });
        
        test(`resolve 'discord.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('discord.js', filename);
            t.assert.strictEqual(result, 'discord.js');
        });
    });
});

describe(`outDir`, () => {
    const pathAlias = new PathAlias(tsconfig, true, inject);

    describe(`from '/path/to/project/src/index.ts'`, () => {
        const filename = '/path/to/project/src/index.ts';

        test(`resolve '@lib/elphis/index.ts'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('@lib/elphis/index.ts', filename);
            t.assert.strictEqual(result, './lib/elphis/index.js');
        });
        
        test(`resolve '@lib/elphis/index.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('@lib/elphis/index.js', filename);
            t.assert.strictEqual(result, './lib/elphis/index.js');
        });
        
        test(`resolve './data-source.ts'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('./data-source.ts', filename);
            t.assert.strictEqual(result, './data-source.js');
        });
        
        test(`resolve './data-source.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('./data-source.js', filename);
            t.assert.strictEqual(result, './data-source.js');
        });
        
        test(`resolve 'node:path'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('node:path', filename);
            t.assert.strictEqual(result, 'node:path');
        });
        
        test(`resolve 'discord.js'`, (t: test.TestContext) => {
            const result = pathAlias.resolve('discord.js', filename);
            t.assert.strictEqual(result, 'discord.js');
        });
    });
});