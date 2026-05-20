# 코드 중심 BDD 하네스 개요

## 목표

요건 카드, Spring Boot API, Acceptance Test, 테스트 결과를 `REQ ID` 하나로 연결한다. 사람이 관리하는 ID는 요건 ID만 유지하고, API ID와 시나리오 ID는 코드 식별자로 대체한다.

## 추적 구조

```text
요건 카드
  REQ-001
  수용 기준

컨트롤러
  @Requirement("REQ-001")
  POST /users/signup
  UserController.signup

Acceptance Test
  @Requirement("REQ-001")
  @Covers("수용 기준 문장")
  SignupApiAcceptanceTest.signupWithValidRequestReturnsCreated

검증 리포트
  REQ-001 -> API -> 테스트 -> PASS/FAIL -> RED/GREEN/BLUE
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
  Spring Boot API, 컨트롤러 기반 API 명세

back-end/src/test/java
  BDD 시나리오 역할을 하는 Acceptance Test

back-end/src/harness/java
  JavaParser 기반 API/test source index 생성기

back-end/tools/trace-requirements.mjs
  요건 카드, JavaParser source index, 테스트 결과 병합

back-end/build/harness
  자동 생성 source index와 추적 리포트
```

## 상태 판정

`RED`는 개발 중 또는 검증 실패 상태다.

- API 연결 없음
- 수용 기준 커버 테스트 없음
- 테스트 미실행
- 테스트 실패 또는 스킵

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

이 명령은 테스트를 먼저 실행한 뒤, 요건 카드와 코드의 연결 상태를 검사한다.

## 요건 작성과 리뷰 흐름

요건 카드는 사용자에게 질문하며 구체화한다. 확정된 답변은 요건 카드의 `확인 질문 로그`에 남기고, 구현 정책으로 확정된 선택은 `의사결정 로그`에 남긴다.

수용 기준이 확정되면 그 문장을 그대로 Acceptance Test의 `@Covers`에 사용한다. 테스트 코드 리뷰에서는 모든 수용 기준이 커버되는지, 정상/예외/경계 조건이 충분한지, API 계약을 검증하는지 확인한다.

요건 카드에는 API와 테스트 목록을 수기로 적지 않는다. 실제 연결은 JavaParser 기반 source index에서 추출해 `build/harness/source-index.json`, `build/harness/trace-report.md`, `build/harness/trace-report.json`에 기록한다.
