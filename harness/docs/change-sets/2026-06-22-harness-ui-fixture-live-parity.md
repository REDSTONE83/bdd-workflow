# Change Set: 2026-06-22 하네스 UI fixture-라이브 동치

상태: 진행중
요청일: 2026-06-22
변경 유형: 하네스 개선, 수정
영향 요건: REQ-010, REQ-029, REQ-031, REQ-032, REQ-033
논의 상태: 없음

## 요청 요약

- 하네스 UI의 Storybook fixture(`harness/ui/src/lib/harness-data/fixtures.ts`)와 라이브 서버 응답(`artifact-api.ts`의 `build*Model` → `server/index.ts`)을 전수 대조한 결과, **타입 스키마(키)는 모든 모델에서 일치하지만 채움(population) 의미가 갈리는 불일치**를 확인했다. 진단으로 시작해 정합 범위 A(라이브 빌더 보강) + 신선도 함정 해소로 확정하고 구현·검증을 마쳤다.
- 핵심 발견 셋:
  1. **`RequirementDetail.dataShapes[].fields`를 라이브 빌더가 절대 채우지 않는다.** `buildDataShapes`는 무조건 `fields: []`로 만든다(`artifact-api.ts:366`·`369`). 그러나 데이터 계약(`harness/docs/data-contracts.md:343`)은 "API 설계 탭의 `dataShapes[]`는 Request/Response와 참조 객체용 DTO shape를 담는다"고 규정하고, 원천 `backend.source-index.json`에는 DTO `fields[]`가 실재한다(12개 DTO, 예: `CreateCategoryRequest` = name/color/description/displayOrder). 즉 **계약이 요구하는 필드 구성을 구현이 비워두는 계약 위반**이다.
  2. **하네스 요건 fixture가 백엔드 표면을 가짜로 채운다.** `requirementDetail` fixture(REQ-031, 하네스 요건)는 `apiSurfaces` 2건·`dataShapes` 7건·`entitySurfaces` 1건(앱 `Category` 엔티티)을 담지만, 하네스 요건은 백엔드 표면이 없어 라이브 응답은 셋 다 빈 배열이다. Storybook은 API/DB 탭이 가득 차 보이고 라이브 UI는 전부 `EmptyState`로 빈다.
  3. **fixture↔라이브 동치를 검증하는 계약 테스트가 없다.** `fixtures.test.ts`·`requirement-fixtures.test.ts`는 fixture의 내적 일관성만 검증한다. fixture를 풍부하게 채우면 (UI) 수용 기준이 Storybook Vitest로 GREEN을 통과하지만 라이브 서버는 같은 데이터를 안 만들어도 무방했다. REQ-032 AC("Request/Response 필드 구성과 중첩 객체 필드는 펼침으로 확인된다")가 라이브에서는 실제로 미충족인데 승인까지 도달한 경위가 이 허점이다.

### 전수 대조 결과 (구현 전 진단 시점)

`build*Model`을 실데이터로 실행해 fixture와 1:1 비교했다(app scope는 `npm run app:trace`로 21개 요건 전량 갱신 후).

| 모델 · 필드 | 라이브 API | fixture | 판정 |
|---|---|---|---|
| 모든 모델 최상위 키 / 배열 원소 키 | 일치 | 일치 | ✓ 스키마 동일 |
| `RequirementDetail.dataShapes[].fields` | 항상 `[]` (앱 REQ-022도 `[0,0,0,0]`) | 채움 `[5,1,3,11,3,10,5]` | ❗ 계약 위반(빌더 미구현) |
| 하네스 요건 `apiSurfaces`/`dataShapes`/`entitySurfaces` (REQ-031) | `0`/`0`/`0` | `2`/`7`/`1`(앱 `Category`) | ❗ fixture 비현실 |
| `redReasons`·`blueBlockedBy` / `Gate.findings` | `0` (현재 BLUE·게이트 PASS) | 채움 1건 | △ Storybook 전용 RED 대표 상태(라이브 재현 불가) |
| `Board.rows`·`Terminology.terms`·`ChangeSets.rows` 개수 | 전량(16~88) | 대표 샘플(1~7) | ✓ 의도된 축약 |
| (참고) 앱 요건 `apiSurfaces`/`entitySurfaces` (REQ-022) | `1`/`1` 채워짐 | — | ✓ 빌더 정상(fields만 공백) |

