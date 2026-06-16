# 하네스 데이터 계약

이 문서는 하네스 도구들이 주고받는 JSON의 **최소 형태**와 **저장 위치**를 정의한다. 새 collector, validator, reporter를 추가할 때는 이 계약을 따른다. 계약을 흔드는 변경은 표준 변경 절차([`standards/requirement-card.md`](./standards/requirement-card.md))를 따른다.

자세한 layer 분리는 [`overview.md`](./overview.md)의 "파이프라인 구조" 절을, 룰 prefix 규약은 [`rule-namespaces.md`](./rule-namespaces.md)를 본다.

## 산출물 디렉터리 레이아웃

하네스 도구는 같은 JSON 계약을 애플리케이션 scope와 하네스 scope에 각각 적용한다.

```text
build/app/       app/docs + app/back-end + app/front-end 검증 산출물
build/harness/   harness/docs + harness/tools + harness/self-test 검증 산출물
```

각 scope의 하위 구조는 동일하다.

```text
build/{app|harness}/
  indexes/                                     # Layer 1: collector 출력
    backend.source-index.json
    front-end.source-index.json
    scenarios.index.json
    terminology.index.json
    requirements.index.json
    change-sets.index.json
    test-results.index.json
    openapi.index.json                         # app scope: Spring /v3/api-docs dump 정규화
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
    requirement-schema-report.md
    requirement-schema-report.json
    change-set-report.md
    change-set-report.json
    gate-report.json                           # REQ-033 도입 후: UI용 게이트 카테고리 요약
    back-end-standards-report.md
    terminology-report.md
  test-results/                                # scope별 테스트 결과 XML
    nodeSelfTest/
    generateOpenApiIndex/
  schema-preview.sql                           # Entity DDL 미리보기 (백엔드 단독)
```

하네스 scope에서는 `backend.source-index.json`, `openapi.index.json`, `generateOpenApiIndex/`, `schema-preview.sql`을 기본 입력으로 요구하지 않는다. `harness/ui` 도입 이후 `front-end.source-index.json`은 하네스 UI page/story/Storybook Vitest 테스트 메타데이터를 담는 하네스 scope 입력으로 사용한다. 필요한 비-UI 계약은 self-test fixture가 직접 만든다.

