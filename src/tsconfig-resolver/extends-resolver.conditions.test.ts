import { describe, it } from 'node:test';

import { ExportConditions } from './extends-resolver.conditions.ts';

describe('ExportConditions.isActive(condition); → tsc 7 conditions', () => {
    const target = new ExportConditions({ readTypescriptVersion: () => '7.0.2' });

    for (const condition of [ 'types', 'require', 'node' ]) {
        it(`'${condition}' → active`, (t: it.TestContext) => {
            t.assert.strictEqual(target.isActive(condition), true);
        });
    }

    for (const condition of [ 'import', 'tsconfig', 'browser', 'typesVersions' ]) {
        it(`'${condition}' → inactive`, (t: it.TestContext) => {
            t.assert.strictEqual(target.isActive(condition), false);
        });
    }
});

describe('ExportConditions.isActive(condition); → versioned "types@<range>"', () => {
    const target = new ExportConditions({ readTypescriptVersion: () => '7.0.2' });

    const cases: [ string, boolean ][] = [
        [ 'types@>=5.0',    true  ],
        [ 'types@^6 || ^7', true  ],
        [ 'types@<5',       false ],
        [ 'types@~7.1',     false ],
        [ 'types@foo',      false ],
        [ 'types@',         true  ],
    ];

    for (const [ condition, expected ] of cases) {
        it(`'${condition}' → ${expected ? 'active' : 'inactive'}`, (t: it.TestContext) => {
            t.assert.strictEqual(target.isActive(condition), expected);
        });
    }

    it(`reads the TypeScript version once, and only when needed`, (t: it.TestContext) => {
        let calls = 0;
        const target = new ExportConditions({
            readTypescriptVersion: () => {
                calls++;
                return '7.0.2';
            }
        });

        target.isActive('types');
        target.isActive('types@foo');
        t.assert.strictEqual(calls, 0);

        target.isActive('types@>=5');
        target.isActive('types@<5');
        t.assert.strictEqual(calls, 1);
    });

    it(`by default, uses the installed TypeScript version`, (t: it.TestContext) => {
        const target = new ExportConditions();
        t.assert.strictEqual(target.isActive('types@>=0.0.1'), true);
    });
});
