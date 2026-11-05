import { FileNotFoundError } from './file-not-found.error.ts';
import { describe, it } from 'node:test';

describe('new FileNotFoundError(path, options); → error', () => {
    const cause = new Error('ENOENT');
    const err = new FileNotFoundError('/path/to/project/tsconfig.json', { cause });

    it(`name = 'FileNotFoundError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'FileNotFoundError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `The file "/path/to/project/tsconfig.json" doesn't exist`
        );
    });

    it(`exposes path and cause`, (t: it.TestContext) => {
        t.assert.strictEqual(err.path, '/path/to/project/tsconfig.json');
        t.assert.strictEqual(err.cause, cause);
    });
});
