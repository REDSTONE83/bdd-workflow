# BDD Workflow Harness Agent Guide

이 저장소는 Spring Boot API 개발을 코드 중심 BDD 방식으로 진행하기 위한 하네스 예제다. 별도 시나리오 ID와 API ID는 만들지 않고, 사람이 관리하는 ID는 `REQ-001` 같은 요건 ID만 둔다.

이 문서는 인덱스다. 본문 규칙은 아래 링크된 표준/하네스 문서에 둔다.

## 핵심 원칙

- 요건 카드는 `/docs/requirements`에 둔다.
- API 명세는 Spring Boot 컨트롤러와 DTO 애너테이션에 둔다.
- DB 스키마는 JPA `@Entity` 클래스에 둔다. 컬럼 단위 추적이 필요하면 필드에도 `@Requirement`를 붙인다.
- BDD 시나리오는 별도 `.feature` 파일이 아니라 Acceptance Test 코드로 표현한다.
- 수용 기준 커버리지는 테스트 메서드의 `@Covers` 값으로 판단한다.
- API, DTO, Entity, 테스트는 `@Requirement("REQ-001")` 또는 `@Requirement({"REQ-001","REQ-002"})`로 하나 이상의 요건에 연결한다. 공통 응답 DTO처럼 도메인 무관한 클래스는 비워둔다.
- 추적표와 검증 리포트는 사람이 직접 관리하지 않고 하네스가 생성한다.

## 문서 구조

- `docs/requirements`: 무엇을 만들어야 하는가 (요건 카드)
- `docs/standards`: 어떤 방식으로 만들어야 하는가 (구현 표준)
- `docs/harness`: 그걸 어떻게 검사하고 추적하는가 (하네스 운영)
- `docs/terminology`: 표준 용어 사전과 검사 알고리즘

## 직접 관리하는 산출물

사람이 직접 관리하는 산출물은 최소화한다.

```text
docs/requirements/*.md
docs/standards/*.md
src/main/java/**/*
src/test/java/**/*AcceptanceTest.java
```

`back-end/build/harness/*` 리포트는 생성 산출물이다.

전체 폴더 구조는 [`docs/harness/project-structure.md`](docs/harness/project-structure.md)를 따른다.

## 구현 표준 인덱스

세부 규칙은 모두 `docs/standards/` 아래에 있다. 진입점은 [`docs/standards/README.md`](docs/standards/README.md).

문서 작성:

- [`requirement-card.md`](docs/standards/requirement-card.md): 요건 카드 필수 항목, 수용 기준 작성, 의사결정 로그 양식
- [`terminology.md`](docs/standards/terminology.md): 표준 용어 safe/strict 모드와 게이트

코드 구조:

- [`package-structure.md`](docs/standards/package-structure.md): 도메인 패키지 내부 레이어 (controller/dto/service/domain/exception/repository)
- [`api-contract.md`](docs/standards/api-contract.md): 컨트롤러, DTO, OpenAPI, 전역 오류 응답, PATCH/페이징/Jackson 구성
- [`persistence-schema.md`](docs/standards/persistence-schema.md): JPA Entity, 컬럼 매핑, Repository / Pageable 패턴, schema preview
- [`acceptance-test.md`](docs/standards/acceptance-test.md): Acceptance Test 작성과 리뷰 체크리스트
- [`java-code-style.md`](docs/standards/java-code-style.md): Lombok 허용 범위와 금지 애너테이션 목록

런타임 정책:

- [`auth.md`](docs/standards/auth.md): 인증/행위자 식별 (JWT Bearer)
- [`transaction.md`](docs/standards/transaction.md): 서비스 트랜잭션 경계와 부수효과
- [`validation.md`](docs/standards/validation.md): DTO Bean Validation과 서비스 명세 검증 분담, 정규화

값 표준:

- [`id-policy.md`](docs/standards/id-policy.md): 시간 정렬 UUID 단일 식별자 정책
- [`datetime.md`](docs/standards/datetime.md): Instant + UTC 저장, ISO-8601 직렬화

## 작성 절차

요건 작성과 BDD 테스트 리뷰 절차는 [`docs/harness/requirement-authoring.md`](docs/harness/requirement-authoring.md)에 둔다. 핵심 순서만 옮기면 다음과 같다.

1. 사용자 요청을 요건 카드 초안으로 정리한다.
2. 모호한 범위, 예외, 정책, 권한, 상태 변화를 사용자에게 질문한다. 한 번에 1-3개만 한다.
3. 답변은 카드의 `확인 질문 로그`에, 확정된 정책은 `의사결정 로그`에 남긴다.
4. 표준 용어 검색/등록은 `node back-end/tools/terminology.mjs ...`로 한다 (`draft.json` 직접 편집 금지).
5. 수용 기준을 검증 가능한 문장으로 정리한다.
6. 동일 문장을 `@Covers`로 사용해 Acceptance Test를 먼저 작성한다.
7. BDD 테스트 코드가 요건을 충분히 커버하는지 리뷰한다.
8. 컨트롤러/DTO/Entity에 `@Requirement`와 API 계약을 명시한다. 스키마가 새로 생기거나 바뀌면 `./gradlew previewSchema` 결과로 사용자 확인을 받는다.
9. 구현한다.
10. `./gradlew validateHarness`로 요건/표준 용어(safe)/API/Entity/테스트/결과 연결을 확인한다.
11. 카드를 `승인`으로 올리거나 릴리스 전이라면 `./gradlew validateTerminologyStrict`로 strict error를 0으로 맞춘다.

요건 카드의 구현 완료 여부는 카드 전체 자연어가 아니라 `수용 기준` 커버리지로 판단한다.

## RED / GREEN / BLUE

상태 판정 기준은 [`docs/harness/overview.md`](docs/harness/overview.md)에 둔다. 요약은 다음과 같다.

```text
RED
- 관련 API 없음 / 수용 기준 커버 테스트 없음 / 테스트 미실행 / 실패 또는 스킵
- 알려지지 않은 요건 ID가 코드에 남아 있음

GREEN
- API 연결 있음, 수용 기준 모두 커버됨, 테스트 모두 PASS
- 단, 카드가 아직 승인되지 않았거나 열린 질문이 남아 있음

BLUE
- GREEN 조건 충족 + 카드 승인 + 열린 질문 없음
```

## 자주 쓰는 검증 명령

```bash
cd back-end

./gradlew test                       # JUnit 테스트
./gradlew generateHarnessSourceIndex # JavaParser source index만 생성
./gradlew previewSchema              # Entity 기반 DDL 미리보기
./gradlew traceRequirements          # 추적 리포트 생성 (always exit 0)
./gradlew validateStandards          # docs/standards 정적 검사 리포트 (always exit 0)
./gradlew validateStandardsStrict    # docs/standards strict 게이트 (위반 시 실패)
./gradlew harnessReport              # 표준/용어/테스트/추적 리포트 모두 생성 (집계용)
./gradlew validateHarness            # strict 게이트: 표준 + 용어 safe + 테스트 + RED/GREEN/BLUE
./gradlew validateTerminology        # 용어만 safe 검증
./gradlew validateTerminologyStrict  # 최종 승인 / 릴리스 전 strict 게이트
./gradlew check                      # 전체 확인
```
