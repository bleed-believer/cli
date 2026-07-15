import type { TranspilerInject, TranspilerOutput, TranspilerPlugin, TsconfigObject, VisitorResult } from './interfaces/index.ts';
import type { TransformationContext, SourceFile, Visitor, Transformer } from '@typescript/typescript6';

import { getImpliedNodeFormatForFile, sys, ModuleKind, ModuleResolutionKind } from '@typescript/typescript6';
import { visitEachChild, transpileModule, JSDocParsingMode, visitNode } from '@typescript/typescript6';
import { dirname, parse, resolve, sep } from 'node:path';
import { TranspilerError } from './transpiler.error.ts';
import { PathAlias } from '../path-alias/index.ts';
import { readFile } from 'node:fs/promises';

export class Transpiler {
    #injected: Required<TranspilerInject>;
    #tsconfig: TsconfigObject;
    #plugins: TranspilerPlugin[];

    #rootDir: string;
    #outDir: string;

    constructor(
        tsconfig: TsconfigObject,
        plugins?: TranspilerPlugin[] | undefined,
        inject?: TranspilerInject | undefined
    ) {
        this.#tsconfig = tsconfig;
        this.#plugins = plugins ?? [];
        this.#injected = {
            getImpliedNodeFormatForFile: (
                inject?.getImpliedNodeFormatForFile?.bind(inject) ??
                getImpliedNodeFormatForFile
            ),

            readFile:   inject?.readFile?.bind(inject)  ?? readFile,
            resolve:    inject?.resolve?.bind(inject)   ?? resolve,
            dirname:    inject?.dirname?.bind(inject)   ?? dirname,
            parse:      inject?.parse?.bind(inject)     ?? parse,
            sep:        inject?.sep                     ?? sep
        };

        const cwd = this.#injected.dirname(tsconfig.path);
        this.#rootDir = (tsconfig.options.rootDir ?? cwd) + this.#injected.sep;
        this.#outDir = (tsconfig.options.outDir ?? cwd) + this.#injected.sep;
    }

    #transformer(context: TransformationContext): Transformer<SourceFile> {
        // The native visitor
        return sourceFile => {
            // My custom visitor mechanism
            for (const plugin of this.#plugins) {
                for (const visitorFn of plugin.visitors) {
                    const visitor: Visitor = node => {
                        const resp = visitorFn(node) as VisitorResult;
                        if (resp?.shortCircuit === true) {
                            return resp.node;
                        } else if (resp?.shortCircuit === false) {
                            node = resp.node ?? node;
                        } else if (resp) {
                            return resp as unknown as typeof node;
                        }
    
                        return visitEachChild(node, visitor, context);
                    };
    
                    sourceFile = visitNode(sourceFile, visitor) as SourceFile;
                }
            }

            return sourceFile;
        };
    }

    async transpile(path: string): Promise<TranspilerOutput> {
        const moduleKind = this.#injected.getImpliedNodeFormatForFile(
            path, undefined, sys,
            this.#tsconfig.options
        ) ?? this.#tsconfig.options.module;

        const source = await this.#injected.readFile(path, 'utf-8');
        const { outputText, sourceMapText, diagnostics } = transpileModule(source, {
            compilerOptions: {
                ...this.#tsconfig.options,
                moduleResolution: moduleKind === ModuleKind.ESNext
                ?   ModuleResolutionKind.Bundler
                :   this.#tsconfig.options.moduleResolution,
                module: moduleKind
            },
            transformers: {
                before: [ this.#transformer.bind(this)  ]
            },
            reportDiagnostics: true,
            jsDocParsingMode: JSDocParsingMode.ParseAll,
            moduleName: this.#injected.parse(path).name,
            fileName: path
        });

        const [ except ] = diagnostics ?? [];
        if (except) {
            throw new TranspilerError(except);
        }

        let outPath = PathAlias.toJsExt(path);
        if (outPath.startsWith(this.#rootDir)) {
            outPath = this.#outDir + outPath.slice(this.#rootDir.length);
        }

        return {
            path: outPath,
            code: outputText,
            map: sourceMapText
        };
    }
}