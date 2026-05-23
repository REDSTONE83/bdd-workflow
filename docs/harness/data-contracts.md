# 하네스 데이터 계약

이 문서는 하네스 도구들이 주고받는 JSON의 **최소 형태**와 **저장 위치**를 정의한다. 새 collector, validator, reporter를 추가할 때는 이 계약을 따른다. 계약을 흔드는 변경은 표준 변경 절차([`../standards/README.md`](../standards/README.md))를 따른다.

자세한 layer 분리는 [`overview.md`](./overview.md)의 "파이프라인 구조" 절을, 룰 prefix 규약은 [`rule-namespaces.md`](./rule-namespaces.md)를 본다.

## 산출물 디렉터리 레이아웃

```text
build/harness/
  indexes/                                     # Layer 1: collector 출력
    backend.source-index.json
    front-end.source-index.json
    scenarios.index.json
    terminology.index.json
    requirements.index.json
    test-results.index.json
    openapi.index.json                         # REQ-006: Spring /v3/api-docs dump 정규화
  findings/                                    # Layer 2: validator 출력
    back-end-standards.findings.json
    front-end-standards.findings.json
    scenarios.findings.json
    terminology.findings.json
    requirement-cards.findings.json
    cross-artifact.findings.json
  state/                                       # Layer 3: trace 출력
    trace.state.json
  reports/                                     # Layer 4: reporter 출력
    trace-report.md
    trace-report.json
    back-end-standards-report.md
    terminology-report.md
  schema-preview.sql                           # Entity DDL 미리보기 (백엔드 단독)
```

모든 산출물은 `indexes/`, `findings/`, `state/`, `reports/` 하위로 정리되어 있다. 평탄 경로(`build/harness/*.json`, `*.md`)에 직접 쓰지 않는다.

## 공통 규약

- 모든 JSON은 `generatedAt` ISO-8601 UTC 타임스탬프를 최상위에 둔다.
- 파일 경로는 모두 repo-relative, 슬래시 정규화(`/`)된다.
- 요건 ID는 `REQ-\d{3,}` 패턴이며 항상 배열(`requirements: []`)로 표현한다. 단일값도 길이 1 배열.
- `line`은 1-based. 위치를 알 수 없으면 `0`.
- 사용자 직접 수정 금지. 도구가 생성한다.

## 인덱스 엔트리 최소 형태 (Layer 1)

각 인덱스 파일은 다음 골격을 따른다.

```jsonc
{
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "schemaVersion": "1",
  "source": "front-end.source-index" | "backend.source-index" | ...,
  "entries": [ /* Index entry 목록 (kind별로 분기) */ ],
  "issues": [ /* collector 자체가 보고하는 파싱/구조 issue */ ]
}
```

`entries[]`의 각 항목은 다음 **공통 필드**를 가진다.

```jsonc
{
  "kind": "api" | "dto" | "entity" | "repository" | "service" | "bean" |
          "page" | "route" | "story" | "feature" | "scenario" |
          "test" | "card" | "term" | "test-result" |
          "api-operation" | "api-call",
  "requirements": ["REQ-XXX"],
  "location": {
    "file": "front-end/src/...",
    "line": 0,
    "identity": "...",                      // 도구가 부여하는 안정 키
    "channel": "FE.Page" | "BE.Api" | "FE.Covers" | ...   // 선택
  }
  // ... kind별 추가 필드
}
```

`identity`는 같은 항목을 다시 만들었을 때 동일해야 한다. 위치(line)에 의존하지 않는 키를 권장한다 (예: `front-end/tests/e2e/app-shell.spec.ts > App shell > renders ...`).

### kind별 추가 필드 예시

