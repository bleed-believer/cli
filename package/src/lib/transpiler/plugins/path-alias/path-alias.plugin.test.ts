import type { TsconfigObject, TranspilerInject } from '../../interfaces/index.ts';

import { resolve, dirname, parse, sep, relative } from 'node:path/posix';
import { ModuleKind, ModuleResolutionKind } from '@typescript/typescript6';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PathAliasPlugin } from './path-alias.plugin.ts';
import { Transpiler } from '../../transpiler.ts';
import { PathAlias } from '../../../path-alias/index.ts';

const files: Record<string, string> = {
    '/path/to/project/src/data-source.ts': [
        `import { DataSource } from 'typeorm';`,
        `import { resolve } from 'node:path';`,
        ``,
        `export const dataSource = new DataSource({`,
        `   type: 'sqlite3',`,
        `   database: resolve(import.meta.dirname, '../../database.db'),`,
        `   entities: resolve(import.meta.dirname, './entities/*.{ts,js}')`,
        `});`,
    ].join('\n'),

    '/path/to/project/src/entities/person.ts': [
        `import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm';`,
        ``,
        `@Entity({ name: 'Person' })`,
        `export class Person {`,
        `   @PrimaryGeneratedColumn({ type: 'int' })`,
        `   id!: number;`,
        ``,
        `   @Column({ type: 'varchar' })`,
        `   name!: string;`,
        ``,
        `   @Column({ type: 'boolean' })`,
        `   sick!: boolean;`,
        `}`,
    ].join('\n'),

    '/path/to/project/src/lib/elphis/interfaces/person-like.ts': [
        `export interface PersonLike {`,
        `    name: string;`,
        `}`,
    ].join('\n'),

    '/path/to/project/src/lib/elphis/interfaces/index.ts': [
        `export type { PersonLike } from './person-like.js';`,
    ].join('\n'),

    '/path/to/project/src/lib/elphis/elphis.ts': [
        `import type { PersonLike } from './interfaces/index.ts';`,
        `import { dataSource } from '@/data-source.ts';`,
        `import { Person } from '@entities/person.ts';`,
        ``,
        `export class Elphis {`,
        `    async applyInjection(target: string | PersonLike): Promise<boolean> {`,
        `        const person = await dataSource.findOneBy(Person, {`,
        `            name: typeof target !== 'string'`,
        `            ?   target.name`,
        `            :   target`,
        `        });`,
        ``,
        `        if (!person) {`,
        `            return false;`,
        `        }`,
        ``,
        `        person.sick = false;`,
        `        await dataSource.save(person);`,
        `        return true;`,
        `    }`,
        `}`,
    ].join('\n')
}

const transpilerInject: TranspilerInject = {
    resolve, dirname, parse,
    async readFile(path: string) {
        if (typeof files[path] !== 'string') {
            throw new Error(`The file "${path}" doesn't exists`);
        }

        return files[path];
    },
    getImpliedNodeFormatForFile() {
        return ModuleKind.ESNext;
    }
};

const tsconfig: TsconfigObject = {
    path: '/path/to/project/tsconfig.json',
    options: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        moduleResolution: ModuleResolutionKind.Node16,
        module: ModuleKind.Node20,
        strict: true,

        rootDir: '/path/to/project/src',
        outDir: '/path/to/project/dist',
        paths: {
            '@entities/*':  [ 'src/entities/*' ],
            '@lib/*':       [ 'src/lib/*' ],
            '@/*':          [ 'src/*' ],
        }
    }
};

class FakePathAlias extends PathAlias {
    constructor(tsconfig: TsconfigObject, toJs: boolean) {
        super(tsconfig, toJs, {
            sep, dirname, resolve, relative,
            accessSync: path => {
                if (typeof files[path] !== 'string') {
                    throw new Error(`The file "${path}" doesn't exists`);
                }
            },
            fileURLToPath: href => fileURLToPath(href, { windows: false }),

        });
    }
}

