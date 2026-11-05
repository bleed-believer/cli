import type { TsconfigLayer } from './interfaces/index.ts';

/**
 * Merges a layer over another one, like tsc merges `extends`: every top-level key
 * (`include`, `exclude`) and every compiler option is replaced as a whole (`paths` too).
 * A `null` value is kept, so it unsets the option for the next layers.
 * @param base The inherited layer.
 * @param child The layer that overrides it.
 * @returns A new layer.
 */
export function mergeLayers(base: TsconfigLayer, child: TsconfigLayer): TsconfigLayer {
    const result: TsconfigLayer = { ...base, ...child };
    if (base.compilerOptions || child.compilerOptions) {
        result.compilerOptions = {
            ...base.compilerOptions,
            ...child.compilerOptions
        };
    }

    return result;
}