- `api`: `http`, `controller`, `parameters[]`, `returnType`
- `entity`: `className`, `table`, `columns[]`, `listeners[]`
- `dto`: `className`, `fields[]`, `patchBody`
- `page`: `name`, `route`
- `route`: `path`, `component`
- `story`: `title`, `story`, `component`
- `scenario`: `title`, `featureTitle`, `featureTags[]`, `covers[]`, `steps[]`
- `test`: `source` (`back-end` | `front-end`), `displayName`, `titlePath[]`, `covers[]`, `resultKeys[]`
- `card`: `id`, `title`, `status`, `priority`, `implementationTarget`, `acceptanceCriteria[]`, `openQuestions[]`, `terms[]`, `sectionPresent`, `approved`, `bddReviewIncomplete`, `bddReviewApproved`
- `term`: `key`, `surfaces[]`, `mode`
- `test-result`: `identity`, `alternateIdentities[]`, `status` (`PASS` | `FAIL` | `SKIP` | `NOT_RUN`), `runtime` (`junit` | `playwright`). 엔트리 `kind`는 항상 `"test-result"`이고, runner 구분은 `runtime` 필드를 쓴다.
- `api-operation` (REQ-006, `indexes/openapi.index.json`): `method` (대문자), `path` (OpenAPI paths 키 그대로 — 예: `/users/{id}`), `operationId`. `location.identity`는 `METHOD path`. 인덱스 최상위에 `sha256` (`rawOpenApi`를 객체 키 정렬 canonical JSON으로 직렬화한 값의 SHA-256), `rawOpenApi` (원본 `/v3/api-docs` JSON)을 함께 둔다. 이 인덱스는 `entries[]`와 함께 두 필드를 추가로 갖는 점에서 다른 source index와 다르다.
- `api-call` (REQ-006, `front-end.source-index.json`의 `apiCalls[]`): `method` (대문자), `path` (정규화된 URL 표현). FE `src/api/**` 모듈에서 추출된다. 화면 컴포넌트의 직접 호출은 별도 경계 위반 룰의 입력이지 이 채널이 아니다. payload 최상위에 `apiCalls: [...]`로 둔다 (다른 표면과 같은 위치).
- `front-end.source-index.json`의 `issues[]`: source index가 AST 스캔 중 발견한 FE 정적 위반을 담는다. REQ-008부터 `DIRECT_FETCH_OUTSIDE_API`는 `front-end/src/**` 중 `src/api/**` 밖 직접 `fetch` 호출을 의미하며, Layer 2에서 `FE-API-DIRECT-FETCH` finding으로 정규화된다.
- `scenarios.index.json`의 `issues[]` (REQ-009): 전역 `issues[]`와 각 feature의 `issues[]`에 `{ line, message, kind }` 형태로 담긴다. `kind`는 다음 7개 enum 중 하나이며, Layer 2 validator(`validate-scenarios.mjs`)가 같은 이름의 SCN-* finding으로 정규화한다. `SCN-DIALECT-FORBIDDEN`, `SCN-FEATURE-HEADER-MISSING`, `SCN-REQ-TAG-MISSING`, `SCN-UNSUPPORTED-KEYWORD`, `SCN-STRAY-LINE`, `SCN-COVERS-OUTSIDE-SCENARIO`, `SCN-STEP-OUTSIDE-SCENARIO`. feature에 속한 issue의 SCN-* finding은 `requirements`로 feature의 `@REQ-XXX` 태그를 그대로 옮기고, 전역 issue 또는 태그가 없는 feature의 issue는 `requirements: []`로 두어 전체 게이트(`validateHarness`)만 차단한다.

## 텍스트 채널 (선택 추가 필드)

용어 검사는 인덱스 안에서 발견된 자연어 텍스트를 채널 단위로 모아 쓴다. Collector가 다음 형태로 `textChannels[]`를 같이 emit할 수 있다.

```jsonc
{
  "channel": "FE.Covers" | "FE.TestTitle" | "BE.DisplayName" | "Card.AC" | ...,
  "content": "...",
  "source": "...",         // entity identity
  "file": "...",
  "line": 0,
  "requirements": ["REQ-XXX"]
}
```

채널 이름은 `<도메인>.<역할>` 두 단어로 둔다.

## 검사 결과 최소 형태 (Layer 2)

`findings/*.findings.json`은 다음 골격을 따른다.

```jsonc
{
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "schemaVersion": "1",
  "owner": "back-end-standards" | "front-end-standards" | "scenarios" | "terminology" | "requirement-cards" | "cross-artifact",
  "summary": {
    "error": 0,
    "warning": 0,
    "info": 0,
    "byRuleId": { "BE-E1": 0, "FE-API-01": 0 }
  },
  "findings": [ /* Finding entry 목록 */ ]
}
```

`findings[]`의 각 항목은 다음 **공통 필드**를 가진다.

```jsonc
{
  "ruleId": "BE-E1" | "FE-API-01" | "TRC-COV-01" | "CARD-ID-MISSING" | "REF-API",
  "severity": "error" | "warning" | "info",
  "strictSeverity": "error" | "warning",       // strict 모드에서의 승격값
  "kind": "static" | "cross-artifact" | "card-structure" | "trace" | "reference",
  "message": "...",                            // 사람이 읽는 한 줄 메시지
  "requirements": ["REQ-XXX"],
  "location": {
    "file": "...",
    "line": 0,
    "identity": "...",
    "channel": "..."                           // 선택
  },
  "evidence": { /* 자유 구조 */ },             // 어떤 인덱스 항목/원본을 보고 판단했는지
  "remediation": "..."                         // 선택. 표준 문구 또는 문서 링크
}
```

### kind 사용 가이드

- `static`: 한 파일/한 패키지만 보고 판단 가능한 위반. (BE 정적 검사, FE 정적 검사가 여기 emit)
- `cross-artifact`: 여러 인덱스를 교차해야 판단 가능한 위반. (`TEST_COVERS_NO_SCENARIO_COVERS` 등)
- `card-structure`: 카드 본문 자체의 형식 위반. (필수 섹션 누락 등)
- `trace`: 상태 계산 과정에서 발견된 RED 사유. 단독으로 finding이 되기보다는 state에서 참조로 쓰임.
- `reference`: 알려지지 않은 `REQ-XXX` 참조.

### evidence 사용 가이드

