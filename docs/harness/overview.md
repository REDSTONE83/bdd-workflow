# 코드 중심 BDD 하네스 개요

## 목표

요건 카드, Spring Boot API, JPA Entity, Acceptance Test, 테스트 결과를 `REQ ID` 하나로 연결한다. 사람이 관리하는 ID는 요건 ID만 유지하고, API ID, 테이블 ID, 시나리오 ID는 코드 식별자로 대체한다.

요건 ID는 하나 또는 여러 개를 동시에 부여할 수 있다 (`@Requirement({"REQ-001","REQ-005"})`). 컬럼 단위 추적이 필요한 Entity에서는 필드에도 `@Requirement`를 붙인다.

## 추적 구조

```text
요건 카드
  REQ-001
  수용 기준 (AC, 카드 완료 여부 기계 판정)
  요건 Skeleton 승인 이력 (BDD 테스트 리뷰 섹션 - Skeleton 결과)

시나리오 문서 (Gherkin)
  docs/scenarios/REQ-001-*.feature
  @REQ-001                                   // Feature 태그
  Feature: 업무 언어 요건 제목
  Scenario: 업무 언어 검토명                 // 사람이 검토하는 단위
  Covers: AC 문장 목록                       // .feature ↔ @Covers 연결
  Given / When / Then / And                  // 시나리오 본문 (FE/BE 공유)

컨트롤러
  @Requirement("REQ-001")
  POST /users/signup
  UserController.signup

JPA Entity
  @Entity @Table @Requirement("REQ-001")
  UserAccount → user_account
  필드 레벨 @Requirement로 컬럼 단위 추적

Acceptance Test
  @Requirement("REQ-001")
  @Covers("수용 기준 문장")                   // AC 커버리지 신호, Scenario.Covers 와 연결
  @DisplayName("케이스 단위 자유 레이블")     // JUnit 표시용. 시나리오 제목과 일치할 필요 없음
  SignupApiAcceptanceTest.signupWithValidRequestReturnsCreated

검증 리포트
  REQ-001 -> AC -> Scenario(.feature) -> Test -> PASS/FAIL -> RED/GREEN/BLUE
  (Scenario ↔ Test 연결은 Scenario.Covers ∩ Test.@Covers 로 판단)
```

`@Covers`가 있는 테스트만 AC 커버리지에 포함된다. `@Covers`가 없는 테스트는 보조 테스트로 분류해 별도로 표시한다. `.feature`는 공유 BDD 명세 + 하네스 추적 입력으로만 사용하며 Cucumber 실행 도구는 도입하지 않는다.

Scenario는 사용자 행위/업무 흐름 단위이고 Test는 AC 검증 단위다. 한 시나리오에 여러 테스트가 귀속되는 것이 일반적이다 (입력 변형/경계값별 분기).

## 하네스 구성 요소

```text
AGENTS.md
  작업 규칙과 RED/GREEN/BLUE 판정 기준

docs/harness/requirement-authoring.md
  질문 기반 요건 작성과 BDD 테스트 리뷰 절차

docs/harness/project-structure.md
  프로젝트 전체 폴더 구조와 파일 배치 기준

docs/requirements
  사람이 관리하는 요건 카드

docs/scenarios
  Gherkin `.feature` 시나리오 원본. FE/BE/QA 공유 명세이자 하네스 추적 입력.

back-end/src/main/java
  Spring Boot API, 컨트롤러 기반 API 명세, JPA @Entity 기반 DB 스키마

back-end/src/test/java
  승인된 시나리오를 실행 가능한 검증으로 옮긴 Acceptance Test

back-end/src/harness/java
  JavaParser 기반 API/Entity/test source index 생성기

back-end/tools/trace-requirements.mjs
  요건 카드, JavaParser source index, 테스트 결과 병합

back-end/tools/preview-schema.mjs
  Entity 인덱스로부터 DDL 미리보기 생성

back-end/build/harness
  자동 생성 source index, 추적 리포트, schema preview
```

## 상태 판정

`RED`는 개발 중 또는 검증 실패 상태다.

