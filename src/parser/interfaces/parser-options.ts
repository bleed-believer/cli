/** Options shared by every parser. */
export interface ParserOptions {
    /**
     * If `true`, parsing `undefined` throws a `RequiredValueError`.
     * @default false
     */
    required?: boolean;
}