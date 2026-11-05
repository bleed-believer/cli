/** Thrown by `VersionRange.parse` when the text is not a valid semver range. */
export class InvalidVersionRangeError extends Error {
    /** The text that was rejected. */
    readonly text: string;

    /**
     * @param text The text that was rejected.
     */
    constructor(text: string) {
        super(`"${text}" is not a valid version range`);
        this.name = 'InvalidVersionRangeError';
        this.text = text;
    }
}