판정 요약: **구조는 깨지지 않았다. 진짜 갭은 (1) `dataShapes[].fields` 미구현, (2) 하네스 요건 fixture의 가짜 백엔드 표면, (3) 동치 회귀 테스트 부재** 세 가지다.

## 작업 범위

확정 범위: A(라이브 빌더 보강) + 신선도 함정 함께. P1·P2·P3·P4를 모두 구현한다.

- **P1 — 라이브 빌더 보강.** `buildDataShapes`가 `backend.source-index.json`의 DTO `fields[]`를 읽어 `RequirementDataField[]`(name/type/required/description)를 채운다. `required`는 `NotBlank`/`NotNull` 어노테이션에서, 중첩 참조는 `javaType`이 가리키는 DTO를 `Object` shape로 펼쳐 해소한다. 부수로 `cleanJavaType`이 `JsonNullable<T>`를 풀고, `buildApiSurfaces` 응답에서 상태 코드(201/400 등)를 제외해 `dataShapes`를 DTO shape로만 한정한다(`data-contracts.md:343` 정합).
- **P2 — fixture 정직화.** 하네스 요건 `requirementDetail`에서 가짜 백엔드 표면을 제거하고, 백엔드 표면이 실재하는 앱 요건 fixture `appRequirementDetail`(REQ-022 기반)을 추가한다. 백엔드 3필드는 라이브 출력을 그대로 옮긴다. `DesignSurfaces`·`LinkedArtifacts` 스토리와 API·DB·소스 탭 단위 테스트를 이 fixture로 옮긴다.
- **P3 — 동치 회귀 self-test.** `parity.test.ts`가 `appRequirementDetail`의 백엔드 표면을 라이브 `buildRequirementDetailModel("application","REQ-022")`와 deep equal로, 하네스 요건의 백엔드 표면이 비어 있음을 라이브 REQ-031과 대조한다.
- **P4 — app trace 신선도 함정.** canonical `trace.state.json`은 항상 전체 trace로 쓰고, 슬라이스(`--requirement`)는 `HARNESS_TRACE_STATE_FILE` 격리 파일에 추가로 쓴다. `render-trace-report`·`gate`가 그 파일을 읽어 슬라이스 리포트·게이트를 유지한다. 단일 슬라이스가 canonical을 1건으로 덮던 함정을 제거한다.

## 제외 범위

- 추적/게이트 판정 로직 변경. 표시 전용 원칙(REQ-010 단일 게이트)을 유지하며 화면·서버는 판정을 재계산하지 않는다.
- 라이브 명령 실행 backend, 인증·원격 접근 등 기존 제외 항목.
- `apiSurfaces`/`entitySurfaces` 빌더 자체 재작성. 이들은 앱 요건에서 이미 채워진다(`fields`만 공백).

## 완료 조건

