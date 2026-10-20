import { describe, it } from 'node:test';
import { AuditorError } from './auditor.error.ts';
import { StringAuditor } from './string.auditor.ts';

describe('StringAuditor', () => {
    describe('required = true', () => {
        const auditor = new StringAuditor(true);
        it(`Audit 'hello' → 'hello'`, (t: it.TestContext) => {
            const v = auditor.audit('hello');
            t.assert.strictEqual(v, 'hello');
        });

        it(`Audit '' → ''`, (t: it.TestContext) => {
            const v = auditor.audit('');
            t.assert.strictEqual(v, '');
        });

        it(`Audit 123 → error`, (t: it.TestContext) => {
            try {
                auditor.audit(123);
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
        const auditor = new StringAuditor(false);
        it(`Audit 'hello' → 'hello'`, (t: it.TestContext) => {
            const v = auditor.audit('hello');
            t.assert.strictEqual(v, 'hello');
        });

        it(`Audit '' → ''`, (t: it.TestContext) => {
            const v = auditor.audit('');
            t.assert.strictEqual(v, '');
        });

        it(`Audit 123 → error`, (t: it.TestContext) => {
            try {
                auditor.audit(123);
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
});
