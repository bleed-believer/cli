import type { FileSystemObject } from '../../file-system/index.ts';
import type { PathModule } from './path.module.ts';

export interface ConfigLoaderInject {
    fileSystem?:    FileSystemObject;
    pathModule?:    PathModule;
}
