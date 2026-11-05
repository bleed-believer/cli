import type { FileSystemObject } from './interfaces/index.ts';

/**
 * An in-memory `FileSystemObject`. Directories are inferred from the file paths,
 * so only POSIX absolute paths are supported.
 */
export class FileSystemFake implements FileSystemObject {
    #errors = new Map<string, string>();
    #links = new Map<string, string>();
    #files: Record<string, string>;

    /**
     * @param files The files (absolute path → content).
     */
    constructor(files: Record<string, string>) {
        this.#files = files;
    }

    #throwIfFails(path: string): void {
        const code = this.#errors.get(path);
        if (code) {
            const err = new Error(`${code}: ${path}`) as Error & { code: string; };
            err.code = code;
            throw err;
        }
    }

    async readJsonObject(path: string): Promise<Record<string, unknown> | undefined> {
        if (!await this.isFile(path)) {
            return undefined;
        }

        try {
            const json = JSON.parse(this.#files[path]);
            return typeof json === 'object' && json !== null && !Array.isArray(json)
                ?   json
                :   undefined;
        } catch {
            return undefined;
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        this.#throwIfFails(path);
        return Object
            .keys(this.#files)
            .some(x => x.startsWith(`${path}/`));
    }

    async realpath(path: string): Promise<string> {
        for (const [ link, real ] of this.#links) {
            if (path === link || path.startsWith(`${link}/`)) {
                return real + path.slice(link.length);
            }
        }

        return path;
    }

    async isFile(path: string): Promise<boolean> {
        this.#throwIfFails(path);
        return Object.hasOwn(this.#files, path);
    }

    /**
     * Makes every access to the path fail with the given error code.
     * @param path The absolute path.
     * @param code The error code, like `"EACCES"`.
     */
    fail(path: string, code: string): this {
        this.#errors.set(path, code);
        return this;
    }

    /**
     * Makes `realpath` replace the `link` prefix with `real`.
     * @param link The symlinked folder.
     * @param real Its real path.
     */
    link(link: string, real: string): this {
        this.#links.set(link, real);
        return this;
    }
}
