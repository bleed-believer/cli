import type { ObjectParserOptions, ObjectParserResult, ParserResult } from './interfaces/index.ts';

import { InvalidValueError, RequiredValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

export class ObjectParser<
    O extends ObjectParserOptions
> extends Parser<ObjectParserResult<O>, O> {
    #keys: O['keys'];

    constructor(options: O) {
        super(options);
        this.#keys = options.keys;
    }

    parse(input: unknown): ParserResult<ObjectParserResult<O>, O>;
    parse(input: unknown): ObjectParserResult<O> | undefined {
        switch (typeof input) {
            case 'undefined': {
                if (this.required) {
                    throw new RequiredValueError(this);
                } else {
                    return undefined;
                }
            }

            case 'object': {
                if (
                    input !== null &&
                    !Array.isArray(input) &&
                    !(input instanceof Date)
                ) {
                    const output: any = {};
                    for (const [ k, p ] of Object.entries(this.#keys)) {
                        const v = p.parse(
                            Object.hasOwn(input, k)
                            ?   (input as any)[k]
                            :   undefined
                        );

                        if (typeof v !== 'undefined') {
                            Object.defineProperty(output, k, {
                                value: v,
                                writable: true,
                                enumerable: true,
                                configurable: true
                            });
                        }
                    }

                    return output;
                }
            }

            default: {
                throw new InvalidValueError(this, 'an object', input);
            }
        }
    }
}