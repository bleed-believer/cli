/** Thrown by `Tsconfig.load` when a tsconfig file has invalid syntax or invalid values. */
export class InvalidTsconfigError extends Error {
    /** The absolute path of the invalid tsconfig file. */
    readonly path: string;

    /**
     * @param path The absolute path of the invalid tsconfig file.
     * @param cause The original error (syntax or validation).
     */
    constructor(path: string, cause: unknown) {
        super(`The tsconfig file "${path}" is invalid`, { cause });
        this.name = 'InvalidTsconfigError';
        this.path = path;
    }
}
