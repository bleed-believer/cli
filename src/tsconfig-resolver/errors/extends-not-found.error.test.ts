import { describe, it } from 'node:test';

import { ExtendsNotFoundError } from './extends-not-found.error.ts';

describe('new ExtendsNotFoundError(specifier, configPath); → error', () => {
    const err = new ExtendsNotFoundError('@tsconfig/node22', '/p/tsconfig.json');

    it(`name = 'ExtendsNotFoundError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'ExtendsNotFoundError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `Cannot resolve the "extends" value "@tsconfig/node22" declared in "/p/tsconfig.json"`
        );
    });

    it(`exposes specifier and configPath`, (t: it.TestContext) => {
        t.assert.strictEqual(err.specifier, '@tsconfig/node22');
        t.assert.strictEqual(err.configPath, '/p/tsconfig.json');
    });
});
