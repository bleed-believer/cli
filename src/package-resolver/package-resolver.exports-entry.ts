import type { ExportsEntry } from './interfaces/index.ts';

import { comparePatternKeys } from './package-resolver.pattern-keys.ts';
import { matchPatternKey } from './package-resolver.match-pattern.ts';
import { isRecord } from './package-resolver.is-record.ts';

/**
 * Selects the `exports` target for a subpath, like tsc 7 does:
 * - The bare name uses `exports["."]`, or the whole `exports` when it's a string, an array
 *   or a conditions object (keys without `"."`).
 * - A subpath needs a map whose keys all start with `"."`: the exact key wins,
 *   otherwise the most specific pattern or folder mapping.
 * @param exports The `exports` field of the package.json.
 * @param subpath The subpath without `"./"` (empty for the bare name).
 * @returns The entry, or `undefined` when the subpath is not exported.
 */
export function selectExportsEntry(exports: unknown, subpath: string): ExportsEntry | undefined {
    const keys = isRecord(exports) ? Object.keys(exports) : [];
    const isSubpathMap = keys.length > 0 && keys.every(k => k.startsWith('.'));

    if (!subpath) {
        if (isRecord(exports) && Object.hasOwn(exports, '.')) {
            return { target: exports['.'], subpath: '', pattern: false };
        } else if (isSubpathMap) {
            return undefined;
        }

        return { target: exports, subpath: '', pattern: false };
    } else if (!isRecord(exports) || !isSubpathMap) {
        return undefined;
    }

    const key = `./${subpath}`;
    if (Object.hasOwn(exports, key)) {
        return { target: exports[key], subpath: '', pattern: false };
    }

    for (const patternKey of keys.sort(comparePatternKeys)) {
        const match = matchPatternKey(patternKey, key);
        if (typeof match === 'string') {
            return {
                target: exports[patternKey],
                subpath: match,
                pattern: patternKey.includes('*')
            };
        }
    }

    return undefined;
}
