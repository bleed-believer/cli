import type { PackageResolverInject, PackageResolverOptions } from './interfaces/index.ts';

import { ExportsTargetResolver } from './package-resolver.exports-target.ts';
import { selectExportsEntry } from './package-resolver.exports-entry.ts';
import { parsePackageSpecifier } from './package-resolver.specifier.ts';
import { FileSystem } from '../file-system/index.ts';

import pathModule from 'node:path';

/**
 * Resolves bare specifiers (`pkg`, `@scope/pkg/sub`) through the `node_modules` folders,
 * using the package `exports` when they exist, like tsc 7 does.
 */
export class PackageResolver {
    #exportsTarget: ExportsTargetResolver;
    #injected: Required<PackageResolverInject>;
    #options: PackageResolverOptions;

    /**
     * @param options The rules of the consumer: active conditions and how to load packages without `exports`.
     * @param inject The dependencies.
     */
    constructor(options: PackageResolverOptions, inject?: PackageResolverInject) {
        this.#options = options;
        this.#injected = {
            pathModule: inject?.pathModule ?? pathModule,
            fileSystem: inject?.fileSystem ?? new FileSystem()
        };

        this.#exportsTarget = new ExportsTargetResolver(
            condition => options.isConditionActive(condition),
            this.#injected
        );
    }

    async #resolveFromPackage(packageDir: string, subpath: string): Promise<string | undefined> {
        const { pathModule, fileSystem } = this.#injected;
        const packageJson = await fileSystem.readJsonObject(pathModule.resolve(packageDir, 'package.json'));

        // The "exports" field wins over everything else
        if (packageJson?.exports != null) {
            const entry = selectExportsEntry(packageJson.exports, subpath);
            return entry && this.#exportsTarget.resolve(packageDir, entry);
        }

        return this.#options.loadWithoutExports(
            subpath
                ?   pathModule.resolve(packageDir, subpath)
                :   packageDir
        );
    }

    /**
     * Searches the package from `fromDir` upwards. When a nearer package can't resolve the
     * specifier, the search keeps going through the parent `node_modules` folders.
     * @param specifier The bare specifier, using `/` as separator.
     * @param fromDir The absolute path of the folder where the search starts.
     * @returns The real path (symlinks resolved) of the file, or `undefined` when it's not found.
     */
    async resolve(specifier: string, fromDir: string): Promise<string | undefined> {
        const { resolve, parse } = this.#injected.pathModule;
        const { name, subpath } = parsePackageSpecifier(specifier);

        let folder = fromDir;
        while (true) {
            // "node_modules/node_modules" is never searched
            if (parse(folder).base !== 'node_modules') {
                const packageDir = resolve(folder, 'node_modules', name);
                const path = await this.#resolveFromPackage(packageDir, subpath);
                if (path) {
                    return this.#injected.fileSystem.realpath(path);
                }
            }

            if (folder === parse(folder).root) {
                return undefined;
            }

            folder = resolve(folder, '..');
        }
    }
}
