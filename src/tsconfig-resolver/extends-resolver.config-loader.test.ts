import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { ConfigLoader } from './extends-resolver.config-loader.ts';
import { FileSystemFake } from '../file-system/file-system.fake.ts';

const json = (value: unknown) => JSON.stringify(value);
const createLoader = (files: Record<string, string>) => new ConfigLoader({
    fileSystem: new FileSystemFake(files),
    pathModule
});

describe('ConfigLoader.loadFile(path); → file rules inside packages', () => {
    it(`'x.json' → as-is`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/x.json': '{}' });
        t.assert.strictEqual(await target.loadFile('/d/x.json'), '/d/x.json');
    });

    it(`'x' → "x.json"`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/x.json': '{}' });
        t.assert.strictEqual(await target.loadFile('/d/x'), '/d/x.json');
    });

    it(`'x' → a file without extension is not accepted`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/x': '{}' });
        t.assert.strictEqual(await target.loadFile('/d/x'), undefined);
    });

    it(`'x.json' → "x.json.json" when "x.json" doesn't exist`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/x.json.json': '{}' });
        t.assert.strictEqual(await target.loadFile('/d/x.json'), '/d/x.json.json');
    });
});

describe('ConfigLoader.loadDirectory(dir); → directory rules', () => {
    it(`"tsconfig.json"`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/tsconfig.json': '{}' });
        t.assert.strictEqual(await target.loadDirectory('/d'), '/d/tsconfig.json');
    });

    it(`"tsconfig" field, ".json" is appended`, async (t: it.TestContext) => {
        const target = createLoader({
            '/d/package.json': json({ tsconfig: './base' }),
            '/d/base.json': '{}',
            '/d/tsconfig.json': '{}'
        });

        t.assert.strictEqual(await target.loadDirectory('/d'), '/d/base.json');
    });

    it(`"tsconfig" field pointing to a directory`, async (t: it.TestContext) => {
        const target = createLoader({
            '/d/package.json': json({ tsconfig: './cfg' }),
            '/d/cfg/tsconfig.json': '{}'
        });

        t.assert.strictEqual(await target.loadDirectory('/d'), '/d/cfg/tsconfig.json');
    });

    it(`"tsconfig" field that can't be loaded → "tsconfig.json"`, async (t: it.TestContext) => {
        const target = createLoader({
            '/d/package.json': json({ tsconfig: './base' }),
            '/d/base': '{}',
            '/d/tsconfig.json': '{}'
        });

        t.assert.strictEqual(await target.loadDirectory('/d'), '/d/tsconfig.json');
    });

    it(`"main" and non-string "tsconfig" fields are ignored`, async (t: it.TestContext) => {
        const target = createLoader({
            '/d/package.json': json({ main: './main.json', tsconfig: 1 }),
            '/d/main.json': '{}',
            '/d/tsconfig.json': '{}'
        });

        t.assert.strictEqual(await target.loadDirectory('/d'), '/d/tsconfig.json');
    });

    it(`nothing to load → undefined`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/package.json': '{}' });
        t.assert.strictEqual(await target.loadDirectory('/d'), undefined);
    });
});

describe('ConfigLoader.load(path); → file, then directory', () => {
    it(`"sub.json" wins over "sub/tsconfig.json"`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/sub.json': '{}', '/d/sub/tsconfig.json': '{}' });
        t.assert.strictEqual(await target.load('/d/sub'), '/d/sub.json');
    });

    it(`directory when there's no file`, async (t: it.TestContext) => {
        const target = createLoader({ '/d/sub/tsconfig.json': '{}' });
        t.assert.strictEqual(await target.load('/d/sub'), '/d/sub/tsconfig.json');
    });
});
