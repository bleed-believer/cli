import { describe, it } from 'node:test';
import { AuditorError } from './auditor.error.ts';
import { ValuesAuditor } from './values.auditor.ts';

describe('ValuesAuditor', () => {
    describe('required = true', () => {
        const auditor = new ValuesAuditor(true, [ 'hola', 'chao' ]);
        it(`Audit 'hola' → 'hola'`, (t: it.TestContext) => {
            const v = auditor.audit('hola');
            t.assert.strictEqual(v, 'hola');
        });

        it(`Audit 'chao' → 'chao'`, (t: it.TestContext) => {
            const v = auditor.audit('chao');
            t.assert.strictEqual(v, 'chao');
        });

        it(`Audit 'adios' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('adios');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'HOLA' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('HOLA');
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
        const auditor = new ValuesAuditor(false, [ 'hola', 'chao' ]);
        it(`Audit 'hola' → 'hola'`, (t: it.TestContext) => {
            const v = auditor.audit('hola');
            t.assert.strictEqual(v, 'hola');
        });

        it(`Audit 'adios' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('adios');
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

    describe('number values', () => {
        const auditor = new ValuesAuditor(true, [ 1, 2, 3 ]);
        it(`Audit 2 → 2`, (t: it.TestContext) => {
            const v = auditor.audit(2);
            t.assert.strictEqual(v, 2);
        });

        it(`Audit 4 → error`, (t: it.TestContext) => {
            try {
                auditor.audit(4);
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit '2' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('2');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('mixed values', () => {
        const auditor = new ValuesAuditor(true, [ 1, 'a', true ]);
        it(`Audit 1 → 1`, (t: it.TestContext) => {
            const v = auditor.audit(1);
            t.assert.strictEqual(v, 1);
        });

        it(`Audit 'a' → 'a'`, (t: it.TestContext) => {
            const v = auditor.audit('a');
            t.assert.strictEqual(v, 'a');
        });

        it(`Audit true → true`, (t: it.TestContext) => {
            const v = auditor.audit(true);
            t.assert.strictEqual(v, true);
        });

        it(`Audit '1' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('1');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });

        it(`Audit 'true' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('true');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('empty values', () => {
        const auditor = new ValuesAuditor(true, []);
        it(`Audit 'hola' → error`, (t: it.TestContext) => {
            try {
                auditor.audit('hola');
                t.assert.fail('This assert must be fail');
            } catch (err) {
                t.assert.ok(err instanceof AuditorError);
            }
        });
    });

    describe('null as allowed value', () => {
        describe('required = true', () => {
            const auditor = new ValuesAuditor(true, [ 'hola', null ]);
            it(`Audit null → null`, (t: it.TestContext) => {
                const v = auditor.audit(null);
                t.assert.strictEqual(v, null);
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
            const auditor = new ValuesAuditor(false, [ 'hola', null ]);
            it(`Audit null → null`, (t: it.TestContext) => {
                const v = auditor.audit(null);
                t.assert.strictEqual(v, null);
            });

            it(`Audit undefined → undefined`, (t: it.TestContext) => {
                const v = auditor.audit(undefined);
                t.assert.strictEqual(v, undefined);
            });
        });
    });
});
