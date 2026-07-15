import type { TsconfigLoadInject } from './interfaces/index.ts';
import type { Diagnostic } from '@typescript/typescript6';

import { DiagnosticCategory, ModuleKind, ModuleResolutionKind, ScriptTarget } from '@typescript/typescript6';
import { resolve, normalize, basename, dirname } from 'node:path/posix';
import { Tsconfig } from './tsconfig.ts';
import { test } from 'node:test';

class Inject implements TsconfigLoadInject {
    #files: Record<string, Record<string, any>>;

    constructor(files: Record<string, Record<string, any>>) {
        this.#files = files;
    }

    normalize(path: string): string {
        return normalize(path);
    }

    basename(path: string): string {
        return basename(path);
    }

    resolve(...parts: string[]): string {
        return resolve(...parts);
    }

    dirname(path: string): string {
        return dirname(path);
    }

    readConfigFile(path: string): { config?: any; error?: Diagnostic; } {
        const resolvedPath = resolve(path);
        const config = Object
            .entries(this.#files)
            .find(([ k ]) => resolvedPath === this.resolve(k))
            ?.[1];

        let error: Diagnostic | undefined;
        if (!config) {
            error = {
                code: 666,
                file: undefined,
                start: undefined,
                length: 666,
                category: DiagnosticCategory.Error,
                messageText: 'Cannot read file',
            };
        }
        
        return { config, error };
    }
}

test('Find tsconfig with extends', (t: test.TestContext) => {
    const inject = new Inject({
        '/path/to/project/tsconfig.build.json': {
            extends: './tsconfig.json',
            compilerOptions: {
                sourceMap: false
            },
            exclude: [
                '**/*.test.ts'
            ]
        },
        '/path/to/project/tsconfig.json': {
            compilerOptions: {
                target: 'es2024',
                module: 'NODE20',
                moduleResolution: 'Node16',
                
                strict: true,
                noEmit: true,
                outDir: './dist',
                rootDir: './src',
                sourceMap: true,
                resolveJsonModule: true,
                verbatimModuleSyntax: true,
                allowImportingTsExtensions: true
            },
            exclude: [
                'dist/**'
            ]
        }
    });

    const tsconfig = Tsconfig.load(
        '/path/to/project/tsconfig.build.json',
        inject
    );

    t.assert.deepStrictEqual(tsconfig.exclude, [
        'dist/**',
        '**/*.test.ts'
    ]);

    t.assert.deepStrictEqual(tsconfig.options, {
        target: ScriptTarget.ES2024,
        module: ModuleKind.Node20,
        moduleResolution: ModuleResolutionKind.Node16,
        strict: true,
        noEmit: true,
        outDir: normalize('/path/to/project/dist'),
        rootDir: normalize('/path/to/project/src'),
        sourceMap: false,
        resolveJsonModule: true,
        verbatimModuleSyntax: true,
        allowImportingTsExtensions: true,
        // configFilePath: 'tsconfig.build.json'
    });
});