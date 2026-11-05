/** Thrown by `Version.parse` when the text is not a valid semver version. */
export class InvalidVersionError extends Error {
    /** The text that was rejected. */
    readonly text: string;

    /**
     * @param text The text that was rejected.
     */
    constructor(text: string) {
        super(`"${text}" is not a valid version`);
        this.name = 'InvalidVersionError';
        this.text = text;
    }
}
