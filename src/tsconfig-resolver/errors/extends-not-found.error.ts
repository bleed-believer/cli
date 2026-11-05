/** Thrown by an `ExtendsResolver` when the `extends` value of a tsconfig file can't be resolved. */
export class ExtendsNotFoundError extends Error {
    /** The absolute path of the tsconfig file that declares the `extends`. */
    readonly configPath: string;
    /** The `extends` value, as written in the tsconfig file. */
    readonly specifier: string;

    /**
     * @param specifier The `extends` value, as written in the tsconfig file.
     * @param configPath The absolute path of the tsconfig file that declares the `extends`.
     */
    constructor(specifier: string, configPath: string) {
        super(`Cannot resolve the "extends" value "${specifier}" declared in "${configPath}"`);
        this.name = 'ExtendsNotFoundError';
        this.configPath = configPath;
        this.specifier = specifier;
    }
}
