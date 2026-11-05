import type { TsconfigLayer } from './interfaces/index.ts';

type CompilerOptions = NonNullable<TsconfigLayer['compilerOptions']>;

/**
 * The options that tsc resolves relative to the file that declares them.
 * `mapRoot` and `sourceRoot` are not included: tsc emits them verbatim.
 */
const PATH_OPTIONS = [
    'outDir',
    'rootDir',
    'generateTrace',
    'declarationDir',
    'tsBuildInfoFile',
    'generateCpuProfile',
] as const satisfies (keyof CompilerOptions)[];

const PATH_LIST_OPTIONS = [
    'rootDirs',
    'typeRoots',
] as const satisfies (keyof CompilerOptions)[];

/**
 * Applies a transformation to every path option of a layer (`include`, `exclude`,
 * `paths` targets, `outDir`...). `null` values and the `paths` keys are kept.
 * @param layer The layer. It's not modified.
 * @param transform The transformation applied to each path.
 * @returns A new layer.
 */
export function mapLayerPaths(layer: TsconfigLayer, transform: (path: string) => string): TsconfigLayer {
    const mapList = <T>(list: T[]) => list.map(x => typeof x === 'string' ? transform(x) : x);

    const result: TsconfigLayer = { ...layer };
    if (layer.include) {
        result.include = mapList(layer.include);
    }

    if (layer.exclude) {
        result.exclude = mapList(layer.exclude);
    }

    if (layer.compilerOptions) {
        const options: CompilerOptions = { ...layer.compilerOptions };
        for (const key of PATH_OPTIONS) {
            const value = options[key];
            if (typeof value === 'string') {
                options[key] = transform(value);
            }
        }

        for (const key of PATH_LIST_OPTIONS) {
            const value = options[key];
            if (value) {
                options[key] = mapList(value);
            }
        }

        if (options.paths) {
            options.paths = Object.fromEntries(
                Object
                    .entries(options.paths)
                    .map(([ key, targets ]) => [ key, mapList(targets) ])
            );
        }

        result.compilerOptions = options;
    }

    return result;
}
