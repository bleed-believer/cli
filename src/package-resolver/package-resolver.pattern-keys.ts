/**
 * Sorts `exports` keys from the most specific to the least specific one, like tsc and Node do:
 * the longer base (the text until `*`) first, then exact keys, then the longer keys.
 */
export function comparePatternKeys(a: string, b: string): number {
    const aStar = a.indexOf('*');
    const bStar = b.indexOf('*');
    const aBase = aStar === -1 ? a.length : aStar + 1;
    const bBase = bStar === -1 ? b.length : bStar + 1;

    if (aBase !== bBase) {
        return bBase - aBase;
    } else if (aStar === -1) {
        return 1;
    } else if (bStar === -1) {
        return -1;
    }

    return b.length - a.length;
}
