import type { ExtendsResolver, PathModule, ProjectResolver } from '../../tsconfig-resolver/index.ts';

export interface TsconfigInject {
    extendsResolver?: Pick<ExtendsResolver, 'resolve'>;
    projectResolver?: Pick<ProjectResolver, 'resolve'>;
    pathModule?: PathModule;

    readFile?(path: string, encoding: 'utf-8'): Promise<string>;
}