- API 연결 없음
- 수용 기준 커버 테스트 없음
- 테스트 미실행
- 테스트 실패 또는 스킵
- 알려지지 않은 요건 ID가 코드에 남아 있음 (`@Requirement`에 카드에 없는 ID가 하나라도 포함)

`GREEN`은 구현 검증 통과 상태다.

- API 연결 있음
- 수용 기준 모두 커버됨
- 연결 테스트 모두 PASS

`BLUE`는 정리 완료 상태다.

- GREEN 조건 충족
- 요건 카드 승인
- 열린 질문 없음

Skeleton 단계의 카드(`@Covers` 테스트 부재)는 정상적으로 RED로 표시된다. 이 시점에는 strict 게이트인 `validateHarness`를 돌리지 않고 `compileJava`, `generateHarnessSourceIndex`, `previewSchema`, `traceRequirementCard`로 인터페이스와 현황만 본다. 작성 절차는 [`requirement-authoring.md`](./requirement-authoring.md).

## 품질 게이트

릴리스 후보로 넘기려면 최소한 다음 명령이 성공해야 한다.

```bash
cd back-end
./gradlew validateHarness
```

이 명령은 테스트를 먼저 실행한 뒤, 요건 카드와 코드(API, Entity, Acceptance Test) 연결 상태를 검사한다. 알려지지 않은 요건 ID가 하나라도 섞여 있으면 실패한다.

구현 전 스키마 검토용:

```bash
cd back-end
./gradlew previewSchema
```

`back-end/build/harness/schema-preview.sql`에 JPA `@Entity` 정의로부터 생성된 DDL 미리보기가 떨어진다. 컬럼마다 어느 요건에서 도입됐는지 주석으로 남는다. 사용자에게 확인을 받은 뒤 Entity를 그대로 source of truth로 사용한다 (별도 마이그레이션 스크립트를 작성하지 않는다 — [`persistence-schema.md`](../standards/persistence-schema.md)).

## 요건 작성과 리뷰 흐름

요건 카드는 사용자에게 질문하며 구체화한다. 질문은 기본적으로 한 번에 하나씩 진행하고, 아직 확정되지 않은 질문은 `열린 질문`에 둔다. 답변이 확정되면 그 내용을 `범위`/`제외 범위`/`수용 기준`/`의사결정 로그` 중 해당 위치에 반영하고 `열린 질문`에서 제거한 뒤 다음 질문으로 넘어간다.

수용 기준이 확정되면 **요건 1개 단위**로 진행한다. 검증 설계(`.feature` 시나리오 묶음)와 요건 Skeleton(API/DB/Service 골격)을 한 번에 만들어 사용자 승인을 받는다. Skeleton 단계에서는 Controller/DTO/Entity/Repository/Service의 인터페이스와 계약에 집중하고, 업무 로직은 구현하지 않는다. 필요한 동작 설계는 Service/Controller 내부 코멘트로만 남긴다.

사용자 승인을 받은 같은 요건은 승인된 `.feature`의 `Covers:`에 포함된 AC를 검증하는 실행 테스트와 실제 Service 업무 로직, 컨트롤러 본문을 작성한다. 한 시나리오에 입력 변형/경계값별 여러 테스트가 귀속되는 것이 일반적이다.

테스트 코드 리뷰에서는 모든 수용 기준이 `@Covers`로 커버되는지, BDD 테스트의 `@Covers` AC가 같은 요건의 어떤 `.feature` 시나리오 `Covers:`에 포함되는지 (`TEST_COVERS_NO_SCENARIO_COVERS` WARNING 없음), 정상/예외/경계 조건이 충분한지, API 계약을 검증하는지 확인한다.

요건 카드에는 API와 테스트 목록을 수기로 적지 않는다. 실제 연결은 JavaParser 기반 source index에서 추출해 `build/harness/source-index.json`, `build/harness/trace-report.md`, `build/harness/trace-report.json`에 기록한다. 요건 Skeleton 승인 이력만 사람이 카드의 `BDD 테스트 리뷰` 섹션에 남긴다.
