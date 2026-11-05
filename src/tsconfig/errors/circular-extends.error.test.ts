import { describe, it } from 'node:test';

import { CircularExtendsError } from './circular-extends.error.ts';

describe('new CircularExtendsError(chain); → error', () => {
    const chain = [ '/p/tsconfig.json', '/p/base.json', '/p/tsconfig.json' ];
    const err = new CircularExtendsError(chain);

    it(`name = 'CircularExtendsError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'CircularExtendsError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `Circular "extends" detected: "/p/tsconfig.json" → "/p/base.json" → "/p/tsconfig.json"`
        );
    });

    it(`exposes chain`, (t: it.TestContext) => {
        t.assert.strictEqual(err.chain, chain);
    });
});
