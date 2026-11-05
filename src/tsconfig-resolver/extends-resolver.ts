import type { ExtendsResolverInject } from './interfaces/index.ts';

import { ExportConditions } from './extends-resolver.conditions.ts';
import { ConfigLoader } from './extends-resolver.config-loader.ts';
import { PackageResolver } from '../package-resolver/index.ts';
import { ExtendsNotFoundError } from './errors/index.ts';
import { FileSystem } from '../file-system/index.ts';

import pathModule from 'node:path';

/** Resolves the file referenced by the `extends` value of a tsconfig file, like tsc 7 does. */
export class ExtendsResolver {
    #packageResolver: PackageResolver;
    #configLoader: ConfigLoader;
    #injected: Required<Omit<ExtendsResolverInject, 'readTypescriptVersion'>>;

    constructor(inject?: ExtendsResolverInject) {
        this.#injected = {
            fileSystem: inject?.fileSystem  ?? new FileSystem(),
            pathModule: inject?.pathModule  ?? pathModule,
            process:    inject?.process     ?? globalThis.process
        };

        const conditions = new ExportConditions(inject);
        this.#configLoader = new ConfigLoader(this.#injected);
        this.#packageResolver = new PackageResolver(
            {
                isConditionActive: condition => conditions.isActive(condition),
                loadWithoutExports: path => this.#configLoader.load(path)
            },
            this.#injected
        );
    }

    /** The file as-is (even without extension), otherwise with ".json" appended. Directories aren't accepted. */
    async #loadFilePath(path: string): Promise<string | undefined> {
        const { fileSystem } = this.#injected;
        if (await fileSystem.isFile(path)) {
            return path;
        } else if (!path.endsWith('.json') && await fileSystem.isFile(`${path}.json`)) {
            return `${path}.json`;
        }
    }

    /** Relative (`./`, `../`) or absolute paths. Anything else goes through the module resolver. */
    #isFilePath(specifier: string): boolean {
        return (
            this.#injected.pathModule.isAbsolute(specifier) ||
            specifier.startsWith('./') ||
            specifier.startsWith('../')
        );
    }

    /**
     * @param specifier The `extends` value, as written in the tsconfig file.
     * @param configPath The path of the tsconfig file that declares the `extends`. Relative
     * specifiers and the `node_modules` lookup start from its directory.
     * @returns The absolute path of the extended tsconfig file.
     * @throws {ExtendsNotFoundError} When the specifier can't be resolved.
     */
    async resolve(specifier: string, configPath: string): Promise<string> {
        const { resolve, parse } = this.#injected.pathModule;
        const absoluteConfigPath = resolve(this.#injected.process.cwd(), configPath);
        const dir = parse(absoluteConfigPath).dir;

        // tsc accepts "\" as separator on every platform
        const normalized = specifier.replaceAll('\\', '/');
        const path = (
            this.#isFilePath(normalized)
                ?   await this.#loadFilePath(resolve(dir, normalized))
                :   normalized === '.' || normalized === '..'
                ?   await this.#configLoader.loadDirectory(resolve(dir, normalized))
                :   await this.#packageResolver.resolve(normalized, dir)
        );

        if (!path) {
            throw new ExtendsNotFoundError(specifier, absoluteConfigPath);
        }

        return path;
    }
}
