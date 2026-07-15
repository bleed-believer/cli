import type { TsconfigLoadInject } from './interfaces/index.ts';
import type { CompilerOptions } from '@typescript/typescript6';

import { readConfigFile, convertCompilerOptionsFromJson } from '@typescript/typescript6';
import { basename, dirname, normalize, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export class Tsconfig {
    #options: CompilerOptions;
    get options(): CompilerOptions {
        return this.#options;
    }

    #include: string[];
    get include(): string[] {
        return this.#include;
    }

    #exclude: string[];
    get exclude(): string[] {
        return this.#exclude;
    }

    #path: string;
    get path(): string {
        return this.#path;
    }

    static load(path: string, inject?: TsconfigLoadInject) {
        const injected: Required<TsconfigLoadInject> = {
            readConfigFile: inject?.readConfigFile?.bind(inject)    ?? readConfigFile,
            normalize:      inject?.normalize?.bind(inject)         ?? normalize,
            basename:       inject?.basename?.bind(inject)          ?? basename,
            resolve:        inject?.resolve?.bind(inject)           ?? resolve,
            dirname:        inject?.dirname?.bind(inject)           ?? dirname,
        }

        let json: any = {};
        const extend = [ path ];
        const include: string[] = [];
        const exclude: string[] = [];
        while (extend.length > 0) {
            const filePath = extend.pop()!;
            const { config, error } = injected.readConfigFile(
                filePath,
                p => readFileSync(p, 'utf-8')
            );

            if (error) {
                const mainError = new Error(error.messageText.toString());
                mainError.stack = error.source;
                throw mainError;
            }

            if (Array.isArray(config?.['extends'])) {
                extend.push(...config['extends'].map(x => injected.resolve(filePath, '..', x)));
                delete config['extends'];
            } else if (typeof config?.['extends'] === 'string') {
                extend.push(injected.resolve(filePath, '..', config['extends']));
                delete config['extends'];
            }
            
            if (Array.isArray(config?.['include'])) {
                include.unshift(...config['include'])
            }
            
            if (Array.isArray(config?.['exclude'])) {
                exclude.unshift(...config['exclude'])
            }

            json = {
                ...(config?.['compilerOptions'] ?? {}),
                ...(json)
            };
        }

        const { options, errors } = convertCompilerOptionsFromJson(
            json,
            injected.dirname(path),
            injected.basename(path),
        );

        if (errors.length > 0) {
            let mainError: Error | undefined;
            for (const error of errors.toReversed()) {
                const cause = mainError;
                mainError = new Error(error.messageText.toString(), { cause });
                mainError.stack = error.source;
            }

            throw mainError;
        }

        delete options.configFilePath;
        if (typeof options.outDir === 'string') {
            options.outDir = injected.normalize(options.outDir);
        }

        if (typeof options.rootDir === 'string') {
            options.rootDir = injected.normalize(options.rootDir);
        }

        if (Array.isArray(options.rootDirs)) {
            options.rootDirs = options.rootDirs.map(x => injected.normalize(x));
        }

        return new Tsconfig(
            injected.normalize(path),
            {
                options,
                include,
                exclude
            }
        );
    }

    constructor(
        path: string,
        json: {
            options?: CompilerOptions;
            include?: string[];
            exclude?: string[];
        }
    ) {
        this.#path = path;
        this.#include = json?.include ?? [];
        this.#exclude = json?.exclude ?? [];
        this.#options = json?.options ?? {};
    }
}