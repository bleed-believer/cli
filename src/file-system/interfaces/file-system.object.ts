/**
 * The file system operations used to resolve paths. A path that doesn't exist
 * is a `false`/`undefined` result instead of an error.
 */
export interface FileSystemObject {
    /** Reads a JSON file whose root is an object. `undefined` when it doesn't exist or it's not a valid JSON object. */
    readJsonObject(path: string): Promise<Record<string, unknown> | undefined>;
    isDirectory(path: string): Promise<boolean>;
    realpath(path: string): Promise<string>;
    isFile(path: string): Promise<boolean>;
}
