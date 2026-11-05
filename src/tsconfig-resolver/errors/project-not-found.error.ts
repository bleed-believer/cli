/**
 * Thrown by a `ProjectResolver` when no path was given and no "tsconfig.json" file
 * was found in the current working directory or any of its parent directories.
 */
export class ProjectNotFoundError extends Error {
    /** The absolute path of the directory where the upward search started. */
    readonly cwd: string;

    /**
     * @param cwd The absolute path of the directory where the upward search started.
     * @param options The standard error options.
     */
    constructor(cwd: string, options?: ErrorOptions) {
        super(`No "tsconfig.json" file was found in "${cwd}" or any of its parent directories`, options);
        this.name = 'ProjectNotFoundError';
        this.cwd = cwd;
    }
}
