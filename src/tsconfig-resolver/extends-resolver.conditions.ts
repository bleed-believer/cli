import type { ExportConditionsInject } from './interfaces/index.ts';

import { Version, VersionRange } from '../semver/index.ts';

import { createRequire } from 'node:module';

/** The conditions that tsc 7 enables for `extends` (`"default"` is always active). */
const CONDITIONS = [ 'types', 'require', 'node' ];

/** Decides which package `exports` conditions tsc 7 uses when it resolves `extends`. */
export class ExportConditions {
    #typescriptVersion: Version | undefined;
    #injected: Required<ExportConditionsInject>;

    constructor(inject?: ExportConditionsInject) {
        this.#injected = {
            readTypescriptVersion: inject?.readTypescriptVersion?.bind(inject) ?? (
                () => createRequire(import.meta.url)('typescript/package.json').version
            )
        };
    }

    /** `types@<range>` is active when the installed TypeScript version satisfies the range. */
    #isVersionedTypes(condition: string): boolean {
        if (!condition.startsWith('types@')) {
            return false;
        }

        const range = VersionRange.tryParse(condition.slice('types@'.length));
        if (!range) {
            return false;
        }

        this.#typescriptVersion ??= Version.parse(this.#injected.readTypescriptVersion());
        return range.test(this.#typescriptVersion);
    }

    /**
     * @param condition The condition key, like `"types"`, `"import"` or `"types@>=5.0"`.
     */
    isActive(condition: string): boolean {
        return CONDITIONS.includes(condition) || this.#isVersionedTypes(condition);
    }
}
