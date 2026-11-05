/**
 * Separates the `null` values of an object (unset options for tsc) from the rest.
 * @param record The object to split.
 * @returns The object without the `null` values, and the keys that had them.
 */
export function splitNulls(record: Record<string, unknown>): { values: Record<string, unknown>; nulls: string[]; } {
    const values: Record<string, unknown> = {};
    const nulls: string[] = [];
    for (const [ key, value ] of Object.entries(record)) {
        if (value === null) {
            nulls.push(key);
        } else {
            values[key] = value;
        }
    }

    return { values, nulls };
}
