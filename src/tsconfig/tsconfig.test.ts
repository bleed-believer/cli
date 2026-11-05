import type { TsconfigInject } from './interfaces/index.ts';

import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { CircularExtendsError, InvalidExtendsError, InvalidTsconfigError } from './errors/index.ts';
import { ExtendsNotFoundError, ProjectNotFoundError } from '../tsconfig-resolver/index.ts';
import { Tsconfig } from './tsconfig.ts';

interface Scenario {
    /** Path returned by the project resolver. */
    project: string;
    /** Files and their contents. */
    files: Record<string, string>;
    /** `extends` specifier → resolved path. */
    extends?: Record<string, string>;
}

/** Fakes of the resolvers and the file system, so only the merge is tested. */
function createTsconfig(scenario: Scenario) {
    const calls: { project: (string | undefined)[]; extends: [ string, string ][]; } = { project: [], extends: [] };
    const inject: TsconfigInject = {
        pathModule,
        projectResolver: {
            resolve: async path => {
                calls.project.push(path);
                return scenario.project;
            }
        },
        extendsResolver: {
            resolve: async (specifier, configPath) => {
                calls.extends.push([ specifier, configPath ]);
                const path = scenario.extends?.[specifier];
                if (!path) {
                    throw new ExtendsNotFoundError(specifier, configPath);
                }

                return path;
            }
        },
        readFile: async path => {
            if (!Object.hasOwn(scenario.files, path)) {
                const err = new Error(`ENOENT: ${path}`) as Error & { code: string; };
                err.code = 'ENOENT';
                throw err;
            }

            return scenario.files[path];
        }
    };

    return { target: new Tsconfig(inject), calls };
}

const json = (value: unknown) => JSON.stringify(value);