모든 산출물은 `indexes/`, `findings/`, `state/`, `reports/`, `test-results/` 하위로 정리되어 있다. 평탄 경로(`build/app/*.json`, `build/harness/*.json`, `*.md`)에 직접 쓰지 않는다.

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
  "source": "front-end.source-index" | "backend.source-index" | "harness.self-test.index" | ...,
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
          "api-operation" | "api-call" | "api-usage" | "change-set",
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
- `story`: `title`, `story`, `component`, `hasPlay`, `hasAssertion`. `hasPlay`는 story export가 `play` 함수를 가진다는 뜻이고, `hasAssertion`은 해당 `play` 본문 또는 참조 helper에서 `expect(...)`/assertion 호출이 발견됐다는 뜻이다.
- `scenario`: `title`, `featureTitle`, `featureTags[]`, `covers[]`, `steps[]`
- `test`: `source` (`back-end` | `front-end` | `harness`), `runtime` (`junit` | `playwright` | `node` | `storybook-vitest`), `displayName`, `titlePath[]`, `covers[]`, `resultKeys[]`, `hasPlay`, `hasAssertion`. Storybook Vitest test 엔트리는 story 엔트리와 같은 `hasPlay`/`hasAssertion` 값을 보존한다.
- `card`: `id`, `title`, `status`, `priority`, `requirementType`, `specRole`, `targetSystem`, `productArea`, `qualityAttributes[]`, `verificationLevel`, `parentRequirementIds[]`, `relatedRequirementIds[]`, `replacedByRequirementIds[]`, `purpose`, `scopeItems[]`, `acceptanceCriteria[]`, `verificationTargets`, `apiSkeleton[]`, `dbSkeleton[]`, `uiSkeleton[]`, `storybookContract[]`, `openQuestions[]`, `terms[]`, `outOfScopeItems[]`, `decisionLogs[]`, `sectionPresent`, `approved`, `bddReviewResult`, `bddReviewIncomplete`, `bddReviewApproved`. `purpose`는 `사용자/목적` 섹션의 본문 문자열이다. `scopeItems[]`, `outOfScopeItems[]`, `terms[]`는 각 섹션의 bullet 목록이다. `decisionLogs[]`는 `의사결정 로그` 섹션의 `{ date, decision, reason, decisionMaker, impact }` 목록이다. `parentRequirementIds[]`는 카드 헤더의 `상위 요건`에서 온 단일 소스이며, `없음`이면 빈 배열이다. `acceptanceCriteria[]`는 `string`이 아니라 `{ text, target, invalidMarker?, line }` 객체 배열이다. `line`은 카드 본문 전체 기준 1-based AC bullet 줄 번호다. `text`는 bullet 시작의 마커 토큰을 제거한 원문, `target`은 `API | UI | E2E | STATIC | null`, `invalidMarker`는 bullet 시작에 마커처럼 보이는 토큰이 있으나 허용 목록 밖일 때만 채워진다. 같은 카드의 `@Covers`, Storybook Vitest `covers`, live Playwright `Covers`, `.feature` `Covers:` 매칭은 모두 `text` 값으로 한다. `verificationTargets`는 `API`, `DB`, `UI`, `Storybook`, `E2E`, `STATIC` 같은 키를 `{ required: boolean | null, raw: string }`으로 둔다. `storybookContract[]`는 `{ title, states[], raw }` 형태이며 `title`은 Storybook sidebar title, `states[]`는 named export 이름이다. `bddReviewResult`는 `BDD 테스트 리뷰` 섹션에서 최신 `결과:` 라인만 추출한 `{ line, status, normalizedStatus } | null`이며, `Skeleton 결과:`와 자유 텍스트는 제외한다. `bddReviewIncomplete`/`bddReviewApproved`는 이 최신 결과 라인에서 계산한다.
- `change-set`: `title`, `status`, `requestedDate`, `changeTypes[]`, `affectedRequirementIds[]`, `discussionStatus`, `requestSummary[]`, `scopeItems[]`, `outOfScopeItems[]`, `completionCriteria[]`, `verificationCommands[]`, `decisions[]`, `openDiscussions[]`, `sectionPresent`, `referencedRequirementIds[]`. Change Set은 별도 사람이 관리하는 ID를 만들지 않으므로 `location.identity`는 repo-relative 파일 경로다. `requirements[]`에는 `affectedRequirementIds[]`를 그대로 둔다.
- `term`: `key`, `surfaces[]`, `mode`
- `test-result`: `identity`, `alternateIdentities[]`, `status` (`PASS` | `FAIL` | `SKIP` | `NOT_RUN`), `runtime` (`junit` | `playwright` | `node` | `storybook-vitest`). 엔트리 `kind`는 항상 `"test-result"`이고, runner 구분은 `runtime` 필드를 쓴다.
- `api-operation` (REQ-006, `indexes/openapi.index.json`): `method` (대문자), `path` (OpenAPI paths 키 그대로 — 예: `/users/{id}`), `operationId`. `location.identity`는 `METHOD path`. 인덱스 최상위에 `sha256` (`rawOpenApi`를 객체 키 정렬 canonical JSON으로 직렬화한 값의 SHA-256), `rawOpenApi` (원본 `/v3/api-docs` JSON)을 함께 둔다. 이 인덱스는 `entries[]`와 함께 두 필드를 추가로 갖는 점에서 다른 source index와 다르다.
- `api-call` (REQ-006, `front-end.source-index.json`의 `apiCalls[]`): 실제 FE 정적 API 호출. `method` (대문자), `path` (정규화된 URL 표현), `callee`, `apiModule`, `requirements[]`. FE `src/**`의 `apiClient.METHOD("/path", ...)` literal 호출과 `src/api/**` 내부의 literal `fetch("/path", ...)`에서 추출된다. payload 최상위에 `apiCalls: [...]`로 둔다.
- `api-usage` (`front-end.source-index.json`의 `apiUsages[]`): 파일 상단 JSDoc `@UsesApi METHOD /path [trigger]` 선언에서 추출한 화면/API 사용 계약. `method`, `path`, `trigger`, `route`, `page`, `surfaceType`, `requirements[]`, `file`, `line`을 가진다. 정적 validator는 같은 요건 안에서 `apiUsages[]`와 `apiCalls[]`의 method+path 집합을 비교한다.
- `front-end.source-index.json`의 `issues[]`: source index가 AST 스캔 중 발견한 FE 정적 위반을 담는다. REQ-008부터 `DIRECT_FETCH_OUTSIDE_API`는 `front-end/src/**` 중 `src/api/**` 밖 직접 `fetch` 호출을 의미하며, Layer 2에서 `FE-API-DIRECT-FETCH` finding으로 정규화된다.
- `scenarios.index.json`의 `issues[]` (REQ-009): 전역 `issues[]`와 각 feature의 `issues[]`에 `{ line, message, kind }` 형태로 담긴다. `kind`는 다음 7개 enum 중 하나이며, Layer 2 validator(`validate-scenarios.mjs`)가 같은 이름의 SCN-* finding으로 정규화한다. `SCN-DIALECT-FORBIDDEN`, `SCN-FEATURE-HEADER-MISSING`, `SCN-REQ-TAG-MISSING`, `SCN-UNSUPPORTED-KEYWORD`, `SCN-STRAY-LINE`, `SCN-COVERS-OUTSIDE-SCENARIO`, `SCN-STEP-OUTSIDE-SCENARIO`. feature에 속한 issue의 SCN-* finding은 `requirements`로 feature의 `@REQ-XXX` 태그를 그대로 옮기고, 전역 issue 또는 태그가 없는 feature의 issue는 `requirements: []`로 두어 scope 전체 게이트만 차단한다.

