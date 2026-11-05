import type { ProjectResolverInject } from './interfaces/index.ts';

import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { FileNotFoundError, ProjectNotFoundError } from './errors/index.ts';
import { FileSystemFake } from '../file-system/file-system.fake.ts';
import { ProjectResolver } from './project-resolver.ts';

describe(`ProjectResolver`, () => {
    const fileSystem = new FileSystemFake({
        '/path/to/project/tsconfig.json': '{}',
        '/path/to/project/tsconfig.build.json': '{}',
        '/path/to/project/inner/folder/index.ts': '',
        '/path/to/project/node_modules/@tsconfig/node22/tsconfig.json': '{}'
    })
        .fail('/path/to/locked', 'EACCES')
        .fail('/path/to/locked/tsconfig.json', 'EACCES');

    const inject: ProjectResolverInject = { pathModule, fileSystem };

    describe(`this.resolve(path?: string)`, () => {
        describe(`cwd = '/path/to/project'`, () => {
            const cwd = '/path/to/project';

            it(`path = undefined`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve(undefined);
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = './tsconfig.json'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('./tsconfig.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = '/path/to/project'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = '/path/to/project/tsconfig.json'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project/tsconfig.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });
        });

        describe(`cwd = '/path/to/project/inner/folder'`, () => {
            const cwd = '/path/to/project/inner/folder';

            it(`path = undefined`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve(undefined);
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = './tsconfig.json' (must fail)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                try {
                    await target.resolve('./tsconfig.json');
                    t.assert.fail(`This call must fail`);
                } catch (err: any) {
                    t.assert.ok(err instanceof FileNotFoundError);
                    t.assert.strictEqual(err.message, `The file "/path/to/project/inner/folder/tsconfig.json" doesn't exist`);
                }
            });

            it(`path = '/path/to/project'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = '/path/to/project/tsconfig.json'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project/tsconfig.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });
        });

        describe(`cwd = '/path/to/another-project'`, () => {
            const cwd = '/path/to/another-project';

            it(`path = undefined (must fail)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                try {
                    await target.resolve(undefined);
                    t.assert.fail(`This call must fail`);
                } catch (err: any) {
                    t.assert.ok(err instanceof ProjectNotFoundError);
                    t.assert.strictEqual(err.cwd, '/path/to/another-project');
                }
            });

            it(`path = './tsconfig.json' (must fail)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                try {
                    await target.resolve('./tsconfig.json');
                    t.assert.fail(`This call must fail`);
                } catch (err: any) {
                    t.assert.ok(err instanceof FileNotFoundError);
                    t.assert.strictEqual(err.message, `The file "/path/to/another-project/tsconfig.json" doesn't exist`);
                }
            });

            it(`path = '/path/to/project'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = '/path/to/project/tsconfig.json'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project/tsconfig.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });
        });

        describe(`cwd = '/path/to/project' → edge cases`, () => {
            const cwd = '/path/to/project';

            it(`path = 'tsconfig.build.json'`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('tsconfig.build.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.build.json');
            });

            it(`path = '/path/to/project/inner/../tsconfig.json' (normalized)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                const path = await target.resolve('/path/to/project/inner/../tsconfig.json');
                t.assert.strictEqual(path, '/path/to/project/tsconfig.json');
            });

            it(`path = './inner' (directory without tsconfig.json)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                await t.assert.rejects(
                    () => target.resolve('./inner'),
                    (err: any) => {
                        t.assert.ok(err instanceof FileNotFoundError);
                        t.assert.strictEqual(err.path, '/path/to/project/inner/tsconfig.json');
                        return true;
                    }
                );
            });

            it(`path = '/path/to/nothing' (nonexistent)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                await t.assert.rejects(
                    () => target.resolve('/path/to/nothing'),
                    (err: any) => {
                        t.assert.ok(err instanceof FileNotFoundError);
                        t.assert.strictEqual(err.path, '/path/to/nothing');
                        return true;
                    }
                );
            });

            it(`path = '/path/to/locked' (EACCES is rethrown)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                await t.assert.rejects(
                    () => target.resolve('/path/to/locked'),
                    (err: any) => {
                        t.assert.ok(!(err instanceof FileNotFoundError));
                        t.assert.strictEqual(err.code, 'EACCES');
                        return true;
                    }
                );
            });
        });

        describe(`cwd = '/path/to/locked'`, () => {
            const cwd = '/path/to/locked';

            it(`path = undefined (EACCES is rethrown)`, async (t: it.TestContext) => {
                const target = new ProjectResolver({
                    process: { cwd: () => cwd },
                    ...inject,
                });

                await t.assert.rejects(
                    () => target.resolve(undefined),
                    (err: any) => {
                        t.assert.ok(!(err instanceof FileNotFoundError));
                        t.assert.strictEqual(err.code, 'EACCES');
                        return true;
                    }
                );
            });
        });
    });
});