- 앱 요건 라이브 응답의 `dataShapes[].fields`가 `backend.source-index` DTO 필드와 일치하고, 라이브 REQ-022가 Request/Response/중첩 `Object` shape를 채운다. ✓
- 하네스 요건 라이브 응답과 fixture의 백엔드 표면이 모두 비어 동일하다. ✓
- fixture↔`build*Model` 동치 self-test(`parity.test.ts`)가 통과한다. ✓
- 슬라이스 `app:trace -- --requirement REQ-XXX` 후 canonical `trace.state.json`이 전체(21건)로 보존된다. ✓
- `cd harness/ui && npm run typecheck && npm run test && npm run test:storybook`, `npm run harness:validate`, `npm run app:validate`가 모두 통과한다. ✓

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test`
- `cd harness/ui && npm run test:storybook`
- `npm run harness:self-test`
- `npm run harness:validate`

## 검증 결과

- 2026-06-22: 진단. `npm run app:trace`로 app trace.state를 21개 전량으로 갱신한 뒤(직전엔 단일 슬라이스 REQ-005 1건만 남아 있었음) `build*Model`을 실데이터로 실행해 fixture와 전수 대조했다. 위 표가 그 결과다.
- 2026-06-22: P1 구현 후 라이브 REQ-022가 `dataShapes` 3건(Request `CreateTodoRequest` 5필드, Response `TodoResponse` 7필드, 중첩 `Object` `TodoCategoryInfo` 3필드)을 채우고 상태 코드가 빠진 것을 확인했다. 하네스 REQ-031은 백엔드 표면 0을 유지한다.
- 2026-06-22: P4 검증. `npm run app:trace`(전체) → canonical 21건. 이어 `npm run app:trace -- --requirement REQ-005` → canonical 21건 보존, slice 파일 1건 생성, `gate: pass filter=REQ-005`, `trace-report-REQ-005.{md,json}` 생성.
- 2026-06-22: `cd harness/ui && npm run typecheck`(통과), `npm run test`(38 passed, parity 3건 포함), `npm run test:storybook`(69 passed, RequirementDetail 10건 포함).
- 2026-06-22: `npm run harness:validate` `gate: pass`, `npm run app:validate` `gate: pass`. 두 scope 게이트 모두 통과.

## 결정 로그

- 2026-06-22: `dataShapes[].fields`는 잔재가 아니라 **계약상 필수**로 판정한다. `data-contracts.md:343`이 `dataShapes[]`에 DTO shape를 요구하고, REQ-032 카드의 표시 필드·AC가 "Request/Response 필드 구성과 중첩 객체 필드"를 명시하며, `backend.source-index.json`에 원천 `fields[]`가 존재한다. 따라서 정합 방향의 1순위는 fixture 축소가 아니라 라이브 빌더 보강(P1)이다.
- 2026-06-22: 하네스 요건의 백엔드 표면은 fixture가 틀린 것으로 판정한다. 하네스 요건은 구조상 JPA 엔티티·Spring API를 갖지 않으므로 라이브의 빈 배열이 정답이며, fixture가 앱 엔티티(`Category`)를 차용한 것은 비현실적이다(P2).
- 2026-06-22: 1차 원인은 검증 채널 허점으로 판정한다. fixture가 라이브 출력과 분리 검증되어 (UI) AC가 Storybook만으로 통과했다. 채택 범위와 무관하게 동치 회귀 테스트(P3)를 둔다.
- 2026-06-22: 정합 범위는 A(라이브 빌더 보강) + 신선도 함정 함께로 확정한다(사용자 선택). `fields`를 라이브에서 채워 REQ-032 AC를 실제로 충족하고, 함정도 같은 Change Set에서 해소한다.
- 2026-06-22: 응답 `dataShapes`에서 상태 코드(201/400 등)를 제외한다. `data-contracts.md:343`은 `dataShapes[]`를 Request/Response·참조 객체 DTO shape로 규정하므로 상태 코드는 DTO shape가 아니다. REQ-032 표시 필드에도 상태 코드는 없다.
- 2026-06-22: P4는 canonical/슬라이스 출력 분리로 푼다. canonical `trace.state.json`은 전체 trace 전용으로 두고, 슬라이스는 `HARNESS_TRACE_STATE_FILE` 격리 파일에 쓴다. `gate`는 격리 state든 canonical+자체 필터든 같은 결과라 안전하고, run-output mirror가 canonical을 지우지 않도록 evaluate가 canonical을 항상 전체로 함께 쓴다.

## 열린 논의

- 없음
