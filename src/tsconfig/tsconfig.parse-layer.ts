import type { ParsedTsconfigLayer, TsconfigLayer } from './interfaces/index.ts';

import { InvalidValueError } from '../parser/index.ts';
import { tsconfigParser } from './tsconfig.parser.ts';
import { splitNulls } from './tsconfig.split-nulls.ts';
import { parseExtends } from './tsconfig.extends.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const toNulls = (keys: string[]) => Object.fromEntries(keys.map(k => [ k, null ]));

/**
 * Validates a tsconfig file on its own, keeping `null` as "unset the inherited option".
 * `"compilerOptions": null` is ignored, like tsc does.
 * @param raw The parsed JSON of the file.
 * @throws {InvalidValueError} When the root value is not an object.
 * @throws {InvalidExtendsError} When the `extends` value is invalid.
 * @throws Any error of `tsconfigParser` when a value is invalid.
 */
export function parseTsconfigLayer(raw: unknown): ParsedTsconfigLayer {
    if (!isPlainObject(raw)) {
        throw new InvalidValueError(tsconfigParser, 'an object', raw);
    }

    const { extends: extendsValue, compilerOptions, ...rest } = raw;
    const root = splitNulls(rest);
    const options = isPlainObject(compilerOptions)
        ?   splitNulls(compilerOptions)
        :   undefined;

    const parsed = tsconfigParser.parse({
        ...root.values,
        compilerOptions: compilerOptions === null
            ?   undefined
            :   options?.values ?? compilerOptions
    });

    const layer: TsconfigLayer = { ...parsed, ...toNulls(root.nulls) };
    if (options && options.nulls.length > 0) {
        layer.compilerOptions = { ...parsed.compilerOptions, ...toNulls(options.nulls) };
    }

    return { extends: parseExtends(extendsValue), layer };
}
