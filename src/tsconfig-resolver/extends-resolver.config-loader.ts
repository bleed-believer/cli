import type { ConfigLoaderInject } from './interfaces/index.ts';

import { FileSystem } from '../file-system/index.ts';

import pathModule from 'node:path';

/**
 * tsc's rules to load a tsconfig file from a path that the module resolver produced:
 * a path inside a package without `exports`, or the `"."`/`".."` directories.
 */
export class ConfigLoader {
    #injected: Required<ConfigLoaderInject>;

    constructor(inject?: ConfigLoaderInject) {
        this.#injected = {
            fileSystem: inject?.fileSystem ?? new FileSystem(),
            pathModule: inject?.pathModule ?? pathModule
        };
    }

    async #loadIndex(dir: string): Promise<string | undefined> {
        const path = this.#injected.pathModule.resolve(dir, 'tsconfig.json');
        if (await this.#injected.fileSystem.isFile(path)) {
            return path;
        }
    }

    /**
     * The file pointed by the `tsconfig` field of its package.json (when it can be loaded),
     * otherwise its "tsconfig.json" file.
     * @param dir The absolute path of the directory.
     */
    async loadDirectory(dir: string): Promise<string | undefined> {
        const { pathModule, fileSystem } = this.#injected;
        const packageJson = await fileSystem.readJsonObject(pathModule.resolve(dir, 'package.json'));

        if (typeof packageJson?.tsconfig === 'string') {
            const path = pathModule.resolve(dir, packageJson.tsconfig);
            const loaded = await this.loadFile(path) ?? await this.#loadIndex(path);
            if (loaded) {
                return loaded;
            }
        }

        return this.#loadIndex(dir);
    }

    /**
     * The path as-is only when it ends with ".json", otherwise with ".json" appended.
     * @param path The absolute path of the file.
     */
    async loadFile(path: string): Promise<string | undefined> {
        const { fileSystem } = this.#injected;
        if (path.endsWith('.json') && await fileSystem.isFile(path)) {
            return path;
        } else if (await fileSystem.isFile(`${path}.json`)) {
            return `${path}.json`;
        }
    }

    /**
     * The path as a file, otherwise as a directory.
     * @param path The absolute path.
     */
    async load(path: string): Promise<string | undefined> {
        return await this.loadFile(path) ?? await this.loadDirectory(path);
    }
}
