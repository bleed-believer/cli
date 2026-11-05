import type { FileSystemObject } from '../../file-system/index.ts';
import type path from 'node:path';

export interface PackageResolverInject {
    pathModule?: Pick<typeof path, 'resolve' | 'parse'>;
    fileSystem?: FileSystemObject;
}
