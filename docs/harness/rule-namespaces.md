# 룰 네임스페이스

하네스가 만드는 모든 finding은 prefix가 붙은 `ruleId`를 갖는다. prefix는 **누가 그 룰을 소유하는지**, **어떤 인덱스를 보고 판단하는지**를 가른다. 새 룰을 추가하려면 이 문서에 prefix와 단일 ID를 먼저 등록한다.

자세한 finding 형식은 [`data-contracts.md`](./data-contracts.md)를, layer 분리는 [`overview.md`](./overview.md)를 본다.

## 네임스페이스 표

| Prefix | 의미 | 소유 도구 | 입력 인덱스 |
|---|---|---|---|
| `BE-*` | 백엔드 정적 검사 (Entity/DTO/Controller/Repository/Service/Lombok/Framework 설정) | `tools/harness/validate-back-end-standards.mjs` | `backend.source-index.json` |
| `FE-*` | 프런트엔드 정적 검사 (구조/API 경계/UI 상태/테스트 작성) | `tools/harness/validate-front-end-standards.mjs` | `front-end.source-index.json` |
| `SCN-*` | Gherkin `.feature` 구조 검사 | `tools/harness/validate-scenarios.mjs` (예정, 현재는 `scenario-index.mjs` 내부 issue) | `scenarios.index.json` |
| `TRM-*` | 표준 용어 검사 | `tools/harness/terminology.mjs validate` | `terminology.index.json` + 텍스트 채널 |
| `CARD-*` | 요건 카드 본문 구조 검사 (필수 섹션, ID 형식, 상태값) | `tools/harness/validate-requirement-cards.mjs` | `requirements.index.json` |
| `TRC-*` | 교차 산출물 일관성 (Test ↔ Scenario ↔ Card AC) | `tools/harness/validate-cross-artifact.mjs` | 모든 source/scenario/card/test-result 인덱스 |
| `REF-*` | 알려지지 않은 `REQ-XXX` 참조 (코드 애너테이션, 시나리오 태그, FE 표면, 카드 본문 등) | 위와 같은 cross-artifact validator | 모든 인덱스 |
| `TRACE-*` | 카드 상태 계산 과정에서 발견된 RED 사유 (kind=trace) | `tools/harness/evaluate-trace-state.mjs` | state 계산 결과 |

`TRACE-*`는 별도 validator가 아니라 Layer 3의 state 계산기가 부산물로 만든다. 다른 layer 2 finding을 참조하는 형태로 두는 것이 권장.

## prefix별 룰 ID 규약

prefix 뒤에는 도메인 약자 + 번호를 붙여 사람이 읽을 수 있게 둔다.

