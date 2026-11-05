import type { TsconfigOptions } from './tsconfig.options.ts';

/** A loaded tsconfig file, with its `extends` already merged. */
export interface TsconfigData extends TsconfigOptions {
    /** The absolute path of the tsconfig file. Every relative path option is relative to its folder. */
    path: string;
}
