export interface ExportConditionsInject {
    /** Returns the TypeScript version used to match `types@<range>` conditions. */
    readTypescriptVersion?(): string;
}