```text
BE-E1            backend entity rule 1
BE-D7            backend DTO rule 7
BE-C3            backend controller rule 3
BE-F5            backend framework configuration rule 5
BE-L2            backend Lombok rule 2

FE-STRUCT-01              frontend project structure rule (예정)
FE-STORY-MISSING-STATE    공통 UI primitive stories에 필수 상태 누락 (severity=error)
FE-TEST-DYN               Playwright BDD annotation이 literal {type,description} 아님
FE-TEST-COVERS-NO-REQ     Covers 메타데이터는 있으나 Requirement 메타데이터 없음
FE-TEST-REQ-NO-COVERS     Requirement 메타데이터는 있으나 Covers 메타데이터 없음
FE-INDEX-UNKNOWN          FE source index가 분류하지 못한 issue 보조 매핑
FE-API-CONTRACT-MISSING   OpenAPI 계약 산출물 부재 (REQ-006, 초기 warning)
FE-API-UNKNOWN-OPERATION  FE src/api/** 호출이 OpenAPI 계약의 method+path에 없음 (REQ-006, 초기 warning)
FE-API-CLIENT-STALE       FE generated 클라이언트의 OpenAPI SHA-256 메타파일이 현재 계약과 불일치 (REQ-006, 초기 warning)

SCN-01           scenario structural rule

TRM-CASING       terminology casing rule
TRM-MISSING      terminology missing registration

CARD-ID-MISSING                 카드에 `요건 ID:` 줄 없음
CARD-ID-FORMAT                  요건 ID가 `REQ-NNN` 형식 아님
CARD-ID-DUPLICATE               같은 요건 ID를 가진 카드가 여러 개
CARD-FILENAME-FORMAT            파일명이 `REQ-NNN-*.md` 패턴 아님
CARD-FILENAME-ID-MISMATCH       파일명 ID와 본문 ID 불일치
CARD-TITLE-MISSING              제목 줄 없음
CARD-PRIORITY-MISSING           우선순위 줄 없음
CARD-PRIORITY-INVALID           우선순위 값이 허용 목록 외
CARD-STATUS-MISSING             상태 줄 없음
CARD-STATUS-INVALID             상태 값이 허용 목록 외
CARD-TARGET-INVALID             구현 대상 값이 허용 목록 외
CARD-SECTION-MISSING            필수 섹션 누락 (## 사용자/목적 등)
CARD-AC-EMPTY                   수용 기준 섹션이 비어 있음
CARD-AC-DUPLICATE               같은 수용 기준 문장이 중복
CARD-TERM-FORMAT                표준 용어가 `domain.name` 형식 아님
CARD-TERM-UNREGISTERED          카드가 미등록 표준 용어를 참조
CARD-TERM-DUPLICATE             같은 표준 용어가 중복 나열
CARD-TERM-INDEX-MISSING         terminology.index.json 부재 (운영 precondition)
CARD-APPROVAL-OPEN-QUESTIONS    상태=승인인데 열린 질문 남음
CARD-APPROVAL-BDD-INCOMPLETE    상태=승인인데 BDD 리뷰 "미완료" 표기
CARD-APPROVAL-BDD-NO-APPROVAL   상태=승인인데 BDD 리뷰 "결과: 승인" 줄 없음

REF-API           controller `@Requirement`에 카드에 없는 ID
REF-TEST          test `@Requirement`에 카드에 없는 ID
REF-ENTITY        entity/column `@Requirement`에 카드에 없는 ID
REF-FEATURE       `.feature` `@REQ-XXX` 태그가 카드에 없음
REF-FE-SURFACE    FE page/route/story 메타데이터에 카드에 없는 ID
REF-CARD          카드 본문이 알려지지 않은 `REQ-XXX`를 참조

TRC-COV-01       test covers AC that no scenario covers (구 TEST_COVERS_NO_SCENARIO_COVERS)
TRC-COV-02       scenario covers text not exactly in card AC (구 SCENARIO_COVERS_NO_CARD_AC)
# TRC-COV-03 (feature 태그 미등록)은 reference 위반이므로 REF-FEATURE로 통합한다.

REF-API          unknown REQ on controller annotation
REF-TEST         unknown REQ on test annotation
REF-ENTITY       unknown REQ on entity annotation
REF-FEATURE      unknown REQ on feature tag
REF-FE-SURFACE   unknown REQ on FE page/route/story metadata
REF-CARD         unknown REQ in requirement card body

TRACE-NO-API         back-end/full-stack 카드인데 매칭되는 API 없음
TRACE-NO-FE-SURFACE  front-end/full-stack 카드인데 매칭되는 FE 표면 없음
TRACE-AC-MISSING     AC를 커버하는 테스트 자체가 없음
TRACE-AC-FAIL        AC를 커버하는 테스트가 FAIL/SKIP/NOT_RUN
TRACE-AC-NO-FEATURE  AC를 다루는 .feature Scenario가 없음
```

## 기존 ID → 새 ID 매핑

마이그레이션 동안 옛 ID는 finding `evidence.legacyKind` 등으로 보존한다. Layer 1–4 분리가 끝나면 옛 ID 의존을 제거한다.