검사기는 자기 판단의 근거가 된 인덱스 항목을 그대로 (또는 핵심만) `evidence`에 박는다. 리포터/IDE가 클릭해서 원본을 찾아갈 수 있게 한다.

```jsonc
"evidence": {
  "test": { "identity": "...", "file": "...", "line": 0 },
  "scenarioCovers": ["...", "..."]
}
```

## 카드 상태 (Layer 3)

`state/trace.state.json`은 다음 형태다.

```jsonc
{
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "schemaVersion": "1",
  "requirements": [
    {
      "id": "REQ-005",
      "title": "프런트엔드 기반 앱 셸",
      "status": "검토중",
      "implementationTarget": "front-end",
      "state": "RED" | "GREEN" | "BLUE",
      "redReasons": [
        {
          "ruleId": "TRACE-NO-FE-SURFACE",
          "message": "관련 FE 화면/스토리 없음",
          "evidence": { "requirementId": "REQ-005", "implementationTarget": "front-end" }
        },
        {
          "ruleId": "TRACE-AC-FAIL",
          "message": "수용 기준 문장: NOT_RUN",
          "evidence": { "criterion": "수용 기준 문장", "status": "NOT_RUN", "requiredChecks": [{ "target": "front-end", "status": "NOT_RUN" }] }
        }
      ],
      "blueBlockedBy": ["요건 카드 상태가 승인 아님: 검토중", "열린 질문 남음"],
      "apis": [/* 연결된 api 인덱스 항목 */],
      "entities": [/* 연결된 entity 인덱스 항목 */],
      "frontEnd": { "pages": [...], "routes": [...], "stories": [...] },
      "coverage": [
        {
          "criterion": "프런트엔드 기반 앱 셸이 표시된다",
          "status": "PASS" | "FAIL" | "SKIP" | "NOT_RUN" | "MISSING",
          "requiredChecks": [{ "target": "front-end", "status": "PASS" }],
          "tests": [/* 연결된 test 인덱스 항목 + result */],
          "scenarios": [/* 연결된 scenario 인덱스 항목 */]
        }
      ]
    }
  ]
}
```

`redReasons[]`는 `{ ruleId, message, evidence }` 객체 배열이다. `ruleId`는 [`rule-namespaces.md`](./rule-namespaces.md)의 `TRACE-*` prefix 중 하나(`TRACE-AC-EMPTY` / `TRACE-NO-API` / `TRACE-NO-FE-SURFACE` / `TRACE-AC-MISSING` / `TRACE-AC-FAIL` / `TRACE-AC-NO-FEATURE`)다. `message`는 리포트에 사람 친화적으로 노출되는 한 줄 문자열이고, `evidence`는 ruleId별로 의미 있는 보조 데이터(예: AC 문장, status, 대상 카드 ID)를 담는다. 리포터(`render-trace-report.mjs`)는 `- [{ruleId}] {message}` 형태로 prefix를 노출한다.

## 리포터 출력 (Layer 4)

`reports/*.md`는 사람이 읽는 형태, `reports/*.json`은 머신 소비 (CI, IDE, 대시보드)다.

- `trace-report.{md,json}`: 전체 카드 state + coverage + 연결된 finding 요약. 단일 카드 필터 실행은 `trace-report-REQ-XXX.{md,json}`처럼 suffix를 붙인다.
- `back-end-standards-report.md`: BE-* 룰별 그룹 보고서.
- `terminology-report.md`: 표준 용어 검사 결과(safe/strict 공유 출력).

리포터는 인덱스/finding/state를 **새로 계산하지 않는다**. 이미 만들어진 JSON만 merge·group·render한다.

## 게이트 (Layer 4)

현재 trace 게이트 진입점은 `gate-trace.mjs`다. 전체 하네스 게이트를 하나로 묶는 `gate.mjs`는 후속 단계에서 도입한다.

```bash
node tools/harness/evaluate-trace-state.mjs --requirement=REQ-005
node tools/harness/gate-trace.mjs --check
node tools/harness/gate-trace.mjs --check --require-blue
```

게이트는 `state/trace.state.json`만 본다. exit code:

- `0`: 게이트 통과
- `1`: 위반 발견 (error severity 또는 RED 상태)
- `2`: CLI 입력 오류

## 스키마 버전

지금은 `schemaVersion: "1"`. 깨는 변경은 메이저를 올린다. 추가 필드는 같은 메이저 안에서 자유.

## 도구가 새로 생길 때

1. Collector라면 `indexes/<name>.index.json` 또는 `indexes/<name>.source-index.json`을 생성한다. 기존 인덱스의 스키마를 흔들지 말고 새 인덱스를 별도로 둔다.
2. Validator라면 자기 `ruleId` prefix를 [`rule-namespaces.md`](./rule-namespaces.md)에 등록하고 `findings/<owner>.findings.json` 한 개만 emit한다.
3. Reporter/Gate가 아니라면 `process.exit` 호출 금지. exit 판정은 Layer 4 gate 도구만 한다.
4. 새 인덱스/finding이 추가되면 본 문서의 `kind`/`ruleId`/디렉터리 트리에 한 줄 추가한다.
