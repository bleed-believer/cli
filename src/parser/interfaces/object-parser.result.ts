import type { ObjectParserOptions } from './object-parser.options.ts';

/**
 * The value returned by an `ObjectParser`: an object with the values
 * returned by the parser of each key.
 * @typeParam O The options of the parser.
 */
export type ObjectParserResult<O extends ObjectParserOptions> = {
    [K in keyof O['keys']]: ReturnType<O['keys'][K]['parse']>;
}