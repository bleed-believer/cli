import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { FileSystemFake } from '../file-system/file-system.fake.ts';
import { ExtendsNotFoundError } from './errors/index.ts';
import { ExtendsResolver } from './extends-resolver.ts';

const json = (value: unknown) => JSON.stringify(value);
const CONFIG = '/p/tsconfig.json';

function createResolver(fileSystem: FileSystemFake, cwd = '/p'): ExtendsResolver {
    return new ExtendsResolver({
        readTypescriptVersion: () => '7.0.2',
        process: { cwd: () => cwd },
        pathModule,
        fileSystem
    });
}

async function assertNotFound(t: it.TestContext, promise: Promise<string>, specifier: string) {
    await t.assert.rejects(promise, (err: any) => {
        t.assert.ok(err instanceof ExtendsNotFoundError);
        t.assert.strictEqual(err.specifier, specifier);
        return true;
    });
}

describe('ExtendsResolver.resolve(specifier, configPath); → relative and absolute paths', () => {
    it(`'./base.json' → the file as-is`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./base.json', CONFIG), '/p/base.json');
    });

    it(`'./base' → ".json" is appended`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./base', CONFIG), '/p/base.json');
    });

    it(`'./base' → an existing file without extension wins over "base.json"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base': '{}', '/p/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./base', CONFIG), '/p/base');
    });

    it(`'./base.JSON' → the extension check is case-sensitive`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base.JSON.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./base.JSON', CONFIG), '/p/base.JSON.json');
    });

    it(`'../shared/base.json' → resolved against the declaring file`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/shared/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('../shared/base.json', CONFIG), '/shared/base.json');
    });

    it(`'.\\base.json' → backslashes are accepted as separators`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('.\\base.json', CONFIG), '/p/base.json');
    });

    it(`'/abs/base' → absolute path, ".json" is appended`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/abs/base.json': '{}' }));
        t.assert.strictEqual(await target.resolve('/abs/base', CONFIG), '/abs/base.json');
    });

    it(`nested config → relative to the declaring file, not to cwd`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/sub/other.json': '{}', '/p/other.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./other.json', '/p/sub/base.json'), '/p/sub/other.json');
    });

    it(`relative configPath → resolved against cwd`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/sub/other.json': '{}' }));
        t.assert.strictEqual(await target.resolve('./other.json', 'sub/base.json'), '/p/sub/other.json');
    });

    it(`'./cfg' (directory) → directories are not accepted`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/cfg/tsconfig.json': '{}' }));
        await assertNotFound(t, target.resolve('./cfg', CONFIG), './cfg');
    });

    it(`'./' → not found`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/tsconfig.json': '{}' }));
        await assertNotFound(t, target.resolve('./', CONFIG), './');
    });

    it(`not found → the error has the absolute configPath`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({}));
        await t.assert.rejects(target.resolve('./missing', 'sub/base.json'), (err: any) => {
            t.assert.ok(err instanceof ExtendsNotFoundError);
            t.assert.strictEqual(err.specifier, './missing');
            t.assert.strictEqual(err.configPath, '/p/sub/base.json');
            return true;
        });
    });

    it(`errors other than "not found" are rethrown`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({}).fail('/p/base.json', 'EACCES'));
        await t.assert.rejects(target.resolve('./base.json', CONFIG), { code: 'EACCES' });
    });
});

describe('ExtendsResolver.resolve(specifier, configPath); → "." and ".."', () => {
    it(`'..' → the parent's "tsconfig.json"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/tsconfig.json': '{}' }));
        t.assert.strictEqual(await target.resolve('..', '/p/sub/base.json'), '/p/tsconfig.json');
    });

    it(`'..' → the "tsconfig" field of the parent's package.json`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/package.json': json({ tsconfig: './other.json' }),
            '/p/other.json': '{}',
            '/p/tsconfig.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('..', '/p/sub/base.json'), '/p/other.json');
    });

    it(`'.' → its own folder's "tsconfig.json"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/sub/tsconfig.json': '{}' }));
        t.assert.strictEqual(await target.resolve('.', '/p/sub/base.json'), '/p/sub/tsconfig.json');
    });

    it(`'..' → not found`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({}));
        await assertNotFound(t, target.resolve('..', CONFIG), '..');
    });
});

describe('ExtendsResolver.resolve(specifier, configPath); → packages', () => {
    it(`'@tsconfig/node22' → root "tsconfig.json"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/@tsconfig/node22/package.json': json({ name: '@tsconfig/node22' }),
            '/p/node_modules/@tsconfig/node22/tsconfig.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('@tsconfig/node22', CONFIG), '/p/node_modules/@tsconfig/node22/tsconfig.json');
    });

    it(`'pkg' → "node_modules/pkg.json" wins over the package folder`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg.json': '{}',
            '/p/node_modules/pkg/tsconfig.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', CONFIG), '/p/node_modules/pkg.json');
    });

    it(`'pkg' → "node_modules/pkg" file without extension is not accepted`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/node_modules/pkg': '{}' }));
        await assertNotFound(t, target.resolve('pkg', CONFIG), 'pkg');
    });

    it(`'pkg/sub' → directory with its own package.json "tsconfig" field`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/sub/package.json': json({ tsconfig: './f.json' }),
            '/p/node_modules/pkg/sub/f.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg/sub', CONFIG), '/p/node_modules/pkg/sub/f.json');
    });

    it(`'base.json' → a non-relative name is a package specifier`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/base.json': '{}' }));
        await assertNotFound(t, target.resolve('base.json', CONFIG), 'base.json');
    });

    it(`the lookup starts from the declaring file, not from cwd`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/sub/node_modules/pkg/tsconfig.json': '{}',
            '/p/node_modules/pkg/tsconfig.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', '/p/sub/base.json'), '/p/sub/node_modules/pkg/tsconfig.json');
    });

    it(`exports win over the "tsconfig" field and "node_modules/pkg.json"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg.json': '{}',
            '/p/node_modules/pkg/package.json': json({ tsconfig: './f.json', exports: './e.json' }),
            '/p/node_modules/pkg/e.json': '{}',
            '/p/node_modules/pkg/f.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', CONFIG), '/p/node_modules/pkg/e.json');
    });

    it(`exports use the tsc 7 conditions`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': json({
                exports: {
                    import: './i.json',
                    tsconfig: './t.json',
                    'types@<5': './old.json',
                    'types@>=7': './new.json',
                    default: './d.json'
                }
            }),
            '/p/node_modules/pkg/i.json': '{}',
            '/p/node_modules/pkg/t.json': '{}',
            '/p/node_modules/pkg/old.json': '{}',
            '/p/node_modules/pkg/new.json': '{}',
            '/p/node_modules/pkg/d.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', CONFIG), '/p/node_modules/pkg/new.json');
    });

    it(`symlinked package → the real path`, async (t: it.TestContext) => {
        const fileSystem = new FileSystemFake({ '/p/node_modules/pkg/tsconfig.json': '{}' })
            .link('/p/node_modules/pkg', '/real/pkg');

        const target = createResolver(fileSystem);
        t.assert.strictEqual(await target.resolve('pkg', CONFIG), '/real/pkg/tsconfig.json');
    });

    it(`not found → ExtendsNotFoundError`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({}));
        await assertNotFound(t, target.resolve('@tsconfig/node22', CONFIG), '@tsconfig/node22');
    });
});
