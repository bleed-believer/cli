import type { TsconfigLayer } from './tsconfig.layer.ts';

/** A tsconfig file parsed on its own, before merging its `extends`. */
export interface ParsedTsconfigLayer {
    /** The `extends` specifiers, in the order they must be merged. */
    extends: string[];
    /** The values declared in the file (with `null` for the unset options). */
    layer: TsconfigLayer;
}
