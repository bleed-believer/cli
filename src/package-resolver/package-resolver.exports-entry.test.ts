import { describe, it } from 'node:test';

import { selectExportsEntry } from './package-resolver.exports-entry.ts';

describe('selectExportsEntry(exports, subpath); → bare name', () => {
    it(`string → the whole exports`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry('./e.json', ''),
            { target: './e.json', subpath: '', pattern: false }
        );
    });

    it(`array → the whole exports`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry([ './a.json' ], ''),
            { target: [ './a.json' ], subpath: '', pattern: false }
        );
    });

    it(`conditions object → the whole exports`, (t: it.TestContext) => {
        const exports = { require: './r.json', default: './d.json' };
        t.assert.deepStrictEqual(
            selectExportsEntry(exports, ''),
            { target: exports, subpath: '', pattern: false }
        );
    });

    it(`subpath map → "."`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ '.': './a.json', './x': './x.json' }, ''),
            { target: './a.json', subpath: '', pattern: false }
        );
    });

    it(`mixed keys → "." is still used`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ default: './b.json', '.': './a.json' }, ''),
            { target: './a.json', subpath: '', pattern: false }
        );
    });

    it(`subpath map without "." → not exported`, (t: it.TestContext) => {
        t.assert.strictEqual(selectExportsEntry({ './x.json': './x.json' }, ''), undefined);
    });
});

describe('selectExportsEntry(exports, subpath); → subpaths', () => {
    it(`exact key`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ './x': './x.json' }, 'x'),
            { target: './x.json', subpath: '', pattern: false }
        );
    });

    it(`an exact key wins over a pattern`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ './cfg/*': './b/*.json', './cfg/x': './exact.json' }, 'cfg/x'),
            { target: './exact.json', subpath: '', pattern: false }
        );
    });

    it(`an exact null key blocks a pattern`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ './*': './*', './x.json': null }, 'x.json'),
            { target: null, subpath: '', pattern: false }
        );
    });

    it(`the most specific pattern wins`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ './*': './a/*.json', './cfg/*': './b/*.json' }, 'cfg/x'),
            { target: './b/*.json', subpath: 'x', pattern: true }
        );
    });

    it(`folder mapping`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            selectExportsEntry({ './cfg/': './b/' }, 'cfg/x.json'),
            { target: './b/', subpath: 'x.json', pattern: false }
        );
    });

    it(`no matching key → not exported`, (t: it.TestContext) => {
        t.assert.strictEqual(selectExportsEntry({ './x.json': './x.json' }, 'base.json'), undefined);
    });

    it(`string exports → not exported`, (t: it.TestContext) => {
        t.assert.strictEqual(selectExportsEntry('./e.json', 'x'), undefined);
    });

    it(`mixed keys → not exported`, (t: it.TestContext) => {
        t.assert.strictEqual(selectExportsEntry({ './x': './a.json', default: './b.json' }, 'x'), undefined);
    });
});
