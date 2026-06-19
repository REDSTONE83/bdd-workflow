// Fixture test for the AC marker parser in harness/tools/index-requirements.mjs.
// These cases lock the parser/trace contract for the current AC verification markers.
// Run with: node --test harness/tools/__tests__/

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    acceptanceCriterionItems,
    acceptanceCriteriaWithLines,
    acceptanceTestReviewResultItems,
    acceptanceTestReviewResultSummary,
    decisionLogItems,
    storybookContractItems,
    verificationTargetItems
} from '../index-requirements.mjs';

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

describe('acceptanceCriteriaWithLines', () => {
    it('assigns absolute 1-based card body lines to AC bullets', () => {
        const card = [
            '# REQ-900 fixture',
            '',
            '요건 ID: REQ-900',
            '제목: fixture',
            '',
            '## 사용자/목적',
            '',
            '- 목적은 수용 기준이 아니다.',
            '',
            '## 수용 기준',
            '',
            '- (STATIC) 첫 번째 AC',
            '- [ ] (UI) 체크박스 AC',
            '- (BE) 허용되지 않은 마커도 원본 line을 유지한다.',
            '',
            '## 열린 질문',
            '',
            '- 이 bullet은 AC가 아니다.'
        ].join('\n');

        assert.deepEqual(acceptanceCriteriaWithLines(card), [
            { text: '첫 번째 AC', target: 'STATIC', line: 12 },
            { text: '체크박스 AC', target: 'UI', line: 13 },
            { text: '(BE) 허용되지 않은 마커도 원본 line을 유지한다.', target: null, invalidMarker: 'BE', line: 14 }
        ]);
    });

    it('matches acceptanceCriterionItems except for source line metadata', () => {
        const criteria = [
            '- (API) API 응답을 반환한다.',
            '- [ ] (UI) 화면에 상태를 표시한다.',
            '- (API): 잘못된 마커는 원문을 유지한다.',
            '- 마커 없는 AC'
        ].join('\n');
        const card = [
            '# REQ-900 fixture',
            '',
            '## 수용 기준',
            criteria,
            '',
            '## 열린 질문',
            '',
            '- 없음'
        ].join('\n');

        const withLines = acceptanceCriteriaWithLines(card)
            .map(({ line, ...criterion }) => criterion);
        assert.deepEqual(withLines, acceptanceCriterionItems(criteria));
    });
});

describe('verificationTargetItems', () => {
    it('parses required and not-required verification targets', () => {
        assert.deepEqual(verificationTargetItems([
            '- API: 필요',
            '- DB: 불필요',
            '- Storybook: required'
        ].join('\n')), {
            API: { required: true, raw: '필요' },
            DB: { required: false, raw: '불필요' },
            Storybook: { required: true, raw: 'required' }
        });
    });
});

describe('storybookContractItems', () => {
    it('parses Storybook title and named export states', () => {
        assert.deepEqual(storybookContractItems([
            '- Routes/TodosPage: RouteTodos, Empty, ManyItems',
            '- `Todos/TodoFormDialog`: `Create`, `Submitting`'
        ].join('\n')), [
            {
                title: 'Routes/TodosPage',
                states: ['RouteTodos', 'Empty', 'ManyItems'],
                raw: 'Routes/TodosPage: RouteTodos, Empty, ManyItems'
            },
            {
                title: 'Todos/TodoFormDialog',
                states: ['Create', 'Submitting'],
                raw: '`Todos/TodoFormDialog`: `Create`, `Submitting`'
            }
        ]);
    });
});

describe('decisionLogItems', () => {
    it('parses requirement decision log blocks', () => {
        assert.deepEqual(decisionLogItems([
            '- 결정일: 2026-06-10',
            '  결정: 추적 산출물 값을 그대로 표시한다.',
            '  이유: CLI와 UI가 다른 답을 주면 안 된다.',
            '  결정자: REDSTONE',
            '  영향: 화면은 판정 값을 재계산하지 않는다.',
            '',
            '- 결정일: 2026-06-11',
            '  결정: 개요 탭에 카드 요약 섹션을 표시한다.',
            '  이유: 상세 진입 직후 요건 의도를 확인해야 한다.',
            '  결정자: REDSTONE',
            '  영향: 요구사항 인덱스가 카드 섹션 요약을 제공한다.'
        ].join('\n')), [
            {
                date: '2026-06-10',
                decision: '추적 산출물 값을 그대로 표시한다.',
                reason: 'CLI와 UI가 다른 답을 주면 안 된다.',
                decisionMaker: 'REDSTONE',
                impact: '화면은 판정 값을 재계산하지 않는다.'
            },
            {
                date: '2026-06-11',
                decision: '개요 탭에 카드 요약 섹션을 표시한다.',
                reason: '상세 진입 직후 요건 의도를 확인해야 한다.',
                decisionMaker: 'REDSTONE',
                impact: '요구사항 인덱스가 카드 섹션 요약을 제공한다.'
            }
        ]);
    });
});

describe('acceptanceTestReviewResultSummary', () => {
    it('uses only acceptance test review result lines and ignores domain text containing 미완료', () => {
        const summary = acceptanceTestReviewResultSummary([
            '- 시나리오 문서: `docs/scenarios/REQ-999.feature`',
            '',
            '### 요건 설계 승인 이력',
            '',
            '- 승인일: 2026-06-08',
            '  확인: 할 일을 미완료로 되돌리는 도메인 문장은 상태 표기가 아니다.',
            '  Skeleton 결과: 미완료',
            '',
            '### 테스트 리뷰',
            '',
            '- 리뷰일: 2026-06-08',
            '  확인: 검토 완료.',
            '  결과: 승인'
        ].join('\n'));

        assert.equal(summary.incomplete, false);
        assert.equal(summary.approved, true);
        assert.deepEqual(summary.latest, {
            line: 13,
            status: '승인',
            normalizedStatus: '승인'
        });
    });

    it('treats the latest result line as authoritative', () => {
        const summary = acceptanceTestReviewResultSummary([
            '- 리뷰일: 2026-06-07',
            '  결과: 승인',
            '- 리뷰일: 2026-06-08',
            '  결과: 미완료'
        ].join('\n'));

        assert.equal(summary.incomplete, true);
        assert.equal(summary.approved, false);
        assert.equal(summary.latest.status, '미완료');
    });
});

describe('acceptanceTestReviewResultItems', () => {
    it('does not parse legacy Skeleton 결과 lines as test review results', () => {
        assert.deepEqual(acceptanceTestReviewResultItems([
            '  Skeleton 결과: 승인',
            '  결과: 승인'
        ].join('\n')), [
            {
                line: 2,
                status: '승인',
                normalizedStatus: '승인'
            }
        ]);
    });
});
