import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { ExportsTargetResolver } from './package-resolver.exports-target.ts';
import { FileSystemFake } from '../file-system/file-system.fake.ts';

const DIR = '/p/node_modules/pkg';

function createTarget(files: string[], active: string[] = []): ExportsTargetResolver {
    const fileSystem = new FileSystemFake(Object.fromEntries(files.map(x => [ `${DIR}/${x}`, '{}' ])));
    return new ExportsTargetResolver(condition => active.includes(condition), { pathModule, fileSystem });
}

describe('ExportsTargetResolver.resolve(packageDir, entry); → string targets', () => {
    it(`existing file`, async (t: it.TestContext) => {
        const target = createTarget([ 'e.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './e.json', subpath: '', pattern: false }), `${DIR}/e.json`);
    });

    it(`missing file → undefined`, async (t: it.TestContext) => {
        const target = createTarget([]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './e.json', subpath: '', pattern: false }), undefined);
    });

    it(`".json" is not appended`, async (t: it.TestContext) => {
        const target = createTarget([ 'e.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './e', subpath: '', pattern: false }), undefined);
    });

    it(`directory → undefined`, async (t: it.TestContext) => {
        const target = createTarget([ 'cfg/tsconfig.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './cfg', subpath: '', pattern: false }), undefined);
    });

    it(`not starting with "./" → undefined`, async (t: it.TestContext) => {
        const target = createTarget([ 'e.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: 'e.json', subpath: '', pattern: false }), undefined);
    });

    it(`pattern → every "*" is replaced`, async (t: it.TestContext) => {
        const target = createTarget([ 'node/node.json' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: './*/*.json', subpath: 'node', pattern: true }),
            `${DIR}/node/node.json`
        );
    });

    it(`folder mapping → the subpath is appended`, async (t: it.TestContext) => {
        const target = createTarget([ 'b/x.json' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: './b/', subpath: 'x.json', pattern: false }),
            `${DIR}/b/x.json`
        );
    });

    it(`folder mapping to a file → undefined`, async (t: it.TestContext) => {
        const target = createTarget([ 'b.jsonx.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './b.json', subpath: 'x.json', pattern: false }), undefined);
    });

    for (const invalid of [ './../x.json', './a/./x.json', './node_modules/x.json' ]) {
        it(`'${invalid}' → invalid segment`, async (t: it.TestContext) => {
            const target = createTarget([ 'a/x.json', 'node_modules/x.json' ]);
            t.assert.strictEqual(await target.resolve(DIR, { target: invalid, subpath: '', pattern: false }), undefined);
        });
    }

    it(`".." in the matched text → undefined`, async (t: it.TestContext) => {
        const target = createTarget([ 'x.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: './cfg/*.json', subpath: '../x', pattern: true }), undefined);
    });
});

describe('ExportsTargetResolver.resolve(packageDir, entry); → fallbacks and conditions', () => {
    it(`null → undefined`, async (t: it.TestContext) => {
        const target = createTarget([ 'x.json' ]);
        t.assert.strictEqual(await target.resolve(DIR, { target: null, subpath: '', pattern: false }), undefined);
    });

    it(`array → the first one that resolves`, async (t: it.TestContext) => {
        const target = createTarget([ 'yes.json' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: [ 'nope', './nope.json', './yes.json' ], subpath: '', pattern: false }),
            `${DIR}/yes.json`
        );
    });

    it(`"default" is always active`, async (t: it.TestContext) => {
        const target = createTarget([ 'd.json' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: { default: './d.json' }, subpath: '', pattern: false }),
            `${DIR}/d.json`
        );
    });

    it(`inactive conditions are skipped`, async (t: it.TestContext) => {
        const target = createTarget([ 'i.json', 'd.json' ], [ 'require' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: { import: './i.json', default: './d.json' }, subpath: '', pattern: false }),
            `${DIR}/d.json`
        );
    });

    it(`the key order decides among active conditions`, async (t: it.TestContext) => {
        const target = createTarget([ 'd.json', 't.json' ], [ 'types' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: { default: './d.json', types: './t.json' }, subpath: '', pattern: false }),
            `${DIR}/d.json`
        );
    });

    it(`nested conditions`, async (t: it.TestContext) => {
        const target = createTarget([ 'ni.json', 'nr.json' ], [ 'node', 'require' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, {
                target: { node: { import: './ni.json', require: './nr.json' } },
                subpath: '',
                pattern: false
            }),
            `${DIR}/nr.json`
        );
    });

    it(`a condition that fails falls to the next one`, async (t: it.TestContext) => {
        const target = createTarget([ 'd.json' ], [ 'require', 'node' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, {
                target: { node: { import: './ni.json' }, require: './missing.json', default: './d.json' },
                subpath: '',
                pattern: false
            }),
            `${DIR}/d.json`
        );
    });

    it(`conditions keep the pattern substitution`, async (t: it.TestContext) => {
        const target = createTarget([ 'cfg/x.json' ]);
        t.assert.strictEqual(
            await target.resolve(DIR, { target: { default: './cfg/*.json' }, subpath: 'x', pattern: true }),
            `${DIR}/cfg/x.json`
        );
    });
});
