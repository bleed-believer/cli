import type { ObjectParserOptions } from './object-parser.options.ts';

export type ObjectParserResult<O extends ObjectParserOptions> = {
    [K in keyof O['keys']]: ReturnType<O['keys'][K]['parse']>;
}