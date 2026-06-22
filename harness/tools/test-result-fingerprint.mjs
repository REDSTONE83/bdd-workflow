// 공유 순수 모듈: FE 실행 결과 freshness fingerprint 계산.
//
// manifest를 생성하는 wrapper(run.mjs)와 현재값을 재계산하는 index-test-results.mjs가
// 같은 알고리즘을 쓰도록 fingerprint 계산을 한 곳에 둔다. 두 곳이 어긋나면 모든 결과가
// false-stale이 되므로 알고리즘을 단일 소스로 둔다.
//
// fingerprint는 line을 제거한 stable 식별자(`resultKeys`)·`Requirement`·`Covers`
// metadata만으로 계산한다. 배열은 dedupe·정렬하고 필드 순서를 고정한 정규 직렬화의
// SHA-256으로 둬서 배열 순서 차이나 line 이동으로 false-stale이 나지 않게 한다.
// hashing은 기존 FE-API-CLIENT-STALE(OpenAPI 계약 SHA-256 메타 비교)과 동형이다.
import { createHash } from 'node:crypto';

// runtime별 canonical 결과 파일·sidecar manifest 파일명과 stale 해소 재실행 명령.
// run.mjs(생성), index-test-results.mjs(읽기), validate-front-end-standards.mjs(remediation)가 공유한다.
export const FRONT_END_RESULT_FILES = {
    'storybook-vitest': {
        runtime: 'storybook-vitest',
        label: 'Storybook Vitest',
        resultFile: 'storybook-junit.xml',
        manifestFile: 'storybook-junit.manifest.json',
        rerunCommand: 'npm run app:e2e'
    },
    playwright: {
        runtime: 'playwright',
        label: 'live Playwright',
        resultFile: 'e2e-live-results.json',
        manifestFile: 'e2e-live-results.manifest.json',
        rerunCommand: 'npm run app:e2e:live'
    }
};

export const FRONT_END_RESULT_RUNTIMES = Object.keys(FRONT_END_RESULT_FILES);

// 결정적 SHA-256 hex. 문자열 또는 Buffer 입력 모두 받는다.
export function sha256(data) {
    return createHash('sha256').update(data).digest('hex');
}

function canonicalArray(values) {
    return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))].sort();
}

// line-independent 식별자·Requirement·Covers 만으로 계산하는 정규 직렬화.
export function canonicalTestIdentity({ resultKeys, requirements, covers }) {
    return JSON.stringify({
        resultKeys: canonicalArray(resultKeys),
        requirements: canonicalArray(requirements),
        covers: canonicalArray(covers)
    });
}

export function computeTestFingerprint(input) {
    return sha256(canonicalTestIdentity(input));
}

// front-end.source-index.json 의 test 엔트리 → manifest fingerprint 엔트리.
// resultKeys 는 결과↔manifest 조인 키이므로 보존하고, Requirement/Covers 는 사람이 읽기 좋게 정렬해 둔다.
export function manifestEntryForTest(test) {
    const resultKeys = [...new Set((test.resultKeys ?? []).filter(Boolean))];
    const requirements = test.requirements ?? [];
    const covers = test.covers ?? [];
    return {
        resultKeys,
        requirements: canonicalArray(requirements),
        covers: canonicalArray(covers),
        fingerprint: computeTestFingerprint({ resultKeys, requirements, covers })
    };
}
