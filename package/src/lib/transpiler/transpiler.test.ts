import type { TsconfigObject, TranspilerInject, TranspilerPlugin } from './interfaces/index.ts';
import type { ResolutionMode, StringLiteral } from '@typescript/typescript6';

import { factory, isCallExpression, isImportDeclaration, isStringLiteral } from '@typescript/typescript6';
import { ModuleKind, ModuleResolutionKind, ScriptTarget, SyntaxKind } from '@typescript/typescript6';
import { resolve, dirname, parse, sep } from 'node:path/posix';
import { Transpiler } from './transpiler.ts';
import { test } from 'node:test';

test('Use a simple visitor', async (t: test.TestContext) => {
    const tsconfig: TsconfigObject = {
        path: '/path/to/project/tsconfig.json',
        options: {
            moduleResolution: ModuleResolutionKind.Node16,
            module: ModuleKind.Node16,
            target: ScriptTarget.ES2025,
            strict: true,

            rootDir: '/path/to/project/src',
            outDir: '/path/to/project/dist',
            paths: {
                '@lib/*':   [ './src/lib/*' ],
                '@/*':      [ './src/*' ],
            }
        }
    };

    const inject: TranspilerInject = {
        resolve, dirname, parse, sep,
        async readFile(path) {
            switch (path) {
                case '/path/to/project/src/index.ts': {
                    return [
                        `import { Foo, Bar } from '@lib/util.ts';`,
                        `import * as kek from '@lib/kek.ts';`,
                        `import iei from '@lib/iei.ts';`,
                        `const joder = await import('@lib/joder.ts');`,
                        `const chaval = 'jajaja';`,
                        `const foo = new Foo();`,
                        `const bar = new Bar();`,
                        `const kekFoo: string = kek.foo();`,
                        `const kekBar: string = kek.bar();`,
                        `iei();`,
                    ].join('\n');
                }

                default: {
                    throw new Error(`The file "${path}" doesn't exists`);
                }
            }
        },

        getImpliedNodeFormatForFile(): ResolutionMode {
            return ModuleKind.ESNext;
        }
    };

    const pluginDeMierda: TranspilerPlugin = {
        visitors: [
            node => {
                if (
                    isStringLiteral(node) &&
                    isImportDeclaration(node.parent)
                ) {
                    return factory.createStringLiteral(
                        '#jaja/' + node.text,
                        true
                    );
                }
            },
            node => {
                if (
                    isCallExpression(node) &&
                    node.expression.kind === SyntaxKind.ImportKeyword &&
                    isStringLiteral(node.arguments[0])
                ) {
                    const text = (node.arguments[0] as StringLiteral).text;
                    return factory.updateCallExpression(
                        node, node.expression, node.typeArguments,
                        [
                            factory.createStringLiteral(
                                `#jaja/${text}`,
                                true
                            )
                        ]
                    )
                }
            }
        ]
    }

    const transpiler = new Transpiler(tsconfig, [ pluginDeMierda ], inject);
    const result = await transpiler.transpile('/path/to/project/src/index.ts');
    t.assert.strictEqual(
        result.code,
        [
            `import { Foo, Bar } from '#jaja/@lib/util.ts';`,
            `import * as kek from '#jaja/@lib/kek.ts';`,
            `import iei from '#jaja/@lib/iei.ts';`,
            `const joder = await import('#jaja/@lib/joder.ts');`,
            `const chaval = 'jajaja';`,
            `const foo = new Foo();`,
            `const bar = new Bar();`,
            `const kekFoo = kek.foo();`,
            `const kekBar = kek.bar();`,
            `iei();\n`,
        ].join('\n')
    );
});