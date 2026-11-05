import { describe, it } from 'node:test';

import { InvalidTsconfigError } from './invalid-tsconfig.error.ts';

describe('new InvalidTsconfigError(path, cause); → error', () => {
    const cause = new SyntaxError('Unexpected token');
    const err = new InvalidTsconfigError('/p/tsconfig.json', cause);

    it(`name = 'InvalidTsconfigError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'InvalidTsconfigError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(err.message, `The tsconfig file "/p/tsconfig.json" is invalid`);
    });

    it(`exposes path and cause`, (t: it.TestContext) => {
        t.assert.strictEqual(err.path, '/p/tsconfig.json');
        t.assert.strictEqual(err.cause, cause);
    });
});
