import type { ExportsEntry, PackageResolverInject } from './interfaces/index.ts';

import { isRecord } from './package-resolver.is-record.ts';
import { FileSystem } from '../file-system/index.ts';

import pathModule from 'node:path';

/** Path segments that an `exports` target (or the text replacing `*`) can't contain. */
const INVALID_SEGMENTS = [ '.', '..', 'node_modules' ];

/**
 * Resolves an `exports` target to an existing file: strings, arrays of fallbacks
 * and (nested) conditions objects, where the first one that resolves wins.
 */
export class ExportsTargetResolver {
    #isConditionActive: (condition: string) => boolean;
    #injected: Required<PackageResolverInject>;

    /**
     * @param isConditionActive Whether a condition is active. `"default"` is always active.
     * @param inject The dependencies.
     */
    constructor(isConditionActive: (condition: string) => boolean, inject?: PackageResolverInject) {
        this.#isConditionActive = isConditionActive;
        this.#injected = {
            pathModule: inject?.pathModule ?? pathModule,
            fileSystem: inject?.fileSystem ?? new FileSystem()
        };
    }

    /** Builds the absolute path of a string target, or `undefined` when the target is invalid. */
    #buildPath(packageDir: string, target: string, entry: ExportsEntry): string | undefined {
        const { subpath, pattern } = entry;
        if (!target.startsWith('./')) {
            return undefined;
        } else if (!pattern && subpath && !target.endsWith('/')) {
            // A folder mapping must point to a folder
            return undefined;
        }

        const segments = [ ...target.split('/').slice(1), ...subpath.split('/') ];
        if (segments.some(x => INVALID_SEGMENTS.includes(x))) {
            return undefined;
        }

        return this.#injected.pathModule.resolve(
            packageDir,
            pattern
                ?   target.replaceAll('*', subpath)
                :   target + subpath
        );
    }

    /**
     * @param packageDir The absolute path of the package folder.
     * @param entry The entry selected from `exports`.
     * @returns The existing file, or `undefined` when no target resolves.
     */
    async resolve(packageDir: string, entry: ExportsEntry): Promise<string | undefined> {
        const { target } = entry;
        if (typeof target === 'string') {
            const path = this.#buildPath(packageDir, target, entry);
            return path && await this.#injected.fileSystem.isFile(path)
                ?   path
                :   undefined;
        }

        const candidates = Array.isArray(target)
            ?   target
            :   isRecord(target)
            ?   Object
                    .entries(target)
                    .filter(([ condition ]) => condition === 'default' || this.#isConditionActive(condition))
                    .map(([ , value ]) => value)
            :   [];

        for (const candidate of candidates) {
            const path = await this.resolve(packageDir, { ...entry, target: candidate });
            if (path) {
                return path;
            }
        }

        return undefined;
    }
}
