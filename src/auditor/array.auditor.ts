import type { AuditorResult } from './interfaces/index.ts';

import { AuditorError } from './auditor.error.ts';
import { Auditor } from './auditor.ts';

export class ArrayAuditor<T, R extends boolean> extends Auditor<T[], R> {
    #items: Auditor<T, boolean>;

    constructor(required: R, items: Auditor<T, boolean>) {
        super(required);
        this.#items = items;
    }

    audit(input: unknown): AuditorResult<T[], R>;
    audit(input: unknown): T[] | undefined {
        if (Array.isArray(input)) {
            return Array.from(input, x => this.#items.audit(x) as T);

        } else if (input == null && !this.required) {
            return undefined;

        } else {
            throw new AuditorError(input, 'array');

        }
    }
}