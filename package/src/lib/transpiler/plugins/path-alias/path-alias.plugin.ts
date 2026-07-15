import type { TranspilerPlugin, TsconfigObject, VisitorFunction } from '../../interfaces/index.ts';
import type { PathAliasPluginInject, PathAliasObject } from './path-alias.plugin.inject.ts';
import type { StringLiteral } from '@typescript/typescript6';

import { isStringLiteral, isImportDeclaration, isCallExpression, factory, SyntaxKind, isExportDeclaration } from '@typescript/typescript6';
import { PathAlias } from '../../../path-alias/index.ts';

export class PathAliasPlugin implements TranspilerPlugin {
    #pathAlias: PathAliasObject;
    #injected: Required<PathAliasPluginInject>;

    constructor(tsconfig: TsconfigObject, toJs: boolean, inject?: PathAliasPluginInject) {
        this.#injected = {
            pathAlias:  inject?.pathAlias ?? PathAlias
        };

        this.#pathAlias = new this.#injected.pathAlias(tsconfig, toJs);
    }

    readonly visitors: VisitorFunction[] = [
        node => {
            if (
                node.parent &&
                isStringLiteral(node) && (
                    isImportDeclaration(node.parent) ||
                    isExportDeclaration(node.parent)
                )
            ) {
                const path = node.getSourceFile().fileName;
                const spec = this.#pathAlias
                    .resolve(node.text, path)
                    .replaceAll('\\', '/');

                const resp = factory.createStringLiteral(spec, true);
                return {
                    node: resp,
                    shortCircuit: true
                };
            }
        },
        node => {
            if (
                isCallExpression(node) &&
                node.expression.kind === SyntaxKind.ImportKeyword &&
                isStringLiteral(node.arguments[0])
            ) {
                const text = (node.arguments[0] as StringLiteral).text;
                const path = node.getSourceFile().fileName;
                const spec = this.#pathAlias
                    .resolve(text, path)
                    .replaceAll('\\', '/');

                const resp = factory.updateCallExpression(
                    node, node.expression, node.typeArguments,
                    [ factory.createStringLiteral(spec, true) ]
                );
                return {
                    node: resp,
                    shortCircuit: true
                };
            }
        }
    ];
}