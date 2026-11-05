import type { FileSystemInject } from './interfaces/index.ts';

import { describe, it } from 'node:test';

import { FileSystem } from './file-system.ts';

function failWith(code: string): never {
    const err = new Error(code) as Error & { code: string; };
    err.code = code;
    throw err;
}

const inject: FileSystemInject = {
    stat: async path => {
        switch (path) {
            case '/dir':
                return { isFile: () => false, isDirectory: () => true };

            case '/file.json':
            case '/array.json':
            case '/bad.json':
                return { isFile: () => true, isDirectory: () => false };

            case '/locked':
                return failWith('EACCES');

            case '/file.json/inner':
                return failWith('ENOTDIR');

            default:
                return failWith('ENOENT');
        }
    },
    readFile: async path => {
        switch (path) {
            case '/file.json':  return '{ "a": 1 }';
            case '/array.json': return '[ 1, 2 ]';
            case '/bad.json':   return '{ bad json';
            default:            return failWith('ENOENT');
        }
    },
    realpath: async path => `/real${path}`
};

describe('FileSystem.isFile(path); → boolean', () => {
    const target = new FileSystem(inject);

    it(`file → true`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isFile('/file.json'), true);
    });

    it(`directory → false`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isFile('/dir'), false);
    });

    it(`ENOENT → false`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isFile('/missing'), false);
    });

    it(`ENOTDIR → false`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isFile('/file.json/inner'), false);
    });

    it(`EACCES → rethrown`, async (t: it.TestContext) => {
        await t.assert.rejects(target.isFile('/locked'), { code: 'EACCES' });
    });
});

describe('FileSystem.isDirectory(path); → boolean', () => {
    const target = new FileSystem(inject);

    it(`directory → true`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isDirectory('/dir'), true);
    });

    it(`file → false`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isDirectory('/file.json'), false);
    });

    it(`ENOENT → false`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isDirectory('/missing'), false);
    });

    it(`EACCES → rethrown`, async (t: it.TestContext) => {
        await t.assert.rejects(target.isDirectory('/locked'), { code: 'EACCES' });
    });
});

describe('FileSystem.readJsonObject(path); → object', () => {
    const target = new FileSystem(inject);

    it(`valid JSON object → parsed`, async (t: it.TestContext) => {
        t.assert.deepStrictEqual(await target.readJsonObject('/file.json'), { a: 1 });
    });

    it(`JSON array → undefined`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.readJsonObject('/array.json'), undefined);
    });

    it(`invalid JSON → undefined`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.readJsonObject('/bad.json'), undefined);
    });

    it(`missing file → undefined`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.readJsonObject('/missing'), undefined);
    });

    it(`EACCES → rethrown`, async (t: it.TestContext) => {
        await t.assert.rejects(target.readJsonObject('/locked'), { code: 'EACCES' });
    });
});

describe('FileSystem.realpath(path); → string', () => {
    it(`delegates to the injected realpath`, async (t: it.TestContext) => {
        const target = new FileSystem(inject);
        t.assert.strictEqual(await target.realpath('/link'), '/real/link');
    });
});
