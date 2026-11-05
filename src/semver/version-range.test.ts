import { InvalidVersionError, InvalidVersionRangeError } from './errors/index.ts';
import { VersionRange } from './version-range.ts';
import { describe, it } from 'node:test';
import { Version } from './version.ts';

describe('VersionRange.test(version); → TypeScript 7.0.2', () => {
    // Every case was verified against tsc 7.0.2 with `types@<range>` export conditions
    const cases: [ string, boolean ][] = [
        [ '>=5.0',          true  ],
        [ '<5',             false ],
        [ '>7.0.1',         true  ],
        [ '>7.0.2',         false ],
        [ '7.0.2',          true  ],
        [ '7',              true  ],
        [ '7.0',            true  ],
        [ '>=7.0.3',        false ],
        [ '6 - 7',          true  ],
        [ '7.0.0 - 7.0.1',  false ],
        [ '<=7.0',          true  ],
        [ '>=7.0 <8',       true  ],
        [ '>=7.1',          false ],
        [ '^6 || ^7',       true  ],
        [ '~7.1',           false ],
        [ '>=7.0.2-beta',   true  ],
        [ '*',              true  ],
    ];

    for (const [ range, expected ] of cases) {
        it(`'${range}' → ${expected}`, (t: it.TestContext) => {
            t.assert.strictEqual(VersionRange.parse(range).test('7.0.2'), expected);
        });
    }
});

describe('VersionRange.test(version); → operators', () => {
    const cases: [ string, string, boolean ][] = [
        // "~": patch-level changes (or minor-level when the minor is omitted)
        [ '~7.1.2',     '7.1.9',    true  ],
        [ '~7.1.2',     '7.2.0',    false ],
        [ '~7',         '7.9.0',    true  ],
        [ '~7',         '8.0.0',    false ],
        // "^": changes that don't modify the left-most non-zero field
        [ '^7.1.2',     '7.9.0',    true  ],
        [ '^7.1.2',     '8.0.0',    false ],
        [ '^0.2.3',     '0.2.9',    true  ],
        [ '^0.2.3',     '0.3.0',    false ],
        [ '^0.0.3',     '0.0.3',    true  ],
        [ '^0.0.3',     '0.0.4',    false ],
        // Partial versions
        [ '<7',         '6.9.9',    true  ],
        [ '<7',         '7.0.0',    false ],
        [ '>7',         '7.9.9',    false ],
        [ '>7',         '8.0.0',    true  ],
        [ '>7.0',       '7.0.9',    false ],
        [ '>7.0',       '7.1.0',    true  ],
        [ '<=7',        '7.9.9',    true  ],
        [ '<=7',        '8.0.0',    false ],
        [ '7.x',        '7.5.0',    true  ],
        [ '7.x',        '8.0.0',    false ],
        [ '=7.0.2',     '7.0.2',    true  ],
        [ 'x',          '0.0.1',    true  ],
        // Hyphen ranges
        [ '6 - 7.1',    '7.1.9',    true  ],
        [ '6 - 7.1',    '7.2.0',    false ],
        [ '6.1 - 7',    '6.0.9',    false ],
        [ '* - 7',      '0.0.1',    true  ],
        // Prereleases
        [ '>=7.0.0',    '7.0.0-rc', false ],
        [ '<7',         '7.0.0-rc', false ],
        [ '<7',         '6.9.9-rc', true  ],
    ];

    for (const [ range, version, expected ] of cases) {
        it(`'${range}' with '${version}' → ${expected}`, (t: it.TestContext) => {
            t.assert.strictEqual(VersionRange.parse(range).test(version), expected);
        });
    }

    it(`accepts a Version instance`, (t: it.TestContext) => {
        t.assert.strictEqual(VersionRange.parse('^7').test(Version.parse('7.3.0')), true);
    });

    it(`invalid version text → InvalidVersionError`, (t: it.TestContext) => {
        t.assert.throws(() => VersionRange.parse('^7').test('7.x'), InvalidVersionError);
    });
});

describe('VersionRange.parse(text); → parsing', () => {
    it(`keeps the original text`, (t: it.TestContext) => {
        const range = VersionRange.parse('^6 || ^7');
        t.assert.strictEqual(range.text, '^6 || ^7');
        t.assert.strictEqual(range.toString(), '^6 || ^7');
    });

    for (const text of [ 'foo', '>=', '7.0.0.0', '>>7', '7 -', '01.0.0' ]) {
        it(`'${text}' → InvalidVersionRangeError`, (t: it.TestContext) => {
            t.assert.throws(() => VersionRange.parse(text), (err: any) => {
                t.assert.ok(err instanceof InvalidVersionRangeError);
                t.assert.strictEqual(err.text, text);
                return true;
            });
        });

        it(`'${text}' → tryParse returns undefined`, (t: it.TestContext) => {
            t.assert.strictEqual(VersionRange.tryParse(text), undefined);
        });
    }
});
