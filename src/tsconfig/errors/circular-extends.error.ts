/** Thrown by `Tsconfig.load` when the `extends` chain of a tsconfig file is circular. */
export class CircularExtendsError extends Error {
    /** The absolute paths of the chain, ending with the repeated file. */
    readonly chain: readonly string[];

    /**
     * @param chain The absolute paths of the chain, ending with the repeated file.
     */
    constructor(chain: readonly string[]) {
        super(`Circular "extends" detected: ${chain.map(x => `"${x}"`).join(' → ')}`);
        this.name = 'CircularExtendsError';
        this.chain = chain;
    }
}
