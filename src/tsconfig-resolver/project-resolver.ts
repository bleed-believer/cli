import type { ProjectResolverInject } from './interfaces/index.ts';

import { FileNotFoundError, ProjectNotFoundError } from './errors/index.ts';
import { FileSystem } from '../file-system/index.ts';

import pathModule from 'node:path';

/** Resolves the project's tsconfig file, like `tsc -p` does. */
export class ProjectResolver {
    #injected: Required<ProjectResolverInject>;

    constructor(inject?: ProjectResolverInject) {
        this.#injected = {
            fileSystem: inject?.fileSystem  ?? new FileSystem(),
            pathModule: inject?.pathModule  ?? pathModule,
            process:    inject?.process     ?? globalThis.process
        };
    }

    /** Without `-p`, tsc searches a "tsconfig.json" file upwards from cwd. */
    async #searchUpwards(cwd: string): Promise<string> {
        const { resolve, parse } = this.#injected.pathModule;

        let folder = cwd;
        while (true) {
            const path = resolve(folder, 'tsconfig.json');
            if (await this.#injected.fileSystem.isFile(path)) {
                return path;
            } else if (folder === parse(folder).root) {
                throw new ProjectNotFoundError(cwd);
            }

            folder = resolve(folder, '..');
        }
    }

    /**
     * With `-p`, a file is used as-is and a directory must contain a "tsconfig.json" file.
     * @param path The absolute path.
     */
    async #loadPath(path: string): Promise<string> {
        const { pathModule, fileSystem } = this.#injected;
        if (await fileSystem.isFile(path)) {
            return path;
        } else if (!await fileSystem.isDirectory(path)) {
            throw new FileNotFoundError(path);
        }

        const innerPath = pathModule.resolve(path, 'tsconfig.json');
        if (!await fileSystem.isFile(innerPath)) {
            throw new FileNotFoundError(innerPath);
        }

        return innerPath;
    }

    /**
     * @param path The project path (`-p`). When it's omitted, a "tsconfig.json" file is searched
     * upwards from the current working directory. When it's relative, it's resolved against
     * the current working directory.
     * @returns The absolute path of the tsconfig file.
     * @throws {ProjectNotFoundError} When no path was given and the upward search found nothing.
     * @throws {FileNotFoundError} When the given path (or its "tsconfig.json" file) doesn't exist.
     */
    resolve(path?: string): Promise<string> {
        const cwd = this.#injected.process.cwd();
        return typeof path === 'undefined'
            ?   this.#searchUpwards(cwd)
            :   this.#loadPath(this.#injected.pathModule.resolve(cwd, path));
    }
}
