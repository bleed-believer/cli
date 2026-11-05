import type { PathModule } from '../tsconfig-resolver/index.ts';
import type { TsconfigLayer } from './interfaces/index.ts';

import { hasConfigDirTemplate } from './tsconfig.has-config-dir-template.ts';
import { mapLayerPaths } from './tsconfig.map-layer-paths.ts';
import { rebasePath } from './tsconfig.rebase-path.ts';

/**
 * Replaces the leading `${configDir}` of every path option with the folder of the loaded
 * file (not the file that declares it), like tsc does. Only the exact `${configDir}` text
 * is replaced, but every path that starts with it (ignoring the case) is resolved
 * relative to the loaded file.
 * @param layer The fully merged layer. It's not modified.
 * @param dir The absolute path of the folder of the loaded file.
 * @param pathModule The `node:path` implementation.
 * @returns A new layer.
 */
export function substituteConfigDir(layer: TsconfigLayer, dir: string, pathModule: PathModule): TsconfigLayer {
    return mapLayerPaths(layer, path =>
        hasConfigDirTemplate(path)
            ?   rebasePath(path.replace('${configDir}', './'), dir, dir, pathModule)
            :   path
    );
}
