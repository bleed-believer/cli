import type { AuditorResult } from './interfaces/index.ts';

import { AuditorError } from './auditor.error.ts';
import { Auditor } from './auditor.ts';

export class BooleanAuditor<R extends boolean> extends Auditor<boolean, R> {

    audit(input: unknown): AuditorResult<boolean, R>;
    audit(input: unknown): boolean | undefined {
        if (typeof input === 'boolean') {
            return input;
        } else if (input == null && !this.required) {
            return undefined;
        } else {
            throw new AuditorError(input, 'boolean');
        }
    }
}