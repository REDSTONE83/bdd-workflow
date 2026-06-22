import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    FRONT_END_RESULT_FILES,
    canonicalTestIdentity,
    computeTestFingerprint,
    manifestEntryForTest,
    sha256
} from '../test-result-fingerprint.mjs';

describe('test-result-fingerprint — computeTestFingerprint', () => {
    it('is deterministic: same input → same SHA-256 hex', () => {
        const input = { resultKeys: ['k1', 'k2'], requirements: ['REQ-001'], covers: ['AC a', 'AC b'] };
        const a = computeTestFingerprint(input);
        const b = computeTestFingerprint({ resultKeys: ['k1', 'k2'], requirements: ['REQ-001'], covers: ['AC a', 'AC b'] });
        assert.equal(a, b);
        assert.match(a, /^[0-9a-f]{64}$/);
    });

    it('is independent of Requirement array order', () => {
        const a = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001', 'REQ-002'], covers: ['AC'] });
        const b = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-002', 'REQ-001'], covers: ['AC'] });
        assert.equal(a, b);
    });

    it('is independent of Covers array order', () => {
        const a = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC a', 'AC b'] });
        const b = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC b', 'AC a'] });
        assert.equal(a, b);
    });

    it('is independent of resultKeys array order and duplicates', () => {
        const a = computeTestFingerprint({ resultKeys: ['k1', 'k2'], requirements: [], covers: ['AC'] });
        const b = computeTestFingerprint({ resultKeys: ['k2', 'k1', 'k1'], requirements: [], covers: ['AC'] });
        assert.equal(a, b);
    });

    it('changes when Covers changes (the stale-PASS trigger)', () => {
        const before = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC old'] });
        const after = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC new'] });
        assert.notEqual(before, after);
    });

    it('changes when Requirement changes', () => {
        const before = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC'] });
        const after = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-002'], covers: ['AC'] });
        assert.notEqual(before, after);
    });

    it('ignores empty/non-string entries so they cannot perturb the hash', () => {
        const a = computeTestFingerprint({ resultKeys: ['k', '', null, undefined], requirements: ['REQ-001'], covers: ['AC'] });
        const b = computeTestFingerprint({ resultKeys: ['k'], requirements: ['REQ-001'], covers: ['AC'] });
        assert.equal(a, b);
    });
});

describe('test-result-fingerprint — manifestEntryForTest', () => {
    it('is line-independent: same resultKeys/Requirement/Covers but different line/identity → same fingerprint', () => {
        const atLine10 = {
            runtime: 'storybook-vitest',
            resultKeys: ['Title / Story'],
            requirements: ['REQ-022'],
            covers: ['AC one'],
            line: 10,
            identity: 'src/X.stories.tsx:10 > Title / Story'
        };
        const movedToLine99 = {
            ...atLine10,
            line: 99,
            identity: 'src/X.stories.tsx:99 > Title / Story'
        };
        assert.equal(
            manifestEntryForTest(atLine10).fingerprint,
            manifestEntryForTest(movedToLine99).fingerprint
        );
    });

    it('reshapes a source test into a manifest entry preserving join keys and sorting metadata', () => {
        const entry = manifestEntryForTest({
            runtime: 'playwright',
            resultKeys: ['a > b > c'],
            requirements: ['REQ-002', 'REQ-001'],
            covers: ['z', 'a'],
            line: 5
        });
        assert.deepEqual(entry.resultKeys, ['a > b > c']);
        assert.deepEqual(entry.requirements, ['REQ-001', 'REQ-002']);
        assert.deepEqual(entry.covers, ['a', 'z']);
        assert.equal(entry.fingerprint, computeTestFingerprint(entry));
        assert.equal('line' in entry, false);
    });
});

describe('test-result-fingerprint — shared constants and helpers', () => {
    it('maps each FE runtime to its result file, manifest file, and rerun command', () => {
        assert.equal(FRONT_END_RESULT_FILES['storybook-vitest'].resultFile, 'storybook-junit.xml');
        assert.equal(FRONT_END_RESULT_FILES['storybook-vitest'].manifestFile, 'storybook-junit.manifest.json');
        assert.equal(FRONT_END_RESULT_FILES['storybook-vitest'].rerunCommand, 'npm run app:e2e');
        assert.equal(FRONT_END_RESULT_FILES.playwright.resultFile, 'e2e-live-results.json');
        assert.equal(FRONT_END_RESULT_FILES.playwright.manifestFile, 'e2e-live-results.manifest.json');
        assert.equal(FRONT_END_RESULT_FILES.playwright.rerunCommand, 'npm run app:e2e:live');
    });

    it('sha256 hashes strings and Buffers identically for equal bytes', () => {
        assert.equal(sha256('abc'), sha256(Buffer.from('abc')));
        assert.match(sha256('abc'), /^[0-9a-f]{64}$/);
    });

    it('canonicalTestIdentity emits a fixed key order', () => {
        const canonical = canonicalTestIdentity({ covers: ['c'], requirements: ['REQ-001'], resultKeys: ['k'] });
        assert.equal(canonical, '{"resultKeys":["k"],"requirements":["REQ-001"],"covers":["c"]}');
    });
});