describe(`Transpile to "rootDir"`, () => {
    const transpiler = new Transpiler(
        tsconfig,
        [ new PathAliasPlugin(tsconfig, false, { pathAlias: FakePathAlias }) ],
        transpilerInject
    );

    test(`Transpile '/path/to/project/src/data-source.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/data-source.ts');
        t.assert.strictEqual(
            code,
            [
                `import { DataSource } from 'typeorm';`,
                `import { resolve } from 'node:path';`,
                `export const dataSource = new DataSource({`,
                `    type: 'sqlite3',`,
                `    database: resolve(import.meta.dirname, '../../database.db'),`,
                `    entities: resolve(import.meta.dirname, './entities/*.{ts,js}')`,
                `});\n`,
            ].join('\n')
        );
    });

    test(`Transpile '/path/to/project/src/lib/elphis/interfaces/person-like.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/interfaces/person-like.ts');
        t.assert.strictEqual(code, `export {};\n`);
    });

    test(`Transpile '/path/to/project/src/lib/elphis/interfaces/index.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/interfaces/index.ts');
        t.assert.strictEqual(code, `export {};\n`);
    });

    test(`Transpile '/path/to/project/src/lib/elphis/elphis.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/elphis.ts');
        t.assert.strictEqual(
            code,
            [
                `import { dataSource } from './../../data-source.ts';`,
                `import { Person } from './../../entities/person.ts';`,
                `export class Elphis {`,
                `    async applyInjection(target) {`,
                `        const person = await dataSource.findOneBy(Person, {`,
                `            name: typeof target !== 'string'`,
                `                ? target.name`,
                `                : target`,
                `        });`,
                `        if (!person) {`,
                `            return false;`,
                `        }`,
                `        person.sick = false;`,
                `        await dataSource.save(person);`,
                `        return true;`,
                `    }`,
                `}\n`,
            ].join('\n')
        );
    });
});

describe(`Transpile to "outDir"`, () => {
    const transpiler = new Transpiler(
        tsconfig,
        [ new PathAliasPlugin(tsconfig, true, { pathAlias: FakePathAlias }) ],
        transpilerInject
    );

    test(`Transpile '/path/to/project/src/data-source.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/data-source.ts');
        t.assert.strictEqual(
            code,
            [
                `import { DataSource } from 'typeorm';`,
                `import { resolve } from 'node:path';`,
                `export const dataSource = new DataSource({`,
                `    type: 'sqlite3',`,
                `    database: resolve(import.meta.dirname, '../../database.db'),`,
                `    entities: resolve(import.meta.dirname, './entities/*.{ts,js}')`,
                `});\n`,
            ].join('\n')
        );
    });

    test(`Transpile '/path/to/project/src/lib/elphis/interfaces/person-like.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/interfaces/person-like.ts');
        t.assert.strictEqual(code, `export {};\n`);
    });

    test(`Transpile '/path/to/project/src/lib/elphis/interfaces/index.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/interfaces/index.ts');
        t.assert.strictEqual(code, `export {};\n`);
    });

    test(`Transpile '/path/to/project/src/lib/elphis/elphis.ts'`, async (t: test.TestContext) => {
        const { code } = await transpiler.transpile('/path/to/project/src/lib/elphis/elphis.ts');
        t.assert.strictEqual(
            code,
            [
                `import { dataSource } from './../../data-source.js';`,
                `import { Person } from './../../entities/person.js';`,
                `export class Elphis {`,
                `    async applyInjection(target) {`,
                `        const person = await dataSource.findOneBy(Person, {`,
                `            name: typeof target !== 'string'`,
                `                ? target.name`,
                `                : target`,
                `        });`,
                `        if (!person) {`,
                `            return false;`,
                `        }`,
                `        person.sick = false;`,
                `        await dataSource.save(person);`,
                `        return true;`,
                `    }`,
                `}\n`,
            ].join('\n')
        );
    });
});