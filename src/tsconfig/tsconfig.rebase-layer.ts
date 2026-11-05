import type { PathModule } from '../tsconfig-resolver/index.ts';
import type { TsconfigLayer } from './interfaces/index.ts';

import { hasConfigDirTemplate } from './tsconfig.has-config-dir-template.ts';
import { mapLayerPaths } from './tsconfig.map-layer-paths.ts';
import { rebasePath } from './tsconfig.rebase-path.ts';

/**
 * Rebases every path option of a layer (`include`, `exclude`, `paths` targets, `outDir`...)
 * from the folder of the file that declares them to another folder. The paths that start
 * with `${configDir}` are kept, they're substituted after the whole chain is merged.
 * @param layer The layer to rebase. It's not modified.
 * @param fromDir The absolute path of the folder of the file that declares the paths.
 * @param toDir The absolute path of the folder the paths must be relative to.
 * @param pathModule The `node:path` implementation.
 * @returns A new layer.
 */
export function rebaseLayer(layer: TsconfigLayer, fromDir: string, toDir: string, pathModule: PathModule): TsconfigLayer {
    return mapLayerPaths(layer, path =>
        hasConfigDirTemplate(path)
            ?   path
            :   rebasePath(path, fromDir, toDir, pathModule)
    );
}
