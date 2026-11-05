import type { PackageSpecifier } from './interfaces/index.ts';

/**
 * Splits a bare specifier into its package name and subpath.
 * @param specifier The specifier, using `/` as separator (like `"@tsconfig/node22"` or `"pkg/a/b"`).
 */
export function parsePackageSpecifier(specifier: string): PackageSpecifier {
    const parts = specifier.split('/');
    const length = specifier.startsWith('@') ? 2 : 1;

    return {
        name: parts.slice(0, length).join('/'),
        subpath: parts
            .slice(length)
            .filter(x => x.length > 0)
            .join('/')
    };
}
