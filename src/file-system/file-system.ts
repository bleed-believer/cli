import type { FileSystemInject, FileSystemObject, StatsObject } from './interfaces/index.ts';

import { readFile, realpath, stat } from 'node:fs/promises';

/**
 * A wrapper of `node:fs/promises` where a path that doesn't exist (`ENOENT`, `ENOTDIR`)
 * is a `false`/`undefined` result. Any other error (like `EACCES`) is rethrown.
 */
export class FileSystem implements FileSystemObject {
    #injected: Required<FileSystemInject>;

    constructor(inject?: FileSystemInject) {
        this.#injected = {
            readFile:   inject?.readFile?.bind(inject)  ?? readFile,
            realpath:   inject?.realpath?.bind(inject)  ?? realpath,
            stat:       inject?.stat?.bind(inject)      ?? stat
        };
    }

    async #stat(path: string): Promise<StatsObject | undefined> {
        try {
            return await this.#injected.stat(path);
        } catch (err) {
            switch ((err as NodeJS.ErrnoException).code) {
                case 'ENOENT':
                case 'ENOTDIR':
                    return undefined;

                default:
                    throw err;
            }
        }
    }

    async readJsonObject(path: string): Promise<Record<string, unknown> | undefined> {
        if (!await this.isFile(path)) {
            return undefined;
        }

        let json: unknown;
        try {
            json = JSON.parse(await this.#injected.readFile(path, 'utf-8'));
        } catch (err) {
            if (err instanceof SyntaxError) {
                return undefined;
            }

            throw err;
        }

        return typeof json === 'object' && json !== null && !Array.isArray(json)
            ?   json as Record<string, unknown>
            :   undefined;
    }

    async isDirectory(path: string): Promise<boolean> {
        const stats = await this.#stat(path);
        return stats?.isDirectory() ?? false;
    }

    realpath(path: string): Promise<string> {
        return this.#injected.realpath(path);
    }

    async isFile(path: string): Promise<boolean> {
        const stats = await this.#stat(path);
        return stats?.isFile() ?? false;
    }
}
