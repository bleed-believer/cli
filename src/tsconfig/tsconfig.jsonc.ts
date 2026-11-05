/**
 * Calls `onChar` for every character outside strings, and copies the strings as-is.
 * `onChar` returns how many characters it consumed and what to write instead.
 */
function scan(text: string, onChar: (index: number) => [ consumed: number, output: string ]): string {
    let output = '';
    let i = 0;
    while (i < text.length) {
        if (text[i] === '"') {
            const start = i++;
            while (i < text.length && text[i] !== '"') {
                i += text[i] === '\\' ? 2 : 1;
            }

            output += text.slice(start, ++i);
        } else {
            const [ consumed, replacement ] = onChar(i);
            output += replacement;
            i += consumed;
        }
    }

    return output;
}

/**
 * Parses a tsconfig file like tsc does: JSON with comments (`//`, `/* *\/`) and trailing commas.
 * Unlike JSON5, single quotes and unquoted keys are rejected. An empty file is `{}`.
 * @param text The content of the file.
 * @throws {SyntaxError} When the content is not valid.
 */
export function parseJsonc(text: string): unknown {
    const source = text.startsWith('﻿') ? text.slice(1) : text;
    const withoutComments = scan(source, i => {
        if (source.startsWith('//', i)) {
            const end = source.slice(i).search(/[\r\n]/);
            return [ end === -1 ? source.length - i : end, '' ];
        } else if (source.startsWith('/*', i)) {
            const end = source.indexOf('*/', i + 2);
            if (end === -1) {
                throw new SyntaxError('Unterminated comment in JSON');
            }

            return [ end + 2 - i, ' ' ];
        }

        return [ 1, source[i] ];
    });

    const withoutTrailingCommas = scan(withoutComments, i => (
        withoutComments[i] === ',' && /^\s*[}\]]/.test(withoutComments.slice(i + 1))
            ?   [ 1, '' ]
            :   [ 1, withoutComments[i] ]
    ));

    return withoutTrailingCommas.trim().length > 0
        ?   JSON.parse(withoutTrailingCommas)
        :   {};
}
