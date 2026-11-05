/**
 * Matches a subpath against an expanding `exports` key: a pattern with one `*` (`"./cfg/*.json"`)
 * or a folder mapping (`"./cfg/"`).
 * @param key The `exports` key.
 * @param subpath The requested subpath, like `"./cfg/node.json"`.
 * @returns The text matched by `*` (or the rest after the folder), or `undefined` when it doesn't match.
 */
export function matchPatternKey(key: string, subpath: string): string | undefined {
    const parts = key.split('*');
    if (parts.length === 2) {
        const [ prefix, suffix ] = parts;
        if (
            subpath.startsWith(prefix) &&
            subpath.endsWith(suffix) &&
            subpath.length >= key.length - 1
        ) {
            return subpath.slice(prefix.length, subpath.length - suffix.length);
        }

    } else if (parts.length === 1 && key.endsWith('/') && subpath.startsWith(key)) {
        return subpath.slice(key.length);
    }

    return undefined;
}
