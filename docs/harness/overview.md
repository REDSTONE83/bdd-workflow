# 코드 중심 BDD 하네스 개요

## 목표

요건 카드, Spring Boot API, JPA Entity, Acceptance Test, 테스트 결과를 `REQ ID` 하나로 연결한다. 사람이 관리하는 ID는 요건 ID만 유지하고, API ID, 테이블 ID, 시나리오 ID는 코드 식별자로 대체한다.

요건 ID는 하나 또는 여러 개를 동시에 부여할 수 있다 (`@Requirement({"REQ-001","REQ-005"})`). 컬럼 단위 추적이 필요한 Entity에서는 필드에도 `@Requirement`를 붙인다.

## 추적 구조

```text
요건 카드
  REQ-001
  수용 기준

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
  @Covers("수용 기준 문장")
  SignupApiAcceptanceTest.signupWithValidRequestReturnsCreated

검증 리포트
  REQ-001 -> API -> Entity -> 테스트 -> PASS/FAIL -> RED/GREEN/BLUE
```

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

back-end/src/main/java
  Spring Boot API, 컨트롤러 기반 API 명세, JPA @Entity 기반 DB 스키마

back-end/src/test/java
  BDD 시나리오 역할을 하는 Acceptance Test

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

수용 기준이 확정되면 그 문장을 그대로 Acceptance Test의 `@Covers`에 사용한다. 테스트 코드 리뷰에서는 모든 수용 기준이 커버되는지, 정상/예외/경계 조건이 충분한지, API 계약을 검증하는지 확인한다.

요건 카드에는 API와 테스트 목록을 수기로 적지 않는다. 실제 연결은 JavaParser 기반 source index에서 추출해 `build/harness/source-index.json`, `build/harness/trace-report.md`, `build/harness/trace-report.json`에 기록한다.
