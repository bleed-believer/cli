import type { PackageResolverOptions } from './interfaces/index.ts';

import { describe, it } from 'node:test';
import pathModule from 'node:path/posix';

import { FileSystemFake } from '../file-system/file-system.fake.ts';
import { PackageResolver } from './package-resolver.ts';

const json = (value: unknown) => JSON.stringify(value);

/** Packages without exports: the file with ".json", otherwise "<dir>/index.json". */
function createResolver(fileSystem: FileSystemFake): PackageResolver {
    const options: PackageResolverOptions = {
        isConditionActive: condition => condition === 'require',
        loadWithoutExports: async path => {
            for (const candidate of [ `${path}.json`, `${path}/index.json` ]) {
                if (await fileSystem.isFile(candidate)) {
                    return candidate;
                }
            }
        }
    };

    return new PackageResolver(options, { pathModule, fileSystem });
}

describe('PackageResolver.resolve(specifier, fromDir); → packages without "exports"', () => {
    it(`delegates the bare name to loadWithoutExports`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/node_modules/pkg/index.json': '{}' }));
        t.assert.strictEqual(await target.resolve('pkg', '/p'), '/p/node_modules/pkg/index.json');
    });

    it(`delegates the subpath to loadWithoutExports`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/node_modules/@s/pkg/cfg/x.json': '{}' }));
        t.assert.strictEqual(await target.resolve('@s/pkg/cfg/x', '/p'), '/p/node_modules/@s/pkg/cfg/x.json');
    });

    it(`"exports": null → ignored`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': json({ exports: null }),
            '/p/node_modules/pkg/index.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', '/p'), '/p/node_modules/pkg/index.json');
    });
});

describe('PackageResolver.resolve(specifier, fromDir); → packages with "exports"', () => {
    it(`exports win over loadWithoutExports`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': json({ exports: { require: './r.json' } }),
            '/p/node_modules/pkg/r.json': '{}',
            '/p/node_modules/pkg/index.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', '/p'), '/p/node_modules/pkg/r.json');
    });

    it(`exported subpath`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': json({ exports: { './cfg/*': './c/*.json' } }),
            '/p/node_modules/pkg/c/node.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg/cfg/node', '/p'), '/p/node_modules/pkg/c/node.json');
    });
});

describe('PackageResolver.resolve(specifier, fromDir); → node_modules lookup', () => {
    it(`walks up through parent folders`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/node_modules/pkg/index.json': '{}' }));
        t.assert.strictEqual(await target.resolve('pkg', '/p/a/b'), '/node_modules/pkg/index.json');
    });

    it(`a nearer package without the file → keeps walking up`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': '{}',
            '/node_modules/pkg/index.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg', '/p'), '/node_modules/pkg/index.json');
    });

    it(`a nearer package with unexported subpath → keeps walking up`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({
            '/p/node_modules/pkg/package.json': json({ exports: { './x': './x.json' } }),
            '/p/node_modules/pkg/base.json': '{}',
            '/node_modules/pkg/base.json': '{}'
        }));

        t.assert.strictEqual(await target.resolve('pkg/base', '/p'), '/node_modules/pkg/base.json');
    });

    it(`doesn't search inside "node_modules/node_modules"`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({ '/p/node_modules/node_modules/pkg/index.json': '{}' }));
        t.assert.strictEqual(await target.resolve('pkg', '/p/node_modules'), undefined);
    });

    it(`returns the real path`, async (t: it.TestContext) => {
        const fileSystem = new FileSystemFake({ '/p/node_modules/pkg/index.json': '{}' })
            .link('/p/node_modules/pkg', '/real/pkg');

        const target = createResolver(fileSystem);
        t.assert.strictEqual(await target.resolve('pkg', '/p'), '/real/pkg/index.json');
    });

    it(`not found → undefined`, async (t: it.TestContext) => {
        const target = createResolver(new FileSystemFake({}));
        t.assert.strictEqual(await target.resolve('pkg', '/p'), undefined);
    });

    it(`file system errors are rethrown`, async (t: it.TestContext) => {
        const fileSystem = new FileSystemFake({ '/node_modules/pkg/index.json': '{}' })
            .fail('/p/node_modules/pkg/package.json', 'EACCES');

        const target = createResolver(fileSystem);
        await t.assert.rejects(target.resolve('pkg', '/p'), { code: 'EACCES' });
    });
});
