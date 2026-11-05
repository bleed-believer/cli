import type { FileSystemObject } from '../../file-system/index.ts';
import type { PathModule } from './path.module.ts';
import type { Process } from './process.ts';

export interface ProjectResolverInject {
    fileSystem?:    FileSystemObject;
    pathModule?:    PathModule;
    process?:       Process;
}
