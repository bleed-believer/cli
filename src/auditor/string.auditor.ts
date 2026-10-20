import type { AuditorResult } from './interfaces/index.ts';

import { Auditor } from './auditor.ts';
import { AuditorError } from './auditor.error.ts';

export class StringAuditor<R extends boolean> extends Auditor<string, R> {
    audit(input: unknown): AuditorResult<string, R>;
    audit(input: unknown): string | undefined {
        if (typeof input === 'string') {
            return input;
        } else if (input == null && !this.required) {
            return undefined;
        } else {
            throw new AuditorError(input, 'string');
        }
    }
}