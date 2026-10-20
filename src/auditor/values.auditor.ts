import type { AuditorResult } from './interfaces/index.ts';

import { Auditor } from './auditor.ts';
import { AuditorError } from './auditor.error.ts';

export class ValuesAuditor<const T, R extends boolean> extends Auditor<T, R> {
    #values: T[];

    constructor(required: R, values: T[]) {
        super(required);
        this.#values = values;
    }

    audit(input: unknown): AuditorResult<T, R>;
    audit(input: unknown): T | undefined {
        if (this.#values.includes(input as T)) {
            return input as T;

        } else if (input == null && !this.required) {
            return undefined;

        } else {
            throw new AuditorError(input, 'specified values');

        }
    }
}