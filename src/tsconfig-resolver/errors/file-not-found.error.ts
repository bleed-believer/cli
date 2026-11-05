/** Thrown by a `ProjectResolver` when the given path (or the "tsconfig.json" file inside it) doesn't exist. */
export class FileNotFoundError extends Error {
    /** The absolute path of the file that doesn't exist. */
    readonly path: string;

    /**
     * @param path The absolute path of the file that doesn't exist.
     * @param options The standard error options.
     */
    constructor(path: string, options?: ErrorOptions) {
        super(`The file "${path}" doesn't exist`, options);
        this.name = 'FileNotFoundError';
        this.path = path;
    }
}
