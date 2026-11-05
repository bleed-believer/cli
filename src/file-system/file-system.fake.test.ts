import { describe, it } from 'node:test';

import { FileSystemFake } from './file-system.fake.ts';

describe('new FileSystemFake(files); → in-memory file system', () => {
    const target = new FileSystemFake({
        '/p/a.json': '{ "a": 1 }',
        '/p/array.json': '[]',
        '/p/bad.json': '{ bad',
        '/p/sub/b.json': '{}'
    })
        .link('/p/link', '/real')
        .fail('/p/locked', 'EACCES');

    it(`isFile → only declared files`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isFile('/p/a.json'), true);
        t.assert.strictEqual(await target.isFile('/p/sub'), false);
        t.assert.strictEqual(await target.isFile('/p/missing'), false);
    });

    it(`isDirectory → inferred from file paths`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.isDirectory('/p'), true);
        t.assert.strictEqual(await target.isDirectory('/p/sub'), true);
        t.assert.strictEqual(await target.isDirectory('/p/a.json'), false);
        t.assert.strictEqual(await target.isDirectory('/p/su'), false);
    });

    it(`readJsonObject → only valid JSON objects`, async (t: it.TestContext) => {
        t.assert.deepStrictEqual(await target.readJsonObject('/p/a.json'), { a: 1 });
        t.assert.strictEqual(await target.readJsonObject('/p/array.json'), undefined);
        t.assert.strictEqual(await target.readJsonObject('/p/bad.json'), undefined);
        t.assert.strictEqual(await target.readJsonObject('/p/missing'), undefined);
    });

    it(`realpath → replaces linked prefixes`, async (t: it.TestContext) => {
        t.assert.strictEqual(await target.realpath('/p/link/x.json'), '/real/x.json');
        t.assert.strictEqual(await target.realpath('/p/linked/x.json'), '/p/linked/x.json');
    });

    it(`fail → every access throws the code`, async (t: it.TestContext) => {
        await t.assert.rejects(target.isFile('/p/locked'), { code: 'EACCES' });
        await t.assert.rejects(target.isDirectory('/p/locked'), { code: 'EACCES' });
        await t.assert.rejects(target.readJsonObject('/p/locked'), { code: 'EACCES' });
    });
});
