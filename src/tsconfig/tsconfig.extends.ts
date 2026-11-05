import { InvalidExtendsError } from './errors/index.ts';

/**
 * Validates the `extends` value of a tsconfig file.
 * @param value The raw value: `undefined`, a string or an array of strings.
 * @returns The specifiers, in the order they must be merged.
 * @throws {InvalidExtendsError} When the value (or an item) is not a non-empty string.
 */
export function parseExtends(value: unknown): string[] {
    if (typeof value === 'undefined') {
        return [];
    }

    const specifiers = Array.isArray(value) ? value : [ value ];
    if (specifiers.some(x => typeof x !== 'string' || x.length === 0)) {
        throw new InvalidExtendsError(value);
    }

    return specifiers;
}
