import type { ParsedTsconfigLayer, TsconfigData, TsconfigInject, TsconfigLayer } from './interfaces/index.ts';

import { CircularExtendsError, InvalidTsconfigError } from './errors/index.ts';
import { ExtendsResolver, ProjectResolver } from '../tsconfig-resolver/index.ts';
import { substituteConfigDir } from './tsconfig.substitute-config-dir.ts';
import { parseTsconfigLayer } from './tsconfig.parse-layer.ts';
import { rebaseLayer } from './tsconfig.rebase-layer.ts';
import { mergeLayers } from './tsconfig.merge-layers.ts';
import { stripNulls } from './tsconfig.strip-nulls.ts';
import { parseJsonc } from './tsconfig.jsonc.ts';

import { readFile } from 'node:fs/promises';
import pathModule from 'node:path';

/** Loads a tsconfig file like tsc 7 does: validated, and with its `extends` merged. */
export class Tsconfig {
    #injected: Required<TsconfigInject>;

    constructor(inject?: TsconfigInject) {
        this.#injected = {
            extendsResolver:    inject?.extendsResolver         ?? new ExtendsResolver(),
            projectResolver:    inject?.projectResolver         ?? new ProjectResolver(),
            pathModule:         inject?.pathModule              ?? pathModule,
            readFile:           inject?.readFile?.bind(inject)  ?? readFile
        };
    }

    async #readLayer(path: string): Promise<ParsedTsconfigLayer> {
        const text = await this.#injected.readFile(path, 'utf-8');
        try {
            return parseTsconfigLayer(parseJsonc(text));
        } catch (cause) {
            throw new InvalidTsconfigError(path, cause);
        }
    }

    /**
     * Loads a file and merges its `extends` (in order) under its own values.
     * Every path option of the result is relative to the folder of `path`.
     * @param path The absolute path of the file.
     * @param chain The files that extend this one, to detect cycles.
     */
    async #loadLayer(path: string, chain: readonly string[]): Promise<TsconfigLayer> {
        if (chain.includes(path)) {
            throw new CircularExtendsError([ ...chain, path ]);
        }

        const { pathModule, extendsResolver } = this.#injected;
        const { extends: specifiers, layer } = await this.#readLayer(path);
        const dir = pathModule.parse(path).dir;

        let result: TsconfigLayer = {};
        for (const specifier of specifiers) {
            const basePath = await extendsResolver.resolve(specifier, path);
            const base = await this.#loadLayer(basePath, [ ...chain, path ]);
            result = mergeLayers(result, rebaseLayer(base, pathModule.parse(basePath).dir, dir, pathModule));
        }

        return mergeLayers(result, rebaseLayer(layer, dir, dir, pathModule));
    }

    /**
     * @param path The project path (like `tsc -p`). When it's omitted, a "tsconfig.json"
     * file is searched upwards from the current working directory.
     * @returns The merged options. Every relative path option is normalized and
     * relative to the folder of the loaded file, including the ones that start with `${configDir}`.
     * @throws {ProjectNotFoundError} When no path was given and no "tsconfig.json" file was found.
     * @throws {FileNotFoundError} When the given path doesn't exist.
     * @throws {ExtendsNotFoundError} When an `extends` value can't be resolved.
     * @throws {CircularExtendsError} When the `extends` chain is circular.
     * @throws {InvalidTsconfigError} When a file has invalid syntax or invalid values.
     */
    async load(path?: string): Promise<TsconfigData> {
        const { projectResolver, pathModule } = this.#injected;
        const tsconfigPath = await projectResolver.resolve(path);
        const layer = await this.#loadLayer(tsconfigPath, []);
        const substituted = substituteConfigDir(layer, pathModule.parse(tsconfigPath).dir, pathModule);
        return { ...stripNulls(substituted), path: tsconfigPath };
    }
}
