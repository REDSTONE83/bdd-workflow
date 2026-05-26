// Fixture test for the AC marker parser in tools/harness/index-requirements.mjs.
// 11 cases lock the parser/trace contract for REQ-012 (AC target marker).
// Run with: node --test tools/harness/__tests__/

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { acceptanceCriterionItems } from '../index-requirements.mjs';

function parseOne(line) {
    return acceptanceCriterionItems(`- ${line}\n`)[0];
}

describe('acceptanceCriterionItems — AC marker parsing (REQ-012)', () => {
    it('(BE) is recognized as target=BE and stripped', () => {
        assert.deepEqual(parseOne('(BE) 정상 마커'), { text: '정상 마커', target: 'BE' });
    });

    it('(FE) is recognized as target=FE and stripped', () => {
        assert.deepEqual(parseOne('(FE) 정상 마커'), { text: '정상 마커', target: 'FE' });
    });

    it('(FS) is recognized as target=FS and stripped', () => {
        assert.deepEqual(parseOne('(FS) 정상 마커'), { text: '정상 마커', target: 'FS' });
    });

    it('(API) is reported as invalidMarker, text preserved verbatim', () => {
        assert.deepEqual(parseOne('(API) 허용 외 토큰'),
            { text: '(API) 허용 외 토큰', target: null, invalidMarker: 'API' });
    });

    it('(API-V1) hyphenated token is reported as invalidMarker', () => {
        assert.deepEqual(parseOne('(API-V1) 하이픈 토큰'),
            { text: '(API-V1) 하이픈 토큰', target: null, invalidMarker: 'API-V1' });
    });

    it('(be) lowercase is reported as invalidMarker (case-sensitive valid set)', () => {
        assert.deepEqual(parseOne('(be) 소문자'),
            { text: '(be) 소문자', target: null, invalidMarker: 'be' });
    });

    it('(BE): malformed colon-after-marker is reported as invalidMarker', () => {
        // valid form requires a space right after the closing paren.
        assert.deepEqual(parseOne('(BE): 콜론 따라옴'),
            { text: '(BE): 콜론 따라옴', target: null, invalidMarker: 'BE' });
    });

    it('(BE)foo without trailing space is reported as invalidMarker', () => {
        assert.deepEqual(parseOne('(BE)공백 없음'),
            { text: '(BE)공백 없음', target: null, invalidMarker: 'BE' });
    });

    it('(see foo) natural-language parenthesis with inner space is NOT a marker candidate', () => {
        assert.deepEqual(parseOne('(see foo) 자연어 괄호'),
            { text: '(see foo) 자연어 괄호', target: null });
    });

    it('(예: A) colon-with-space parenthesis is NOT a marker candidate', () => {
        assert.deepEqual(parseOne('(예: A) 콜론 공백 있는 자연어'),
            { text: '(예: A) 콜론 공백 있는 자연어', target: null });
    });

    it('no leading parenthesis returns target=null with no invalidMarker', () => {
        assert.deepEqual(parseOne('마커 없음'), { text: '마커 없음', target: null });
    });
});

describe('acceptanceCriterionItems — multi-bullet behavior', () => {
    it('parses a full block of mixed bullets in order', () => {
        const md = [
            '- (BE) first',
            '- (FE) second',
            '- (FS) third',
            '- plain bullet',
            '- (API) bad'
        ].join('\n');
        const out = acceptanceCriterionItems(md);
        assert.equal(out.length, 5);
        assert.equal(out[0].target, 'BE');
        assert.equal(out[1].target, 'FE');
        assert.equal(out[2].target, 'FS');
        assert.equal(out[3].target, null);
        assert.equal(out[3].invalidMarker, undefined);
        assert.equal(out[4].invalidMarker, 'API');
    });
});
