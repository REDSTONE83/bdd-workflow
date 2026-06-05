# 코드 중심 BDD 하네스 개요

## 목표

요건 카드, 시나리오, 코드, 테스트 결과를 `REQ-XXX` 하나로 연결한다. 사람이 직접 관리하는 ID는 요건 ID뿐이며, API ID, 화면 ID, 시나리오 ID는 만들지 않는다.

저장소는 애플리케이션과 하네스를 최상위에서 분리한다.

```text
app/       애플리케이션 문서와 소스
harness/   하네스 문서와 도구/self-test
build/app      애플리케이션 검증 산출물
build/harness  하네스 검증 산출물
```

## Scope

애플리케이션 scope는 `app/docs`, `app/back-end`, `app/front-end`를 입력으로 보고 `build/app`에 인덱스, finding, trace, report를 생성한다.

하네스 scope는 `harness/docs`, `harness/tools`, `harness/source-indexer`, `harness/annotations`, `harness/self-test`를 입력으로 보고 `build/harness`에 인덱스, finding, trace, report를 생성한다. 하네스 self-test는 애플리케이션 생성 파일을 직접 갱신하지 않고 fixture로 계약을 검증한다.

## 추적 구조

```text
요건 카드
  app/docs/requirements/REQ-XXX-*.md
  harness/docs/requirements/REQ-XXX-*.md
  수용 기준(AC), 대상 시스템, 검증 수준, 열린 질문, 승인 상태

Change Set
  app/docs/change-sets/*.md
  harness/docs/change-sets/*.md
  사용자 요청 단위 작업 범위. 명세 원천이 아니며 파일 경로가 identity.

시나리오 문서
  app/docs/scenarios/REQ-XXX-*.feature
  harness/docs/scenarios/REQ-XXX-*.feature
  @REQ-XXX + Covers: AC 문장 목록

애플리케이션 코드
  app/back-end/src/main/java
  app/back-end/src/test/java
  app/front-end/src
  app/front-end/tests/e2e

하네스 코드
  harness/tools
  harness/source-indexer
  harness/annotations
  harness/self-test

리포트
  build/app/reports/*
  build/harness/reports/*
```

`@Covers` 또는 FE/Harness `Covers` 메타데이터가 있는 테스트만 AC 커버리지에 포함된다. `.feature`는 공유 BDD 명세와 추적 입력으로만 사용하며 Cucumber 런타임은 도입하지 않는다.

## 파이프라인

도구는 4개 layer로 나뉜다.

```text
Layer 1 Collect   원본 -> build/{scope}/indexes/*.json
Layer 2 Validate  indexes -> build/{scope}/findings/*.findings.json
Layer 3 Trace     indexes + findings -> build/{scope}/state/trace.state.json
Layer 4 Report    state + findings -> build/{scope}/reports/* + gate exit code
```

`harness/tools/trace-requirements.mjs`는 `evaluate-trace-state.mjs` → `render-trace-report.mjs` → `render-requirement-schema-report.mjs` → `render-change-set-report.mjs` → `gate.mjs`를 직렬 실행한다.

`gate.mjs`는 REQ-010의 단일 게이트 구현이며 실패를 8개 카테고리로 분리한다.

```text
TRACE  RED/GREEN/BLUE 상태
CARD   요건 카드 구조
REF    알려지지 않은 REQ 참조
TRC    cross-artifact trace error
BE     백엔드 표준
FE     프런트엔드 표준
SCN    시나리오 구조
TRM    표준 용어 strict error
```

세부 JSON 계약은 [`data-contracts.md`](./data-contracts.md), 룰 prefix는 [`rule-namespaces.md`](./rule-namespaces.md)를 따른다.

## 상태 판정

`RED`:

- 수용 기준 커버 테스트 없음
- 테스트 미실행
- 테스트 실패 또는 스킵
- 알려지지 않은 요건 ID가 코드나 문서에 남아 있음
- AC 마커가 없거나 알 수 없어 검증 채널을 계산할 수 없음

`GREEN`:

- 대상 시스템에 맞는 구현/검증 연결이 있음
- 모든 수용 기준이 요구 채널에서 PASS
- 연결된 테스트 결과가 모두 PASS

`BLUE`:

- GREEN 조건 충족
- 요건 카드 승인
- 열린 질문 없음

`INACTIVE`:

- `상태: 대체됨` 또는 `상태: 폐기`
- 카드 구조 검증은 받지만 완료 판정 대상에서는 제외

## 명령

애플리케이션 workflow:

```bash
npm run app:trace -- --requirement REQ-XXX
npm run app:test
npm run app:validate
```

하네스 workflow:

```bash
npm run harness:trace -- --requirement REQ-XXX
npm run harness:test
npm run harness:self-test
npm run harness:validate
```

저장소 전체 확인:

```bash
npm run repo:validate
```

`repo:validate`는 앱 검증과 하네스 검증을 순차 실행할 뿐, 두 scope의 입력이나 산출물을 합치지 않는다.

## Skeleton 운영

Skeleton 단계의 카드는 아직 실행 테스트가 없으므로 RED가 정상이다. 이 단계에서는 strict 게이트를 돌리지 않고 scope에 맞는 trace와 컴파일/인덱스 생성만 확인한다.

애플리케이션:

```bash
npm run app:trace -- --requirement REQ-XXX
cd app/back-end && ./gradlew compileJava
```

하네스:

```bash
npm run harness:trace -- --requirement REQ-XXX
npm run harness:self-test-index
```

구현과 테스트가 들어간 뒤에 `app:validate` 또는 `harness:validate`로 RED를 해소한다.

## 스키마 미리보기

JPA Entity 기반 DDL 미리보기는 애플리케이션 산출물이다.

```bash
cd app/back-end
./gradlew previewSchema
```

결과는 `build/app/schema-preview.sql`에 생성된다.

## 사람이 관리하지 않는 것

추적표, findings, test-results index, trace state, markdown/json report는 사람이 직접 편집하지 않는다. 하네스 도구가 `build/app` 또는 `build/harness` 아래에 다시 생성한다.