describe('Tsconfig.load(path); → single file', () => {
    it(`passes the path to the project resolver`, async (t: it.TestContext) => {
        const { target, calls } = createTsconfig({ project: '/p/tsconfig.json', files: { '/p/tsconfig.json': '{}' } });
        await target.load('./tsconfig.json');
        await target.load();
        t.assert.deepStrictEqual(calls.project, [ './tsconfig.json', undefined ]);
    });

    it(`returns the validated options and the path`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': `{
                    // comments and trailing commas, like tsc
                    "include": [ "src" ],
                    "compilerOptions": { "strict": true, "outDir": "dist", },
                }`
            }
        });

        t.assert.deepStrictEqual(await target.load(), {
            path: '/p/tsconfig.json',
            include: [ './src' ],
            compilerOptions: { strict: true, outDir: './dist' }
        });
    });

    it(`null options are removed`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: { '/p/tsconfig.json': json({ include: null, compilerOptions: { outDir: null } }) }
        });

        t.assert.deepStrictEqual(await target.load(), { path: '/p/tsconfig.json', compilerOptions: {} });
    });

    it(`empty file → {}`, async (t: it.TestContext) => {
        const { target } = createTsconfig({ project: '/p/tsconfig.json', files: { '/p/tsconfig.json': '' } });
        t.assert.deepStrictEqual(await target.load(), { path: '/p/tsconfig.json' });
    });
});

describe('Tsconfig.load(path); → extends', () => {
    it(`resolves each specifier from the declaring file`, async (t: it.TestContext) => {
        const { target, calls } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './cfg/base.json' }),
                '/p/cfg/base.json': json({ extends: 'pkg' }),
                '/p/node_modules/pkg/tsconfig.json': '{}'
            },
            extends: {
                './cfg/base.json': '/p/cfg/base.json',
                'pkg': '/p/node_modules/pkg/tsconfig.json'
            }
        });

        await target.load();
        t.assert.deepStrictEqual(calls.extends, [
            [ './cfg/base.json', '/p/tsconfig.json' ],
            [ 'pkg', '/p/cfg/base.json' ]
        ]);
    });

    it(`inherited paths are rebased to the loaded file`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './cfg/base.json' }),
                '/p/cfg/base.json': json({
                    include: [ '../src/**/*' ],
                    compilerOptions: {
                        outDir: '../dist',
                        mapRoot: './mr',
                        paths: { '@app/*': [ '../src/app/*' ] }
                    }
                })
            },
            extends: { './cfg/base.json': '/p/cfg/base.json' }
        });

        t.assert.deepStrictEqual(await target.load(), {
            path: '/p/tsconfig.json',
            include: [ './src/**/*' ],
            compilerOptions: {
                outDir: './dist',
                mapRoot: './mr',
                paths: { '@app/*': [ './src/app/*' ] }
            }
        });
    });

    it(`\${configDir} is the folder of the loaded file, not of the declaring file`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/app/tsconfig.json',
            files: {
                '/p/app/tsconfig.json': json({ extends: '../base/tsconfig.json' }),
                '/p/base/tsconfig.json': json({
                    include: [ '${configDir}/src' ],
                    compilerOptions: {
                        outDir: '${configDir}/dist',
                        rootDir: './src',
                        paths: { '@/*': [ '${configDir}/src/*', './lib/*' ] }
                    }
                })
            },
            extends: { '../base/tsconfig.json': '/p/base/tsconfig.json' }
        });

        t.assert.deepStrictEqual(await target.load(), {
            path: '/p/app/tsconfig.json',
            include: [ './src' ],
            compilerOptions: {
                outDir: './dist',
                rootDir: '../base/src',
                paths: { '@/*': [ './src/*', '../base/lib/*' ] }
            }
        });
    });

    it(`\${configDir} through a chain of bases`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './a/a.json' }),
                '/p/a/a.json': json({ extends: './b/b.json' }),
                '/p/a/b/b.json': json({ compilerOptions: { outDir: '${configDir}/out' } })
            },
            extends: { './a/a.json': '/p/a/a.json', './b/b.json': '/p/a/b/b.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { outDir: './out' });
    });

    it(`rebases through every layer of the chain`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './a/a.json' }),
                '/p/a/a.json': json({ extends: './b/b.json' }),
                '/p/a/b/b.json': json({ compilerOptions: { outDir: './out' } })
            },
            extends: { './a/a.json': '/p/a/a.json', './b/b.json': '/p/a/b/b.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { outDir: './a/b/out' });
    });

    it(`the child overrides its bases`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './base.json', compilerOptions: { target: 'esnext' } }),
                '/p/base.json': json({ compilerOptions: { target: 'es2020', strict: true } })
            },
            extends: { './base.json': '/p/base.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { target: 'esnext', strict: true });
    });

    it(`extends array → later bases override earlier ones`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: [ './one/a.json', './two/b.json' ] }),
                '/p/one/a.json': json({ compilerOptions: { outDir: './o1', strict: true, target: 'es2020' } }),
                '/p/two/b.json': json({ compilerOptions: { outDir: './o2', target: 'es2022' } })
            },
            extends: { './one/a.json': '/p/one/a.json', './two/b.json': '/p/two/b.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, {
            outDir: './two/o2',
            strict: true,
            target: 'es2022'
        });
    });

    it(`null in a middle layer unsets the inherited option`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './mid.json' }),
                '/p/mid.json': json({ extends: './base.json', compilerOptions: { outDir: null, paths: null } }),
                '/p/base.json': json({ compilerOptions: { outDir: './out', strict: true, paths: { '@x/*': [ './x/*' ] } } })
            },
            extends: { './mid.json': '/p/mid.json', './base.json': '/p/base.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { strict: true });
    });

    it(`null in a later base of an array unsets the option of an earlier base`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: [ './a.json', './b.json' ] }),
                '/p/a.json': json({ compilerOptions: { outDir: './o1' } }),
                '/p/b.json': json({ compilerOptions: { outDir: null } })
            },
            extends: { './a.json': '/p/a.json', './b.json': '/p/b.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, {});
    });

    it(`"compilerOptions": null keeps the inherited options`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './base.json', compilerOptions: null }),
                '/p/base.json': json({ compilerOptions: { strict: true } })
            },
            extends: { './base.json': '/p/base.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { strict: true });
    });

    it(`include and exclude are inherited independently`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './base/b.json', include: [ 'own' ] }),
                '/p/base/b.json': json({ include: [ 'src' ], exclude: [ 'src/x' ] })
            },
            extends: { './base/b.json': '/p/base/b.json' }
        });

        const result = await target.load();
        t.assert.deepStrictEqual(result.include, [ './own' ]);
        t.assert.deepStrictEqual(result.exclude, [ './base/src/x' ]);
    });

    it(`the same base extended twice (diamond) is not circular`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: [ './a.json', './b.json' ] }),
                '/p/a.json': json({ extends: './base.json' }),
                '/p/b.json': json({ extends: './base.json' }),
                '/p/base.json': json({ compilerOptions: { strict: true } })
            },
            extends: { './a.json': '/p/a.json', './b.json': '/p/b.json', './base.json': '/p/base.json' }
        });

        t.assert.deepStrictEqual((await target.load()).compilerOptions, { strict: true });
    });
});

describe('Tsconfig.load(path); → errors', () => {
    it(`circular extends → CircularExtendsError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './b.json' }),
                '/p/b.json': json({ extends: './tsconfig.json' })
            },
            extends: { './b.json': '/p/b.json', './tsconfig.json': '/p/tsconfig.json' }
        });

        await t.assert.rejects(target.load(), (err: any) => {
            t.assert.ok(err instanceof CircularExtendsError);
            t.assert.deepStrictEqual(err.chain, [ '/p/tsconfig.json', '/p/b.json', '/p/tsconfig.json' ]);
            return true;
        });
    });

    it(`a file extending itself → CircularExtendsError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: { '/p/tsconfig.json': json({ extends: '.' }) },
            extends: { '.': '/p/tsconfig.json' }
        });

        await t.assert.rejects(target.load(), CircularExtendsError);
    });

    it(`invalid syntax → InvalidTsconfigError with the file and the SyntaxError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: {
                '/p/tsconfig.json': json({ extends: './base.json' }),
                '/p/base.json': `{ compilerOptions: {} }`
            },
            extends: { './base.json': '/p/base.json' }
        });

        await t.assert.rejects(target.load(), (err: any) => {
            t.assert.ok(err instanceof InvalidTsconfigError);
            t.assert.strictEqual(err.path, '/p/base.json');
            t.assert.ok(err.cause instanceof SyntaxError);
            return true;
        });
    });

    it(`invalid value → InvalidTsconfigError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: { '/p/tsconfig.json': json({ compilerOptions: { target: 'es3' } }) }
        });

        await t.assert.rejects(target.load(), (err: any) => {
            t.assert.ok(err instanceof InvalidTsconfigError);
            t.assert.strictEqual(err.path, '/p/tsconfig.json');
            return true;
        });
    });

    it(`invalid extends → InvalidTsconfigError caused by InvalidExtendsError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: { '/p/tsconfig.json': json({ extends: '' }) }
        });

        await t.assert.rejects(target.load(), (err: any) => {
            t.assert.ok(err instanceof InvalidTsconfigError);
            t.assert.ok(err.cause instanceof InvalidExtendsError);
            return true;
        });
    });

    it(`unresolved extends → ExtendsNotFoundError`, async (t: it.TestContext) => {
        const { target } = createTsconfig({
            project: '/p/tsconfig.json',
            files: { '/p/tsconfig.json': json({ extends: 'missing' }) }
        });

        await t.assert.rejects(target.load(), ExtendsNotFoundError);
    });

    it(`project resolver errors are not wrapped`, async (t: it.TestContext) => {
        const target = new Tsconfig({
            projectResolver: { resolve: async () => { throw new ProjectNotFoundError('/p'); } }
        });

        await t.assert.rejects(target.load(), ProjectNotFoundError);
    });

    it(`read errors are not wrapped`, async (t: it.TestContext) => {
        const { target } = createTsconfig({ project: '/p/tsconfig.json', files: {} });
        await t.assert.rejects(target.load(), { code: 'ENOENT' });
    });
});
