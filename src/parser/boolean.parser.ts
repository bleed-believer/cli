import type { ParserOptions, ParserResult } from './interfaces/index.ts';

import { RequiredValueError, InvalidValueError } from './errors/index.ts';
import { Parser } from './parser.ts';

export class BooleanParser<O extends ParserOptions> extends Parser<boolean, O> {
    parse(input: unknown): ParserResult<boolean, O>;
    parse(input: unknown): boolean | undefined {
        switch (typeof input) {
            case 'boolean': {
                return input;
            }

            case 'undefined': {
                if (this.required) {
                    throw new RequiredValueError(this);
                }

                return input;
            }

            default: {
                throw new InvalidValueError(this, 'of type boolean', input);
            }
        }
    }
}