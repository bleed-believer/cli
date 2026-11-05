import type { TsconfigOptions } from './tsconfig.options.ts';

type CompilerOptions = NonNullable<TsconfigOptions['compilerOptions']>;
type Nullable<T> = { [K in keyof T]?: T[K] | null; };

/**
 * A tsconfig file while its `extends` are being merged. A `null` value unsets
 * the inherited option, and it's removed once every layer is merged.
 */
export interface TsconfigLayer extends Nullable<Omit<TsconfigOptions, 'compilerOptions'>> {
    compilerOptions?: Nullable<CompilerOptions>;
}
