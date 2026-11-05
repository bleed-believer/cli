import { InvalidVersionRangeError } from './errors/index.ts';
import { Version } from './version.ts';

type Operator = '<' | '<=' | '>' | '>=' | '=';
type Comparator = readonly [ Operator, Version ];

const PARTIAL = /^v?(\*|x|0|[1-9]\d*)(?:\.(\*|x|0|[1-9]\d*)(?:\.(\*|x|0|[1-9]\d*)(?:-([a-z0-9-.]+))?(?:\+([a-z0-9-.]+))?)?)?$/i;
const HYPHEN = /^\s*([a-z0-9-+.*]+)\s+-\s+([a-z0-9-+.*]+)\s*$/i;
const COMPARATOR = /^(~|\^|<|<=|>|>=|=)?\s*([a-z0-9-+.*]+)$/i;

interface PartialVersion {
    /** The version with every wildcard replaced by `0`. */
    version: Version;
    major: string;
    minor: string;
    patch: string;
}

/**
 * A semver range, with the same grammar and semantics as TypeScript's `VersionRange`:
 * alternatives (`||`), hyphen ranges (`1 - 2`), `~`, `^`, comparison operators
 * and partial/wildcard versions (`7`, `7.0`, `7.x`, `*`).
 */
export class VersionRange {
    /**
     * Parses a semver range.
     * @param text The range, like `">=5.0"` or `"^6 || ^7"`.
     * @throws {InvalidVersionRangeError} When the text is not a valid range.
     */
    static parse(text: string): VersionRange {
        const range = VersionRange.tryParse(text);
        if (!range) {
            throw new InvalidVersionRangeError(text);
        }

        return range;
    }

    /**
     * Parses a semver range.
     * @param text The range, like `">=5.0"` or `"^6 || ^7"`.
     * @returns The range, or `undefined` when the text is not a valid range.
     */
    static tryParse(text: string): VersionRange | undefined {
        const alternatives: Comparator[][] = [];
        for (const raw of text.trim().split(/\s*\|\|\s*/)) {
            const comparators = parseHyphen(raw) ?? parseComparators(raw);
            if (!comparators) {
                return undefined;
            }

            alternatives.push(comparators);
        }

        return new VersionRange(text, alternatives);
    }

    /** The original text of the range. */
    readonly text: string;
    #alternatives: readonly (readonly Comparator[])[];

    private constructor(text: string, alternatives: readonly (readonly Comparator[])[]) {
        this.text = text;
        this.#alternatives = alternatives;
    }

    /**
     * Checks whether a version satisfies this range.
     * @param version The version to test, as a `Version` or as text.
     * @throws {InvalidVersionError} When the version is given as text and it's invalid.
     */
    test(version: Version | string): boolean {
        const target = typeof version === 'string'
            ?   Version.parse(version)
            :   version;

        return this.#alternatives.some(comparators =>
            comparators.every(([ operator, operand ]) => compare(operator, target, operand))
        );
    }

    toString(): string {
        return this.text;
    }
}

function isWildcard(part: string): boolean {
    return part === '*' || part === 'x' || part === 'X';
}

function parsePartial(text: string): PartialVersion | undefined {
    const match = PARTIAL.exec(text);
    if (!match) {
        return undefined;
    }

    const [ , major, minor = '*', patch = '*', prerelease, build ] = match;
    const version = new Version(
        isWildcard(major) ? 0 : Number(major),
        isWildcard(major) || isWildcard(minor) ? 0 : Number(minor),
        isWildcard(major) || isWildcard(minor) || isWildcard(patch) ? 0 : Number(patch),
        prerelease?.split('.') ?? [],
        build?.split('.') ?? []
    );

    return { version, major, minor, patch };
}

/** `left - right`: inclusive on both sides, partial right sides are expanded. */
function parseHyphen(text: string): Comparator[] | undefined {
    const match = HYPHEN.exec(text);
    if (!match) {
        return undefined;
    }

    const left = parsePartial(match[1]);
    const right = parsePartial(match[2]);
    if (!left || !right) {
        return undefined;
    }

    const comparators: Comparator[] = [];
    if (!isWildcard(left.major)) {
        comparators.push([ '>=', left.version ]);
    }

    if (!isWildcard(right.major)) {
        comparators.push(
            isWildcard(right.minor) ? [ '<', right.version.increment('major') ] :
            isWildcard(right.patch) ? [ '<', right.version.increment('minor') ] :
            [ '<=', right.version ]
        );
    }

    return comparators;
}

/** Space-separated comparators, all of them must match. */
function parseComparators(text: string): Comparator[] | undefined {
    const comparators: Comparator[] = [];
    for (const simple of text.split(/\s+/).filter(x => x.length > 0)) {
        const match = COMPARATOR.exec(simple);
        const partial = match && parsePartial(match[2]);
        if (!match || !partial) {
            return undefined;
        }

        comparators.push(...expandComparator(match[1], partial));
    }

    return comparators;
}

function expandComparator(operator: string | undefined, partial: PartialVersion): Comparator[] {
    const { version, major, minor, patch } = partial;
    if (isWildcard(major)) {
        // "*", "x" → any version
        return [];
    }

    const lowest = [ '0' ];
    switch (operator) {
        case '~':
            return [
                [ '>=', version ],
                [ '<', version.increment(isWildcard(minor) ? 'major' : 'minor') ]
            ];

        case '^':
            return [
                [ '>=', version ],
                [ '<', version.increment(
                    version.major > 0 || isWildcard(minor) ? 'major' :
                    version.minor > 0 || isWildcard(patch) ? 'minor' :
                    'patch'
                ) ]
            ];

        case '<':
        case '>=':
            return [ [
                operator,
                isWildcard(minor) || isWildcard(patch) ? version.withPrerelease(lowest) : version
            ] ];

        case '<=':
        case '>':
            return [
                isWildcard(minor) ? [ operator === '<=' ? '<' : '>=', version.increment('major').withPrerelease(lowest) ] :
                isWildcard(patch) ? [ operator === '<=' ? '<' : '>=', version.increment('minor').withPrerelease(lowest) ] :
                [ operator, version ]
            ];

        default:
            if (isWildcard(minor) || isWildcard(patch)) {
                return [
                    [ '>=', version.withPrerelease(lowest) ],
                    [ '<', version.increment(isWildcard(minor) ? 'major' : 'minor').withPrerelease(lowest) ]
                ];
            }

            return [ [ '=', version ] ];
    }
}

function compare(operator: Operator, a: Version, b: Version): boolean {
    const result = a.compareTo(b);
    switch (operator) {
        case '<':   return result < 0;
        case '<=':  return result <= 0;
        case '>':   return result > 0;
        case '>=':  return result >= 0;
        case '=':   return result === 0;
    }
}
