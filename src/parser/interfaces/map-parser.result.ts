import type { MapParserOptions } from './map-parser.options.ts';

/**
 * The value returned by a `MapParser`: a record with the values returned
 * by its value parser. `undefined` is excluded, since those keys are omitted.
 * @typeParam O The options of the parser.
 */
export type MapParserResult<O extends MapParserOptions> = Record<
    string,
    Exclude<ReturnType<O['parser']['parse']>, undefined>
>;
