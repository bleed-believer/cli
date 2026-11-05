/** A bare specifier split into its package name and subpath (`@s/pkg/a/b` → `@s/pkg` + `a/b`). */
export interface PackageSpecifier {
    name: string;
    /** The subpath without leading/trailing slashes. Empty for the bare package name. */
    subpath: string;
}
