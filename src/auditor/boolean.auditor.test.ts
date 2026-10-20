import { describe, it } from 'node:test';
import { AuditorError } from './auditor.error.ts';
import { BooleanAuditor } from './boolean.auditor.ts';

describe('BooleanAuditor', () => {
    describe('required = true', () => {
        const auditor = new BooleanAuditor(true);
        it(`Audit true → true`, (t: it.TestContext) => {
            const v = auditor.audit(true);
            t.assert.strictEqual(v, true);
        });
        
        it(`Audit false → false`, (t: it.TestContext) => {
            const v = auditor.audit(false);
            t.assert.strictEqual(v, false);
        });
        
        it(`Audit 'true' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('true');
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
        const auditor = new BooleanAuditor(false);
        it(`Audit true → true`, (t: it.TestContext) => {
            const v = auditor.audit(true);
            t.assert.strictEqual(v, true);
        });
        
        it(`Audit false → false`, (t: it.TestContext) => {
            const v = auditor.audit(false);
            t.assert.strictEqual(v, false);
        });
        
        it(`Audit 'true' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('true');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
        
        it(`Audit null → error`, (t: it.TestContext) => {
            const v = auditor.audit(null);
            t.assert.strictEqual(v, undefined);
        });
        
        it(`Audit undefined → error`, (t: it.TestContext) => {
            const v = auditor.audit(undefined);
            t.assert.strictEqual(v, undefined);
        });
    });
});