## 표준 용어 인덱스

`build/{app|harness}/indexes/terminology.index.json`은 표준 용어 검증과 하네스 UI 표준 용어 조회 화면의 입력이다. 이 파일은 일반 `entries[]` source index와 달리 key 기반 객체를 최상위에 둔다.

최소 형태:

```jsonc
{
  "generatedAt": "2026-06-12T00:00:00.000Z",
  "counts": {
    "approved": 0,
    "draft": 0
  },
  "terms": {
    "harness.standardTerm": {
      "status": "approved" | "draft",
      "sourceFile": "harness/docs/terminology/domains/harness.json",
      "ko": "표준 용어",
      "en": "standard term",
      "meaning": "...",
      "allow": ["용어"],
      "ban": ["..."],
      "names": {
        "java": ["..."],
        "method": ["..."],
        "field": ["..."],
        "column": ["..."],
        "table": ["..."],
        "json": ["..."],
        "path": ["..."]
      },
      "note": "...",
      "reason": "..."
    }
  },
  "surfaceIndex": {},
  "codeNameIndex": {},
  "nameDuplicates": []
}
```

`terms`의 객체 key가 term key다. 하네스 UI 서버가 화면 DTO를 만들 때 `status`, `sourceFile`, `ko`, `en`, `meaning`, `allow`, `ban`, `names`, `note`, `reason` 값을 보존해야 한다. 검색과 필터는 이 DTO 위에서 수행하되, 용어 사전 원본 파일을 UI 컴포넌트가 직접 읽지 않는다.

## 게이트 요약 리포트 (Layer 4)

REQ-033 구현 이후 통합 게이트 도구는 실행할 때마다 UI가 읽을 수 있는 `build/{app|harness}/reports/gate-report.json`을 만든다. 이 파일은 화면용 캐시일 뿐이며, 카테고리 판정의 원천은 여전히 `harness/tools/gate.mjs`다.

최소 형태:

```jsonc
{
  "generatedAt": "2026-06-10T00:00:00.000Z",
  "schemaVersion": "1",
  "source": "gate",
  "scope": "harness",
  "summary": {
    "passed": false,
    "traceFailing": true,
    "categoryFailing": true
  },
  "categories": [
    {
      "category": "TRACE",
      "blocked": true,
      "errors": 3,
      "byRuleId": { "TRACE-AC-MISSING": 3 },
      "findingRefs": []
    }
  ]
}
```

