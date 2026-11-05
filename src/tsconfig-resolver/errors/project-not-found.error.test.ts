import { ProjectNotFoundError } from './project-not-found.error.ts';
import { describe, it } from 'node:test';

describe('new ProjectNotFoundError(cwd, options); → error', () => {
    const err = new ProjectNotFoundError('/path/to/project');

    it(`name = 'ProjectNotFoundError'`, (t: it.TestContext) => {
        t.assert.ok(err instanceof Error);
        t.assert.strictEqual(err.name, 'ProjectNotFoundError');
    });

    it(`message`, (t: it.TestContext) => {
        t.assert.strictEqual(
            err.message,
            `No "tsconfig.json" file was found in "/path/to/project" or any of its parent directories`
        );
    });

    it(`exposes cwd`, (t: it.TestContext) => {
        t.assert.strictEqual(err.cwd, '/path/to/project');
    });
});
