import { InvalidVersionError } from './errors/index.ts';

const VERSION = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-z0-9-.]+))?(?:\+([a-z0-9-.]+))?$/i;

/** An immutable semver version (`major.minor.patch[-prerelease][+build]`). */
export class Version {
    /**
     * Parses a full semver version.
     * @param text The version, like `"7.0.2"` or `"7.1.0-beta.1"`.
     * @throws {InvalidVersionError} When the text is not a valid version.
     */
    static parse(text: string): Version {
        const version = Version.tryParse(text);
        if (!version) {
            throw new InvalidVersionError(text);
        }

        return version;
    }

    /**
     * Parses a full semver version.
     * @param text The version, like `"7.0.2"` or `"7.1.0-beta.1"`.
     * @returns The version, or `undefined` when the text is not a valid version.
     */
    static tryParse(text: string): Version | undefined {
        const match = VERSION.exec(text.trim());
        if (match) {
            return new Version(
                Number(match[1]),
                Number(match[2]),
                Number(match[3]),
                match[4]?.split('.') ?? [],
                match[5]?.split('.') ?? []
            );
        }
    }

    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    /** The prerelease identifiers (`"beta.1"` → `[ 'beta', '1' ]`). */
    readonly prerelease: readonly string[];
    /** The build metadata identifiers. They're ignored when comparing. */
    readonly build: readonly string[];

    constructor(
        major: number,
        minor: number,
        patch: number,
        prerelease: readonly string[] = [],
        build: readonly string[] = []
    ) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.prerelease = prerelease;
        this.build = build;
    }

    /**
     * Returns a new version with the given field incremented and the lower fields reset.
     * @param field The field to increment.
     */
    increment(field: 'major' | 'minor' | 'patch'): Version {
        switch (field) {
            case 'major': return new Version(this.major + 1, 0, 0);
            case 'minor': return new Version(this.major, this.minor + 1, 0);
            case 'patch': return new Version(this.major, this.minor, this.patch + 1);
        }
    }

    /**
     * Returns a new version with the given prerelease identifiers.
     * @param prerelease The prerelease identifiers.
     */
    withPrerelease(prerelease: readonly string[]): Version {
        return new Version(this.major, this.minor, this.patch, prerelease, this.build);
    }

    /**
     * Compares this version with another one, following the semver precedence rules.
     * @param other The version to compare with.
     * @returns `-1` when this version is lower, `1` when it's greater, `0` when both are equal.
     */
    compareTo(other: Version): -1 | 0 | 1 {
        const diff = (
            (this.major - other.major) ||
            (this.minor - other.minor) ||
            (this.patch - other.patch)
        );

        if (diff !== 0) {
            return diff < 0 ? -1 : 1;
        }

        // A version without prerelease has a higher precedence
        if (this.prerelease.length === 0 || other.prerelease.length === 0) {
            return sign(other.prerelease.length - this.prerelease.length);
        }

        const length = Math.min(this.prerelease.length, other.prerelease.length);
        for (let i = 0; i < length; i++) {
            const result = compareIdentifiers(this.prerelease[i], other.prerelease[i]);
            if (result !== 0) {
                return result;
            }
        }

        return sign(this.prerelease.length - other.prerelease.length);
    }

    toString(): string {
        let text = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length > 0) {
            text += `-${this.prerelease.join('.')}`;
        }

        if (this.build.length > 0) {
            text += `+${this.build.join('.')}`;
        }

        return text;
    }
}

function sign(value: number): -1 | 0 | 1 {
    return value < 0 ? -1 : value > 0 ? 1 : 0;
}

/** Numeric identifiers are compared numerically and have lower precedence than alphanumeric ones. */
function compareIdentifiers(a: string, b: string): -1 | 0 | 1 {
    const aIsNumber = /^\d+$/.test(a);
    const bIsNumber = /^\d+$/.test(b);
    if (aIsNumber && bIsNumber) {
        return sign(Number(a) - Number(b));
    } else if (aIsNumber) {
        return -1;
    } else if (bIsNumber) {
        return 1;
    }

    return a < b ? -1 : a > b ? 1 : 0;
}