`categories[]`는 `TRACE`, `CARD`, `REF`, `TRC`, `BE`, `FE`, `SCN`, `TRM` 순서를 유지한다. `blocked`, `errors`, `byRuleId`, `findingRefs`는 게이트 도구가 계산한 값을 그대로 둔다. 하네스 UI는 이 파일을 읽어 표시할 수 있지만 카테고리 분류나 차단 여부를 자체 계산하지 않는다.

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
      "title": "애플리케이션 기본 앱 셸",
      "file": "app/docs/requirements/REQ-005-app-shell.md",
      "status": "검토중",
      "requirementType": "기능",
      "specRole": "원자 요건",
      "targetSystem": "application",
      "productArea": "platform",
      "qualityAttributes": ["usability"],
      "verificationLevel": "mixed",
      "parentRequirementIds": [],
      "childRequirementIds": [],
      "state": "RED" | "GREEN" | "BLUE" | "INACTIVE",
      "redReasons": [
        {
          "ruleId": "TRACE-AC-FAIL",
          "message": "수용 기준 문장: NOT_RUN",
          "evidence": { "criterion": "수용 기준 문장", "status": "NOT_RUN", "requiredChecks": [{ "target": "ui", "status": "NOT_RUN" }] }
        }
      ],
      "blueBlockedBy": ["요건 카드 상태가 승인 아님: 검토중", "열린 질문 남음"],
      "apis": [/* 연결된 api 인덱스 항목 */],
      "entities": [/* 연결된 entity 인덱스 항목 */],
      "frontEnd": { "pages": [...], "routes": [...], "stories": [...], "apiUsages": [...], "apiCalls": [...] },
      "coverage": [
        {
          "criterion": "애플리케이션 기본 앱 셸이 표시된다",
          "target": "API" | "UI" | "E2E" | "STATIC" | null,
          "line": 42,
          "status": "PASS" | "FAIL" | "SKIP" | "NOT_RUN" | "MISSING",
          "requiredChecks": [{ "target": "api" | "ui" | "e2e" | "static" | "unknown", "status": "PASS" }],
          "tests": [/* 연결된 test 인덱스 항목 + result */],
          "scenarios": [/* 연결된 scenario 인덱스 항목 */]
        }
      ]
    }
  ]
}
```

coverage row의 `target`은 AC 단위 마커(`API`/`UI`/`E2E`/`STATIC`/`null`)이고, 같은 row의 `requiredChecks[].target`은 evaluator가 실제로 요구하는 검증 단위 라벨이다.

- `api`: 백엔드 Acceptance Test 커버만 요구한다.
- `ui`: application scope와 harness scope 모두 Storybook Vitest 테스트 커버를 요구한다.
- `e2e`: 프런트엔드 사용자 여정 테스트 커버를 요구한다. 애플리케이션 상위 요건의 `E2E`는 별도 정적 규칙으로 live Playwright 위치를 강제한다.
- `static`: 백엔드 Acceptance Test, Storybook Vitest 테스트, live Playwright 테스트 중 요건 scope와 검증 대상에 맞는 커버를 인정한다.
- `unknown`: AC 마커가 없거나 인식되지 않아 검증 채널을 계산할 수 없다. 카드 구조 오류와 TRACE RED가 함께 발생한다.

AC marker가 `null`일 때의 카드 단위 fallback은 없다.

`redReasons[]`는 `{ ruleId, message, evidence }` 객체 배열이다. `ruleId`는 [`rule-namespaces.md`](./rule-namespaces.md)의 `TRACE-*` prefix 중 하나(`TRACE-AC-EMPTY` / `TRACE-AC-MISSING` / `TRACE-AC-FAIL` / `TRACE-AC-NO-FEATURE`)다. `message`는 리포트에 사람 친화적으로 노출되는 한 줄 문자열이고, `evidence`는 ruleId별로 의미 있는 보조 데이터(예: AC 문장, status, 대상 카드 ID)를 담는다. 리포터(`render-trace-report.mjs`)는 `- [{ruleId}] {message}` 형태로 prefix를 노출한다.

하네스 UI 요건 상세 DTO는 `coverage[]`, scenario index의 scenario 항목, `apis[]`, `entities[]`, `frontEnd.pages/routes/stories/apiUsages/apiCalls[]`와 각 source index 원본을 얇게 정리해 AC 목록, BDD 시나리오 목록, API 작업, Request, Response, Entity, UI surface 연결을 표시할 수 있다. 이 DTO는 새 판정을 만들지 않으며, 원천 항목의 AC 문장/channel/status/tests/scenarios, scenario title/covers/steps/file/line, method/path/operationId, parameters/returnType, DTO className/fields, Entity table/className/listeners/columns, story title/story/file/line을 화면에 맞게 묶는다. API 계약 탭의 `dataShapes[]`는 Request/Response와 참조 객체용 DTO shape를 담고, Entity 탭의 `entitySurfaces[]`는 trace state `entities[]`의 DB table과 JPA Entity/column 메타데이터를 담는다. Entity 화면 표현은 DB table과 columnName, PK 여부, nullable, unique, updatable, length를 우선하고 JPA className, listener, fieldName, javaType, annotation은 보조 정보로 둔다. 요건 상세 화면에서 테스트 정보는 별도 테스트 탭이 아니라 AC 항목과 BDD 시나리오 항목에 포함한다. AC 항목은 같은 AC 문장의 `coverage[]` row에서 테스트를 가져오고, BDD 시나리오 항목은 scenario `covers[]`와 일치하는 `coverage[]` row들의 테스트를 중복 제거해 보여준다. 연결 산출물 항목은 `card`, `scenario` 두 종류만 사용한다. 소스코드 항목은 연결 산출물 파일을 제외하고 `api:{operationId}`, `Request:{name}`, `Response:{name}`, `Entity:{table}`, `Page:{name}`, `Route:{name}`, `Story:{name}`처럼 종류와 세부 이름을 분리할 수 있는 값을 권장한다. 화면 뱃지는 `Page`/`Route`/`Story`를 `UI Page`/`UI Route`/`UI Story`로 표시한다. UI surface는 카드별 `description`을 선택 필드로 가질 수 있으며, Storybook URL은 story title과 named export에서 파생한 검토 링크로 제공할 수 있고, 파일 위치는 구현 확인용 보조 링크로 유지한다.

## 리포터 출력 (Layer 4)

`reports/*.md`는 사람이 읽는 형태, `reports/*.json`은 머신 소비 (CI, IDE, 대시보드)다.

- `trace-report.{md,json}`: 전체 카드 state + coverage + 연결된 finding 요약. 단일 카드 필터 실행은 `trace-report-REQ-XXX.{md,json}`처럼 suffix를 붙인다. trace summary는 최신 `change-set-report.json`의 `summary.changeSetWarnings`를 `Change Set warnings: N`으로 함께 표시하지만, 이 값은 report-only 가시성 정보이며 게이트 차단 조건이 아니다.
- `requirement-schema-report.{md,json}`: 새 요건 카드 스키마 적합성 리포트. 카드별 누락/허용값/마커/관련 요건 오류를 `CARD-*` finding 기준으로 묶는다.
- `change-set-report.{md,json}`: 사용자 요청 단위 작업 범위와 영향 REQ의 카드 스키마 상태, RED/GREEN/BLUE 상태를 묶는다. Change Set은 게이트 입력이 아니라 진행 상태 리포트다.
- `back-end-standards-report.md`: BE-* 룰별 그룹 보고서.
- `terminology-report.md`: 표준 용어 검사 결과(safe/strict 공유 출력).

리포터는 인덱스/finding/state를 **새로 계산하지 않는다**. 이미 만들어진 JSON만 merge·group·render한다.

## 게이트 (Layer 4)

scope별 게이트 단일 진입점은 `harness/tools/gate.mjs`다 (REQ-010). 입력은 다음 3종이다.

- `build/{app|harness}/state/trace.state.json` — Layer 3 산출. TRACE 카테고리(RED/GREEN/BLUE 카운트)와 게이트 필터/모드를 읽는다.
- `build/{app|harness}/findings/{back-end-standards,front-end-standards,scenarios,requirement-cards,cross-artifact}.findings.json` — Layer 2 표준/구조/참조 검사 결과.
- `build/{app|harness}/findings/terminology.findings.json` — Layer 2 표준 용어 검사 결과(safe 모드로 emit되지만 `strictSeverity: error` 필드를 함께 갖는다).

`gate.mjs`는 위 입력을 다시 계산하지 않는다. finding을 owner/ruleId로 8개 카테고리에 매핑하고 모드 플래그(`--check`/`--require-blue`)로 차단 여부를 결정한다.

```bash
npm run app:validate
npm run harness:validate
npm run harness:trace -- --check --requirement REQ-010
```

### 8개 카테고리 라벨

| 카테고리 | 입력 | 차단 조건 |
| -------- | ---- | --------- |
| `TRACE`  | `trace.state.json` `requirements[]` (선택 카드 ID로 다시 카운트한 RED/GREEN/total) | `--check`: `total === 0`, 상태 미기재 legacy RED, `테스트 승인`/`구현중`의 테스트 누락·미실행·스킵 RED, `검증중`/`승인` RED. `--require-blue`: 그 위에 `승인` 상태 GREEN. |
| `CARD`   | `findings/requirement-cards.findings.json` (owner `requirement-cards`, ruleId prefix `CARD-*`) | `severity: error` finding |
| `REF`    | `findings/cross-artifact.findings.json`의 `REF-*` ruleId (REF-API/REF-TEST/REF-ENTITY/REF-FEATURE/REF-FE-SURFACE/REF-CARD) | `severity: error` finding |
| `TRC`    | `findings/cross-artifact.findings.json`의 `TRC-*` ruleId (TRC-COV-* warning은 정보 출력만, 차단하지 않음) | `severity: error` finding |
| `BE`     | `findings/back-end-standards.findings.json` (owner `back-end-standards`, ruleId prefix `BE-*`) | `severity: error` finding |
| `FE`     | `findings/front-end-standards.findings.json` (owner `front-end-standards`, ruleId prefix `FE-*`) | `severity: error` finding |
| `SCN`    | `findings/scenarios.findings.json` (owner `scenarios`, ruleId prefix `SCN-*`) | `severity: error` finding |
| `TRM`    | `findings/terminology.findings.json` (owner `terminology`) | `strictSeverity: error` finding |

`--requirement REQ-XXX` 단일 카드 모드에서는 finding의 `requirements[]`와 선택 카드 ID 교집합이 비어 있지 않은 finding만 카테고리 카운트에 합산한다. `requirements: []` 전역 finding은 단일 카드 게이트에서는 차단되지 않고 해당 scope 전체 게이트(`app:validate` 또는 `harness:validate`)에서만 차단된다. `TRACE` 카운트도 같은 selectedIds 로 `state.requirements[]` 에서 다시 계산한다 — `state.summary` 의 미리 계산된 RED/GREEN 값은 state 생성 시점의 필터 기준이라 CLI `--requirement` 와 다를 수 있다.

### exit code

- `0`: 모든 카테고리 통과
- `1`: 한 카테고리 이상 차단 사유 발견
- `2`: CLI 입력 오류 또는 필수 입력 파일 누락

## 스키마 버전

지금은 `schemaVersion: "1"`. 깨는 변경은 메이저를 올린다. 추가 필드는 같은 메이저 안에서 자유.

## 도구가 새로 생길 때

1. Collector라면 `indexes/<name>.index.json` 또는 `indexes/<name>.source-index.json`을 생성한다. 기존 인덱스의 스키마를 흔들지 말고 새 인덱스를 별도로 둔다.
2. Validator라면 자기 `ruleId` prefix를 [`rule-namespaces.md`](./rule-namespaces.md)에 등록하고 `findings/<owner>.findings.json` 한 개만 emit한다.
3. Reporter/Gate가 아니라면 `process.exit` 호출 금지. exit 판정은 Layer 4 gate 도구만 한다.
4. 새 인덱스/finding이 추가되면 본 문서의 `kind`/`ruleId`/디렉터리 트리에 한 줄 추가한다.
