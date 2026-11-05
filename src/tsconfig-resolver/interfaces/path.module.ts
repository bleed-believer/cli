import type { ParsedPath } from 'node:path';

export interface PathModule {
    sep: string;
    parse(p: string): ParsedPath;
    resolve(...p: string[]): string;
    relative(from: string, to: string): string;
    normalize(p: string): string;
    isAbsolute(p: string): boolean;
}