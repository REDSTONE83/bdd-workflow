# 구현 표준

이 폴더는 사람이 정한 전역 구현 표준을 둔다.

- `docs/requirements`는 “무엇을 만들어야 하는가”
- `docs/standards`는 “어떤 방식으로 만들어야 하는가”
- `docs/harness`는 “그걸 어떻게 검사하고 추적하는가”

표준은 자동 검증 가능한 항목과 수동 리뷰 항목이 섞여 있다. 자동 검증이 가능한 항목은 본문에서 어떤 하네스 태스크가 그 규칙을 검사하는지 명시한다.

## 표준 목록

문서 작성:

- [`requirement-card.md`](./requirement-card.md): 요건 카드 형식, 필수 항목, 의사결정 로그 양식
- [`terminology.md`](./terminology.md): 표준 용어 운영, safe/strict 모드 게이트

코드 구조:

- [`package-structure.md`](./package-structure.md): 도메인 패키지 내부 레이어 (controller/dto/service/domain/exception/repository)
- [`api-contract.md`](./api-contract.md): 컨트롤러, DTO, OpenAPI, 전역 오류 응답, PATCH/페이징/Jackson 구성
- [`persistence-schema.md`](./persistence-schema.md): JPA Entity, 컬럼 매핑, Repository / Pageable 패턴, schema preview
- [`acceptance-test.md`](./acceptance-test.md): Acceptance Test 작성과 리뷰
- [`java-code-style.md`](./java-code-style.md): Lombok 허용/금지 범위와 금지 애너테이션 목록
- [`front-end-project-structure.md`](./front-end-project-structure.md): React/Vite/shadcn 기반 FE 폴더 구조, 생성 산출물, 검증 명령
- [`front-end-api-contract.md`](./front-end-api-contract.md): OpenAPI 기반 FE 타입/클라이언트, 인증, 오류, 페이징 연동
- [`front-end-ui.md`](./front-end-ui.md): shadcn/ui, Tailwind token, 레이아웃, 반응형, 접근성, Storybook 상태 표준
- [`front-end-testing.md`](./front-end-testing.md): FE TDD, BDD, Playwright, Storybook visual regression, 접근성 테스트 계층

런타임 정책:

- [`auth.md`](./auth.md): 인증/행위자 식별 (JWT Bearer)
- [`transaction.md`](./transaction.md): 서비스 트랜잭션 경계, 부수효과 (시드, 연결해제)
- [`validation.md`](./validation.md): DTO Bean Validation과 서비스 명세 검증 분담, 정규화

값 표준:

- [`id-policy.md`](./id-policy.md): 시간 정렬 UUID 단일 식별자 정책
- [`datetime.md`](./datetime.md): Instant + UTC 저장, ISO-8601 직렬화

## 표준 변경 절차

1. 변경 제안과 이유를 명시한다.
2. 자동 검증 항목이라면 어떤 하네스 태스크에 반영해야 하는지 적는다.
3. 표준 문서를 갱신하고, 영향이 있는 요건 카드의 `의사결정 로그`에도 흔적을 남긴다.
4. 필요한 경우 `AGENTS.md` 인덱스 항목 설명을 함께 갱신한다.

## 기존 코드 마이그레이션

표준을 새로 도입하거나 변경하면 기존 코드는 일시적으로 표준 위반 상태가 된다. 다음 기준으로 정리한다.

- 같은 요건(예: REQ-002)이 아직 BLUE가 아니면, 그 요건의 작업 안에서 함께 정합한다. 별도 REQ를 만들지 않는다.
- 이미 BLUE인 요건의 코드가 새 표준 위반이 되면, **마이그레이션 REQ를 별도로 발급**한다. 카드 의사결정 로그에 변경 표준 ID(파일 경로)와 변경 일자를 기록한다.
- 마이그레이션 REQ의 수용 기준은 "기존 동작을 유지하면서 새 표준을 충족"이다. 도메인 동작 변경이 같이 들어가면 별도 REQ로 분리한다.

이번 표준 묶음에서 마이그레이션 대상이 되는 대표 사례:

- `ObjectNode` 기반 PATCH → `JsonNullable<T>` ([`api-contract.md`](./api-contract.md))
- `Long id` + `GenerationType.IDENTITY` → 시간 정렬 UUID ([`id-policy.md`](./id-policy.md))
- 비페이징 목록 응답 → `PageResponse<T>` + `Pageable` ([`api-contract.md`](./api-contract.md))
- `application.yml`의 `spring.jackson.*` → `Jackson2ObjectMapperBuilderCustomizer` ([`api-contract.md`](./api-contract.md))
- 프런트엔드가 필요한 기존 BLUE 요건 → 별도 FE 마이그레이션 REQ 발급 후 `front-end` 또는 `full-stack` 구현 대상으로 진행 ([`front-end-project-structure.md`](./front-end-project-structure.md))
