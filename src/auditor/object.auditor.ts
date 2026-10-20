import type { AuditorResult } from './interfaces/index.ts';

import { Auditor } from './auditor.ts';
import { AuditorError } from './auditor.error.ts';

export interface ObjectAuditorEntries {
    [K: string]: Auditor<unknown, boolean>;
}

export type ObjectAuditorValue<T extends ObjectAuditorEntries> = {
    [K in keyof T]: ReturnType<T[K]['audit']>;
}

function isObjectLiteral(input: unknown): input is Record<string, unknown> {
    if (input == null || typeof input !== 'object') {
        return false;
    }

    const proto = Object.getPrototypeOf(input);
    return proto === Object.prototype || proto === null;
}

export class ObjectAuditor<
    E extends ObjectAuditorEntries,
    V extends ObjectAuditorValue<E>,
    R extends boolean
> extends Auditor<V, R> {
    #entries: E;
    get entries(): E {
        return this.#entries;
    }

    constructor(required: R, entries: E) {
        super(required);
        this.#entries = entries;
    }

    audit(input: unknown): AuditorResult<V, R>;
    audit(input: unknown): V | undefined {
        if (isObjectLiteral(input)) {
            const o: Record<any, any> = {};
            Object
                .entries(this.#entries)
                .forEach(([ k, a ]) => {
                    o[k] = a.audit(Object.hasOwn(input, k) ? input[k] : undefined);
                });

            return o as V;

        } else if (input == null && !this.required) {
            return undefined;

        } else {
            throw new AuditorError(input, 'object literal');

        }
    }
}