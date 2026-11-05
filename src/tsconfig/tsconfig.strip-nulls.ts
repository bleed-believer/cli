import type { TsconfigLayer, TsconfigOptions } from './interfaces/index.ts';

function withoutNulls<T extends object>(record: T): T {
    return Object.fromEntries(
        Object
            .entries(record)
            .filter(([ , value ]) => value !== null)
    ) as T;
}

/**
 * Removes the `null` values (unset options) of a fully merged layer.
 * @param layer The merged layer.
 * @returns The final options.
 */
export function stripNulls(layer: TsconfigLayer): TsconfigOptions {
    const result = withoutNulls(layer);
    if (result.compilerOptions) {
        result.compilerOptions = withoutNulls(result.compilerOptions);
    }

    return result as TsconfigOptions;
}
