/** The rules of the consumer (like tsc) on top of the Node package resolution. */
export interface PackageResolverOptions {
    /**
     * Whether an `exports` condition is active. `"default"` is always active.
     * @param condition The condition key, like `"types"` or `"types@>=5.0"`.
     */
    isConditionActive(condition: string): boolean;

    /**
     * Loads a path of a package without `exports`: `node_modules/<name>[/<subpath>]`.
     * @param path The absolute path inside the package.
     * @returns The resolved file, or `undefined` when it can't be loaded.
     */
    loadWithoutExports(path: string): Promise<string | undefined>;
}
