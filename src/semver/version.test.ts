import { InvalidVersionError } from './errors/index.ts';
import { describe, it } from 'node:test';
import { Version } from './version.ts';

describe('Version.parse(text); → parsing', () => {
    it(`'7.0.2'`, (t: it.TestContext) => {
        const version = Version.parse('7.0.2');
        t.assert.strictEqual(version.major, 7);
        t.assert.strictEqual(version.minor, 0);
        t.assert.strictEqual(version.patch, 2);
        t.assert.deepStrictEqual(version.prerelease, []);
        t.assert.deepStrictEqual(version.build, []);
    });

    it(`'7.1.0-beta.1+sha.abc' → prerelease and build`, (t: it.TestContext) => {
        const version = Version.parse('7.1.0-beta.1+sha.abc');
        t.assert.deepStrictEqual(version.prerelease, [ 'beta', '1' ]);
        t.assert.deepStrictEqual(version.build, [ 'sha', 'abc' ]);
    });

    it(`'v7.0.2' and surrounding spaces are accepted`, (t: it.TestContext) => {
        t.assert.strictEqual(Version.parse(' v7.0.2 ').toString(), '7.0.2');
    });

    for (const text of [ '7', '7.0', '7.x.0', '07.0.0', '7.0.0-', 'foo', '' ]) {
        it(`'${text}' → InvalidVersionError`, (t: it.TestContext) => {
            t.assert.throws(() => Version.parse(text), (err: any) => {
                t.assert.ok(err instanceof InvalidVersionError);
                t.assert.strictEqual(err.text, text);
                return true;
            });
        });

        it(`'${text}' → tryParse returns undefined`, (t: it.TestContext) => {
            t.assert.strictEqual(Version.tryParse(text), undefined);
        });
    }
});

describe('Version.compareTo(other); → precedence', () => {
    const cases: [ string, string, -1 | 0 | 1 ][] = [
        [ '7.0.2',          '7.0.2',            0  ],
        [ '7.0.2',          '7.0.3',            -1 ],
        [ '7.1.0',          '7.0.9',            1  ],
        [ '8.0.0',          '7.9.9',            1  ],
        [ '7.0.0-beta',     '7.0.0',            -1 ],
        [ '7.0.0',          '7.0.0-beta',       1  ],
        [ '7.0.0-alpha',    '7.0.0-beta',       -1 ],
        [ '7.0.0-2',        '7.0.0-10',         -1 ],
        [ '7.0.0-1',        '7.0.0-alpha',      -1 ],
        [ '7.0.0-beta',     '7.0.0-beta.1',     -1 ],
        [ '7.0.0+a',        '7.0.0+b',          0  ],
    ];

    for (const [ a, b, expected ] of cases) {
        it(`'${a}' vs '${b}' → ${expected}`, (t: it.TestContext) => {
            t.assert.strictEqual(Version.parse(a).compareTo(Version.parse(b)), expected);
        });
    }
});

describe('Version.increment(field); → new version', () => {
    const version = Version.parse('7.1.2-beta+build');

    it(`'major' → '8.0.0'`, (t: it.TestContext) => {
        t.assert.strictEqual(version.increment('major').toString(), '8.0.0');
    });

    it(`'minor' → '7.2.0'`, (t: it.TestContext) => {
        t.assert.strictEqual(version.increment('minor').toString(), '7.2.0');
    });

    it(`'patch' → '7.1.3'`, (t: it.TestContext) => {
        t.assert.strictEqual(version.increment('patch').toString(), '7.1.3');
    });

    it(`the original version is not modified`, (t: it.TestContext) => {
        t.assert.strictEqual(version.toString(), '7.1.2-beta+build');
    });
});

describe('Version.withPrerelease(prerelease); → new version', () => {
    it(`replaces the prerelease and keeps the build`, (t: it.TestContext) => {
        const version = Version.parse('7.1.2-beta+build').withPrerelease([ '0' ]);
        t.assert.strictEqual(version.toString(), '7.1.2-0+build');
    });
});
