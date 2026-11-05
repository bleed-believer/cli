import type { tsconfigParser } from '../tsconfig.parser.ts';

/** The values of a tsconfig file, validated by `tsconfigParser`. */
export type TsconfigOptions = ReturnType<(typeof tsconfigParser)['parse']>;