| 기존 (trace-requirements 내부) | 새 ID |
|---|---|
| `TEST_COVERS_NO_SCENARIO_COVERS` | `TRC-COV-01` |
| `SCENARIO_COVERS_NO_CARD_AC` | `TRC-COV-02` |
| `FEATURE_UNKNOWN_REQ_TAG` | `REF-FEATURE` (TRC-COV-03 폐기, reference 위반으로 재분류) |
| 카드 구조 issue 문자열 ("필수 섹션 누락: ## 수용 기준" 등) | `CARD-*` 세부 ruleId |
| `DYNAMIC_TEST_ANNOTATION` (FE source index) | `FE-TEST-DYN` |
| `COVERS_WITHOUT_REQUIREMENT` (FE source index) | `FE-TEST-COVERS-NO-REQ` |
| `REQUIREMENT_WITHOUT_COVERS` (FE source index) | `FE-TEST-REQ-NO-COVERS` |
| 기존 BE 정적 검사 `E1`~`F7` | `BE-E1`~`BE-F7` (prefix만 추가) |

## 새 룰 추가 절차

1. 어떤 layer 인지 결정 (`static` = layer 2 단독 인덱스 / `cross-artifact` = layer 2 멀티 인덱스 / `trace` = layer 3 부산물).
2. 적절한 prefix에 새 ID를 부여한다. 번호는 마지막+1이 아니라 의미 단어를 우선 (`FE-API-NO-FETCH` 같은 형태도 허용).
3. 본 문서의 표에 한 줄 추가한다.
4. 해당 validator에 룰을 구현한다. emit하는 finding은 [`data-contracts.md`](./data-contracts.md)의 finding 최소 형태를 따른다.
5. `remediation`에는 위반 시 어떤 표준 문서 어느 절을 봐야 하는지 적는다 (예: `docs/standards/front-end-api-contract.md#금지-사항`).
6. CI 게이트가 새 룰을 자동 반영하므로 별도 등록은 없다. 단 `severity`/`strictSeverity`는 표준 변경 절차([`../standards/README.md`](../standards/README.md))를 따른다.

## severity / strictSeverity 선택 지침

- `error`: 운영에서 깨지거나 데이터/계약을 어긋나게 만드는 위반. 게이트가 실패한다.
- `warning`: 의미 있는 drift이지만 즉시 깨지지 않음. 게이트는 통과하되 리포트에 남는다. strict 모드에서는 `strictSeverity: "error"`로 승격될 수 있다.
- `info`: 사람이 봐야 하는 정보. 게이트 영향 없음.

기본값은 `severity = strictSeverity`다. 두 값을 다르게 두는 경우(예: 마이그레이션 중)에는 finding에 `remediation`으로 승격 예정 날짜/조건을 적는다.

### Layer 4 게이트 반영 (gate-trace.mjs)

`--check` / `--require-blue` 게이트는 다음을 모두 본다:

- `summary.red > 0` 또는 `total === 0`
- unknown reference (`REF-API/TEST/ENTITY/FE-SURFACE` finding 합산)
- card structure issues (`CARD-*` + `REF-CARD` 머지)
- **`summary.frontEndStandardsErrors > 0`** (FE-* 중 severity=error)
- `--require-blue`는 위 + `summary.green > 0`도 실패 사유

FE-* warning은 게이트 통과(리포트에만 남음). 향후 룰에 `severity: "error"`를 부여하면 자동으로 게이트가 차단한다. cross-artifact/terminology warning과 일관된 정책이다.

## 룰 비활성화는 없다

특정 룰을 파일/디렉터리 단위로 무시하는 메커니즘은 두지 않는다. drift는 표준을 약화시키는 방향으로 가기 때문에, 룰을 끄는 대신 표준을 고치거나 마이그레이션 REQ를 발급한다 ([`../standards/README.md`](../standards/README.md) "기존 코드 마이그레이션").
