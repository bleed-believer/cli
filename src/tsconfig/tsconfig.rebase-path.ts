import type { PathModule } from '../tsconfig-resolver/index.ts';

/**
 * Converts a path relative to `fromDir` into the same path relative to `toDir`.
 * The result is normalized and always starts with `./` or `../` (with the platform separator).
 * Absolute paths are returned as-is.
 * @param path The path, relative to `fromDir`. It can contain glob patterns.
 * @param fromDir The absolute path of the folder the path is relative to.
 * @param toDir The absolute path of the folder the result must be relative to.
 * @param pathModule The `node:path` implementation.
 */
export function rebasePath(path: string, fromDir: string, toDir: string, pathModule: PathModule): string {
    const { isAbsolute, relative, resolve, sep } = pathModule;
    if (isAbsolute(path)) {
        return path;
    }

    const result = relative(toDir, resolve(fromDir, path));
    if (result === '') {
        return '.';
    } else if (result === '..' || result.startsWith(`..${sep}`)) {
        return result;
    }

    return `.${sep}${result}`;
}
