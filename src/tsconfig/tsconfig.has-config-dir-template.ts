/**
 * Checks whether a path starts with the `${configDir}` template. Like tsc, the
 * comparison ignores the case (but the substitution doesn't).
 * @param path The path option value.
 */
export function hasConfigDirTemplate(path: string): boolean {
    return path.toLowerCase().startsWith('${configdir}');
}
