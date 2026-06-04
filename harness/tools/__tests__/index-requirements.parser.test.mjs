// Fixture test for the AC marker parser in harness/tools/index-requirements.mjs.
// These cases lock the parser/trace contract for the current AC verification markers.
// Run with: node --test harness/tools/__tests__/

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { acceptanceCriterionItems } from '../index-requirements.mjs';

function parseOne(line) {
    return acceptanceCriterionItems(`- ${line}\n`)[0];
}

describe('acceptanceCriterionItems — AC marker parsing', () => {
    it('(API) is recognized as target=API and stripped', () => {
        assert.deepEqual(parseOne('(API) 정상 마커'), { text: '정상 마커', target: 'API' });
    });

    it('(UI) is recognized as target=UI and stripped', () => {
        assert.deepEqual(parseOne('(UI) 정상 마커'), { text: '정상 마커', target: 'UI' });
    });

    it('(E2E) is recognized as target=E2E and stripped', () => {
        assert.deepEqual(parseOne('(E2E) 정상 마커'), { text: '정상 마커', target: 'E2E' });
    });

    it('(STATIC) is recognized as target=STATIC and stripped', () => {
        assert.deepEqual(parseOne('(STATIC) 정상 마커'), { text: '정상 마커', target: 'STATIC' });
    });

    it('(BE) is reported as invalidMarker, text preserved verbatim', () => {
        assert.deepEqual(parseOne('(BE) 허용 외 토큰'),
            { text: '(BE) 허용 외 토큰', target: null, invalidMarker: 'BE' });
    });

    it('(API-V1) hyphenated token is reported as invalidMarker', () => {
        assert.deepEqual(parseOne('(API-V1) 하이픈 토큰'),
            { text: '(API-V1) 하이픈 토큰', target: null, invalidMarker: 'API-V1' });
    });

    it('(api) lowercase is reported as invalidMarker (case-sensitive valid set)', () => {
        assert.deepEqual(parseOne('(api) 소문자'),
            { text: '(api) 소문자', target: null, invalidMarker: 'api' });
    });

    it('(API): malformed colon-after-marker is reported as invalidMarker', () => {
        // valid form requires a space right after the closing paren.
        assert.deepEqual(parseOne('(API): 콜론 따라옴'),
            { text: '(API): 콜론 따라옴', target: null, invalidMarker: 'API' });
    });

    it('(API)foo without trailing space is reported as invalidMarker', () => {
        assert.deepEqual(parseOne('(API)공백 없음'),
            { text: '(API)공백 없음', target: null, invalidMarker: 'API' });
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
            '- (API) first',
            '- (UI) second',
            '- (E2E) third',
            '- (STATIC) fourth',
            '- plain bullet',
            '- (BE) bad'
        ].join('\n');
        const out = acceptanceCriterionItems(md);
        assert.equal(out.length, 6);
        assert.equal(out[0].target, 'API');
        assert.equal(out[1].target, 'UI');
        assert.equal(out[2].target, 'E2E');
        assert.equal(out[3].target, 'STATIC');
        assert.equal(out[4].target, null);
        assert.equal(out[4].invalidMarker, undefined);
        assert.equal(out[5].invalidMarker, 'BE');
    });
});
