import type { ExportConditionsInject } from './export-conditions.inject.ts';
import type { ConfigLoaderInject } from './config-loader.inject.ts';
import type { Process } from './process.ts';

export interface ExtendsResolverInject extends ConfigLoaderInject, ExportConditionsInject {
    process?: Process;
}
