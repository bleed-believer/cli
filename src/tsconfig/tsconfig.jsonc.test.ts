import { describe, it } from 'node:test';

import { parseJsonc } from './tsconfig.jsonc.ts';

describe('parseJsonc(text); → accepted syntax', () => {
    it(`plain JSON`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('{ "a": [ 1, "b" ] }'), { a: [ 1, 'b' ] });
    });

    it(`line comments`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('// x\n{ "a": 1 // y\n}\n// z'), { a: 1 });
    });

    it(`block comments`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('/* x */{ /* y\n */ "a": /**/1 }'), { a: 1 });
    });

    it(`trailing commas in objects and arrays`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('{ "a": [ 1, 2, ], "b": {}, }'), { a: [ 1, 2 ], b: {} });
    });

    it(`trailing comma followed by a comment`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('{ "a": 1, // last\n}'), { a: 1 });
    });

    it(`comment markers inside strings are kept`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(
            parseJsonc('{ "a": "./src/**/*", "b": "http://x", "c": "/* no */" }'),
            { a: './src/**/*', b: 'http://x', c: '/* no */' }
        );
    });

    it(`escaped quotes inside strings`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('{ "a": "x\\" // y", }'), { a: 'x" // y' });
    });

    it(`commas inside strings are kept`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('{ "a": ",}" }'), { a: ',}' });
    });

    it(`BOM is ignored`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('\uFEFF{ "a": 1 }'), { a: 1 });
    });

    for (const text of [ '', '   \n', '// only a comment', '/* only */' ]) {
        it(`${JSON.stringify(text)} → {}`, (t: it.TestContext) => {
            t.assert.deepStrictEqual(parseJsonc(text), {});
        });
    }
});

describe('parseJsonc(text); → rejected syntax (like tsc)', () => {
    const cases = [
        [ 'single quotes',          `{ 'a': 1 }` ],
        [ 'unquoted keys',          `{ a: 1 }` ],
        [ 'unterminated comment',   `{ "a": 1 } /* x` ],
        [ 'double comma',           `[ 1,, 2 ]` ],
        [ 'missing value',          `{ "a": }` ],
    ];

    for (const [ name, text ] of cases) {
        it(`${name} → SyntaxError`, (t: it.TestContext) => {
            t.assert.throws(() => parseJsonc(text), SyntaxError);
        });
    }

    it(`a root that is not an object is returned as-is`, (t: it.TestContext) => {
        t.assert.deepStrictEqual(parseJsonc('[ 1 ]'), [ 1 ]);
    });
});
