import type { StatsObject } from './stats.object.ts';

export interface FileSystemInject {
    readFile?(path: string, encoding: 'utf-8'): Promise<string>;
    realpath?(path: string): Promise<string>;
    stat?(path: string): Promise<StatsObject>;
}
