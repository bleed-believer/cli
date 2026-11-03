import { inspect } from 'node:util';

/**
 * Describes a received value the same way Node.js does in its
 * `ERR_INVALID_ARG_TYPE` messages.
 */
export function describeValue(value: unknown): string {
    if (value === null || value === undefined) {
        return String(value);
    }

    if (typeof value === 'function') {
        return value.name
        ?   `function ${value.name}`
        :   'an anonymous function';
    }

    if (typeof value === 'object') {
        const name = value.constructor?.name;
        return name
        ?   `an instance of ${name}`
        :   inspect(value, { depth: -1 });
    }

    let shown = inspect(value, { colors: false });
    if (shown.length > 28) {
        shown = `${shown.slice(0, 25)}...`;
    }

    return `type ${typeof value} (${shown})`;
}
