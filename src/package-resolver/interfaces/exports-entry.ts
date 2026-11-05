/** The `exports` target selected for a subpath, before resolving its conditions. */
export interface ExportsEntry {
    /** The raw target: a string, an array of fallbacks, a conditions object or `null`. */
    target: unknown;
    /** The text that replaces `*` (patterns) or that is appended (folder mappings). */
    subpath: string;
    /** Whether the target comes from a `*` pattern key. */
    pattern: boolean;
}
