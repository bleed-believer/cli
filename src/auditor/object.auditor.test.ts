import { describe, it } from 'node:test';
import { AuditorError } from './auditor.error.ts';
import { ArrayAuditor } from './array.auditor.ts';
import { ObjectAuditor } from './object.auditor.ts';
import { StringAuditor } from './string.auditor.ts';
import { BooleanAuditor } from './boolean.auditor.ts';

describe('ObjectAuditor', () => {
    describe('required = true', () => {
        const auditor = new ObjectAuditor(true, {
            name:       new StringAuditor(true),
            active:     new BooleanAuditor(true),
        });

        it(`Audit { name: 'joder', active: true } → { name: 'joder', active: true }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder', active: true });
            t.assert.deepStrictEqual(v, { name: 'joder', active: true });
        });

        it(`Audit { name: 'joder', active: true, extra: 1 } → { name: 'joder', active: true }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder', active: true, extra: 1 });
            t.assert.deepStrictEqual(v, { name: 'joder', active: true });
        });

        it(`Audit { name: 'joder', active: 'true' } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ name: 'joder', active: 'true' });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit { name: 'joder' } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ name: 'joder' });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit {} → error`, (t: it.TestContext) => {
            try {
                auditor.audit({});
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit [] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'joder' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('joder');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new Date() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new Date());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new Map() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new Map());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new (class Foo { name = 'joder'; active = true; })() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new (class Foo { name = 'joder'; active = true; })());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit null → error`, (t: it.TestContext) => {
            try {
                auditor.audit(null);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit undefined → error`, (t: it.TestContext) => {
            try {
                auditor.audit(undefined);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('required = false', () => {
        const auditor = new ObjectAuditor(false, {
            name:       new StringAuditor(true),
            active:     new BooleanAuditor(true),
        });

        it(`Audit { name: 'joder', active: true } → { name: 'joder', active: true }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder', active: true });
            t.assert.deepStrictEqual(v, { name: 'joder', active: true });
        });

        it(`Audit { name: 'joder' } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ name: 'joder' });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit [] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'joder' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('joder');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new Date() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new Date());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new Map() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new Map());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit new (class Foo { name = 'joder'; active = true; })() → error`, (t: it.TestContext) => {
            try {
                auditor.audit(new (class Foo { name = 'joder'; active = true; })());
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit null → undefined`, (t: it.TestContext) => {
            const v = auditor.audit(null);
            t.assert.strictEqual(v, undefined);
        });

        it(`Audit undefined → undefined`, (t: it.TestContext) => {
            const v = auditor.audit(undefined);
            t.assert.strictEqual(v, undefined);
        });
    });

    describe('optional entries', () => {
        const auditor = new ObjectAuditor(true, {
            name:       new StringAuditor(true),
            nickname:   new StringAuditor(false),
        });

        it(`Audit { name: 'joder', nickname: 'jj' } → { name: 'joder', nickname: 'jj' }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder', nickname: 'jj' });
            t.assert.deepStrictEqual(v, { name: 'joder', nickname: 'jj' });
        });

        it(`Audit { name: 'joder' } → { name: 'joder', nickname: undefined }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder' });
            t.assert.deepStrictEqual(v, { name: 'joder', nickname: undefined });
        });

        it(`Audit { name: 'joder', nickname: null } → { name: 'joder', nickname: undefined }`, (t: it.TestContext) => {
            const v = auditor.audit({ name: 'joder', nickname: null });
            t.assert.deepStrictEqual(v, { name: 'joder', nickname: undefined });
        });

        it(`Audit { name: 'joder', nickname: 1 } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ name: 'joder', nickname: 1 });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('nested auditors', () => {
        const auditor = new ObjectAuditor(true, {
            user: new ObjectAuditor(true, {
                name:   new StringAuditor(true),
            }),
            tags: new ArrayAuditor(true, new StringAuditor(true)),
        });

        it(`Audit { user: { name: 'joder' }, tags: ['a'] } → { user: { name: 'joder' }, tags: ['a'] }`, (t: it.TestContext) => {
            const v = auditor.audit({ user: { name: 'joder' }, tags: [ 'a' ] });
            t.assert.deepStrictEqual(v, { user: { name: 'joder' }, tags: [ 'a' ] });
        });

        it(`Audit { user: { name: 1 }, tags: ['a'] } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ user: { name: 1 }, tags: [ 'a' ] });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit { user: { name: 'joder' }, tags: [1] } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ user: { name: 'joder' }, tags: [ 1 ] });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit { tags: ['a'] } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ tags: [ 'a' ] });
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('null prototype objects', () => {
        const auditor = new ObjectAuditor(true, {
            name:       new StringAuditor(true),
        });

        it(`Audit Object.assign(Object.create(null), { name: 'joder' }) → { name: 'joder' }`, (t: it.TestContext) => {
            const v = auditor.audit(Object.assign(Object.create(null), { name: 'joder' }));
            t.assert.deepStrictEqual(v, { name: 'joder' });
        });
    });

    describe('inherited properties', () => {
        const auditor = new ObjectAuditor(true, {
            toString:       new StringAuditor(false),
            constructor:    new StringAuditor(false),
        });

        it(`Audit {} → { toString: undefined, constructor: undefined }`, (t: it.TestContext) => {
            const v = auditor.audit({});
            t.assert.deepStrictEqual(v, { toString: undefined, constructor: undefined });
        });

        it(`Audit { toString: 'joder' } → { toString: 'joder', constructor: undefined }`, (t: it.TestContext) => {
            const v = auditor.audit({ toString: 'joder' });
            t.assert.deepStrictEqual(v, { toString: 'joder', constructor: undefined });
        });
    });
});
