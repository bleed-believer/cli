import { describe, it } from 'node:test';
import { AuditorError } from './auditor.error.ts';
import { ArrayAuditor } from './array.auditor.ts';
import { StringAuditor } from './string.auditor.ts';

describe('ArrayAuditor', () => {
    describe('required = true', () => {
        const auditor = new ArrayAuditor(true, new StringAuditor(true));
        it(`Audit ['a', 'b'] → ['a', 'b']`, (t: it.TestContext) => {
            const v = auditor.audit([ 'a', 'b' ]);
            t.assert.deepStrictEqual(v, [ 'a', 'b' ]);
        });

        it(`Audit [] → []`, (t: it.TestContext) => {
            const v = auditor.audit([]);
            t.assert.deepStrictEqual(v, []);
        });

        it(`Audit ['a', 1] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', 1 ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'a' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('a');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit { 0: 'a', length: 1 } → error`, (t: it.TestContext) => {
            try {
                auditor.audit({ 0: 'a', length: 1 });
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
        const auditor = new ArrayAuditor(false, new StringAuditor(true));
        it(`Audit ['a', 'b'] → ['a', 'b']`, (t: it.TestContext) => {
            const v = auditor.audit([ 'a', 'b' ]);
            t.assert.deepStrictEqual(v, [ 'a', 'b' ]);
        });

        it(`Audit [] → []`, (t: it.TestContext) => {
            const v = auditor.audit([]);
            t.assert.deepStrictEqual(v, []);
        });

        it(`Audit ['a', 1] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', 1 ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'a' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('a');
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

    describe('items required = true', () => {
        const auditor = new ArrayAuditor(true, new StringAuditor(true));
        it(`Audit ['a', null] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', null ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit ['a', undefined] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', undefined ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit ['a', , 'b'] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', , 'b' ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('items required = false', () => {
        const auditor = new ArrayAuditor(true, new StringAuditor(false));
        it(`Audit ['a', null, undefined] → ['a', undefined, undefined]`, (t: it.TestContext) => {
            const v = auditor.audit([ 'a', null, undefined ]);
            t.assert.deepStrictEqual(v, [ 'a', undefined, undefined ]);
        });

        it(`Audit ['a', , 'b'] → ['a', undefined, 'b']`, (t: it.TestContext) => {
            const v = auditor.audit([ 'a', , 'b' ]);
            t.assert.deepStrictEqual(v, [ 'a', undefined, 'b' ]);
        });

        it(`Audit ['a', 1] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ 'a', 1 ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('nested arrays', () => {
        const auditor = new ArrayAuditor(true, new ArrayAuditor(true, new StringAuditor(true)));
        it(`Audit [['a'], ['b', 'c']] → [['a'], ['b', 'c']]`, (t: it.TestContext) => {
            const v = auditor.audit([ [ 'a' ], [ 'b', 'c' ] ]);
            t.assert.deepStrictEqual(v, [ [ 'a' ], [ 'b', 'c' ] ]);
        });

        it(`Audit [['a'], [1]] → error`, (t: it.TestContext) => {
            try {
                auditor.audit([ [ 'a' ], [ 1 ] ]);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });
});
