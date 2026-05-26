# 요건 카드 표준

요건 카드는 `/docs/requirements/REQ-XXX-*.md` 파일로 관리한다. 카드는 사람이 5-15분 안에 검토할 수 있는 크기를 유지한다.

## 필수 항목

- `요건 ID`
- `제목`
- `우선순위`
- `상태`
- `구현 대상` (신규/마이그레이션 카드 권장. 기존 카드에서 생략되면 `back-end`로 본다)
- `사용자/목적`
- `범위`
- `표준 용어`
- `제외 범위`
- `수용 기준`
- `의사결정 로그`
- `BDD 테스트 리뷰`
- `열린 질문`

새 카드는 `docs/templates/requirement-card.md`를 복사해 시작한다.

## 항목 작성 규칙

### 수용 기준

각 문장은 Acceptance Test의 `@Covers` 또는 FE BDD 테스트의 `Covers` 값과 정확히 일치해야 한다. 문장은 테스트 가능한 결과 중심으로 적되, 사용자/PO/QA가 함께 승인하는 **완료 기준**이므로 관계자 언어로 작성한다. `null`, JSON 키(`title`, `content`, `totalElements` 등), HTTP 상태 코드, 오류 코드 같은 기술 표현은 계약 자체가 AC가 아닌 한 AC에 쓰지 않는다. 구체 규칙과 분리 위치(API 계약, 의사결정 로그, 테스트 assertion)는 [`docs/harness/requirement-authoring.md`](../harness/requirement-authoring.md) "수용 기준 작성"에 둔다.

목록 조회 API가 범위에 포함되면 페이징 수용 기준을 반드시 별도 문장으로 둔다. 목록이 작거나 현재 화면에서 전부 보여도 예외로 두지 않는다. 사용자가 한 번에 보는 묶음의 크기, 다음 묶음을 열었을 때 보이는 항목, 전체 할 일 수와 전체 묶음 수가 변하지 않는지를 관찰 가능한 문장으로 둔다. 정렬/필터와 페이징은 한 문장에 뭉개지 말고, 필요하면 각각 독립 수용 기준으로 나눈다.

프런트엔드 화면 목록도 같은 원칙을 따른다. 화면에서 페이지네이션, 무한 스크롤, 더 보기 버튼, 테이블 스크롤을 제공한다면 사용자가 관찰하는 묶음 크기, 다음 묶음 결과, 전체 개수 표시, 비어 있는 묶음 처리를 수용 기준으로 둔다.

#### AC 단위 테스트 대상 마커 (REQ-012)

수용 기준 bullet 시작 직후에 `(BE)`, `(FE)`, `(FS)` 토큰 중 하나를 마커로 둘 수 있다. 마커는 해당 AC가 어떤 테스트에서 커버되어야 하는지를 명시한다.

- `BE`: 백엔드 Acceptance Test만 커버를 요구한다.
- `FE`: FE BDD 테스트만 커버를 요구한다.
- `FS`: 백엔드와 FE 양쪽 모두 커버를 요구한다.

마커가 없는 AC는 카드 헤더의 `구현 대상`에 따라 fallback된다: `back-end`→BE, `front-end`→FE, `full-stack`→FS, `harness`→어느 한쪽이라도 커버.

마커는 bullet의 표시 정보일 뿐 테스트 식별자는 마커를 제외한 원문이다. 같은 AC를 가리키는 `@Covers`, FE BDD `Covers`, `.feature` Scenario `Covers:` 값에는 마커를 포함하지 않는다.

마커 유효값은 `BE`, `FE`, `FS` 세 가지뿐이다. 다른 토큰(예: `(API)`)이 들어오면 카드 정적 검증이 `CARD-AC-TARGET-INVALID`로 차단한다.

작성 예:

```text
- (BE) 인증 정보가 없으면 보호 API 요청이 거절된다
- (FE) 로그인 화면을 열면 이메일 입력에 자동으로 입력 포커스가 간다
- (FS) 로그인에 성공하면 자신의 할 일 목록 화면으로 이동한다
```

### 구현 대상

신규 카드와 FE 마이그레이션 카드는 헤더 영역에 구현 대상을 적는다.

```text
구현 대상: back-end
구현 대상: front-end
구현 대상: full-stack
구현 대상: harness
```

- `back-end`: API, DB, Service, 백엔드 Acceptance Test가 주 구현 대상이다.
- `front-end`: 화면, 라우팅, 클라이언트 상태, FE 테스트가 주 구현 대상이다. API 계약이 이미 존재해야 한다.
- `full-stack`: 같은 요건에서 API와 화면을 함께 구현한다.
- `harness`: 사용자-facing API/화면이 아니라 하네스·계약 산출물·도구 파이프라인(빌드 산출물, 검사기 룰, 추적/리포트 구조 등)을 바꾸는 요건이다. 산출물이 외부 사용자에게 보이지 않으므로 API/FE 표면 연결은 요구하지 않는다. 수용 기준 커버는 백엔드 Acceptance Test 또는 FE BDD 테스트 어느 쪽이든 무방하다.

기존 카드에서 `구현 대상`이 생략되면 `back-end`로 본다. 하네스는 이 값을 RED/GREEN/BLUE 판정에 사용한다. `front-end`는 FE 화면/route/story 연결과 FE BDD 테스트 PASS가 필요하고, `full-stack`은 백엔드 API/Acceptance Test와 FE 화면/BDD 테스트가 모두 필요하다. `harness`는 API/FE 표면 연결을 요구하지 않고 수용 기준 커버 테스트의 PASS만 본다.

좋은 예:

```text
- 유효한 정보이면 계정이 생성된다
- 중복 이메일이면 가입이 거절된다
- 비밀번호가 8자 미만이면 가입이 거절된다
- 할 일 목록을 한 번에 2개씩 보면 첫 묶음에 2개, 두 번째 묶음에 다음 2개가 보인다
- 할 일 목록에서 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다
```

피해야 할 예 — 모호한 문장:

```text
- 회원 가입을 잘 처리한다
- 예외 처리를 한다
```

피해야 할 예 — 기술 어휘가 들어간 문장:

```text
- 응답에는 content, page, size, totalElements, totalPages가 포함된다
- 할 일 생성 시 설명에 null을 명시하면 설명 없이 저장된다
- INVALID_CATEGORY 오류 코드와 categoryId 필드가 응답된다
```

문장 작성 절차와 모호성 해소 질문 목록은 [`docs/harness/requirement-authoring.md`](../harness/requirement-authoring.md)를 참고한다.

### 표준 용어

`docs/terminology/`에 등록된 term key만 적는다. 검색은 `node tools/harness/terminology.mjs search <표현>`, 새 후보 등록은 `node tools/harness/terminology.mjs draft add ...`를 쓴다. `draft.json`은 직접 편집하지 않는다.

draft 용어가 카드에 남아 있으면 일상 검증(`validateHarness`)도 통합 게이트(`gate.mjs`)의 TRM 카테고리에서 차단된다(REQ-010). 단독 strict 진단을 따로 돌리고 싶을 때만 `./gradlew validateTerminologyStrict`를 쓴다. 자세한 내용은 [`terminology.md`](./terminology.md)를 본다.

### 열린 질문 / 의사결정 로그

요건 작성 중 사용자에게 던졌으나 아직 확정되지 않은 질문은 `열린 질문`에만 둔다. 질문은 기본적으로 한 번에 하나만 진행한다. 서로 분리하면 같은 정책을 두 번 결정하게 되는 항목만 최대 3개까지 묶을 수 있다. 답변이 오면 그 내용을 다음 위치 중 해당하는 곳에 반영하고 `열린 질문`에서 제거한 뒤 다음 질문으로 넘어간다.

- 동작 자체가 바뀌면 → `범위` 또는 `제외 범위`
- 검증 가능한 결과로 표현되면 → `수용 기준`
- 정책 선택과 그 근거를 남겨야 하면 → `의사결정 로그`

질문은 가능하면 선택지형으로 작성한다. 정량 기준이 필요한 항목은 길이, 개수, 용량, 기간, 횟수, 시간 제한의 후보값과 직접 입력 여지를 함께 제시한다. 사용자 답변 전의 후보값은 확정 정책이 아니므로 `수용 기준`으로 승격하지 않는다.

`의사결정 로그`는 다음 항목으로 기록한다.

- 결정일
- 결정
- 이유
- 결정자
- 영향

결정이 수용 기준을 바꾸면 Acceptance Test의 `@Covers`, FE BDD 테스트의 `Covers`, 표시용 테스트 이름도 함께 갱신한다. 카드를 `승인`으로 올리려면 `열린 질문`이 비어 있어야 한다.

### BDD 테스트 리뷰

초안 단계에서는 `미완료`로 둘 수 있다. Skeleton 단계에서는 요건 단위로 검증 설계, 골격, 내부 동작 코멘트 승인 결과만 남긴다. 수용 기준과 Acceptance Test가 리뷰되기 전에는 요건 카드 상태를 `승인`으로 바꾸지 않는다.

#### Skeleton 승인 이력 분류

`### 요건 Skeleton 승인 이력` 항목은 한 bullet 안에 다음 분류를 자유롭게 골라 적는다. 각 분류는 그 요건에 해당이 없으면 "해당 없음."으로 둔다. 추가 분류가 필요하면 같은 형식("이름: 본문")으로 한 줄 더 적는다.

- `검증 설계`: 카드 수용 기준과 `.feature` Scenario `Covers:` 매핑 요약, `validate-cross-artifact`의 TRC-COV-* 결과.
- `API Skeleton`: Controller / DTO / Repository / Service 인터페이스 골격. (`구현 대상: back-end`/`full-stack`)
- `DB Skeleton`: JPA Entity / 컬럼 매핑 / Repository 골격. (`구현 대상: back-end`/`full-stack`)
- `Service Skeleton`: 서비스 트랜잭션 경계, 부수효과 정책, 메서드 시그니처.
- `화면/라우팅 Skeleton`: route 경로, 페이지 컴포넌트 이름, 주요 표시 정보. (`구현 대상: front-end`/`full-stack`)
- `검사기 Skeleton`: 하네스 / Layer 1 collector / Layer 2 validator / 룰 ID 도입 또는 변경. (`구현 대상: harness`)
- `표준 용어`: 카드의 `## 표준 용어` 절에 추가한 term key와 draft/approved 상태.
- `추적 정책`: `구현 대상` 분류 선택 근거, RED/GREEN/BLUE 판정 영향, trace 규칙 갱신.
- `Gradle 실행 순서`: 새 task 도입, dependsOn / mustRunAfter / finalizedBy 관계, 중복 실행 방지.
- `검증`: `compileJava`, `generateHarnessSourceIndex`, `generateFrontEndSourceIndex`, `traceRequirementCard -Preq=REQ-XXX`, `validateRequirementCard -Preq=REQ-XXX` 등 Skeleton 단계에서 통과를 확인한 명령.
- `승인자`: Skeleton을 승인한 사람.
- `Skeleton 결과`: `승인` / `승인 대기` / `미완료` 중 하나.

`구현 대상`이 `harness`인 카드는 API/DB/Service/화면-라우팅 Skeleton을 보통 "해당 없음."으로 두고 `검사기 Skeleton`을 중심으로 적는다. 다른 분류와 마찬가지로 요건에 따라 추가/생략 가능하다.

## 금지 사항

- API 목록이나 테스트 메서드 목록을 카드에 직접 적지 않는다. 코드의 `@Requirement`, `@Covers` 스캔으로 자동 생성된 리포트(`build/harness/reports/trace-report.md`)에서 확인한다.
- 별도 시나리오 ID, API ID, 테이블 ID, 화면 ID, 컴포넌트 ID를 만들지 않는다.

## 자동 검증 항목

`validateHarness`, `validateRequirementCard -Preq=REQ-XXX`, `validateRequirementCardBlue -Preq=REQ-XXX`가 공통으로 적용하는 카드 정적 검증은 다음과 같다.

- 파일명 `REQ-NNN-*.md` 형식, `요건 ID` 형식(`REQ-\d{3,}`), 파일명 ID와 카드 ID 일치, 카드 ID 중복 없음
- 필수 항목/섹션 존재: `제목`, `우선순위`, `상태`, `## 사용자/목적`, `## 범위`, `## 표준 용어`, `## 제외 범위`, `## 수용 기준`, `## 의사결정 로그`, `## BDD 테스트 리뷰`, `## 열린 질문`
- `상태` 허용값: `초안`, `검토중`, `승인`
- `우선순위` 허용값: `높음`, `중간`, `낮음`
- `수용 기준`이 비어 있지 않고, 같은 문장이 중복되지 않음
- `표준 용어` bullet이 term key 형식(`domain.concept` 또는 `domain.concept.subConcept`)이고, `build/harness/indexes/terminology.index.json`에 등록되어 있으며(draft도 인정), 같은 key가 중복되지 않음
- 카드 본문에 등장한 `REQ-\d{3,}` 참조가 다른(또는 자기) 요건 카드로 실제 존재함
- `상태: 승인`인 카드는 열린 질문이 모두 닫혀 있고, `## BDD 테스트 리뷰` 섹션에 `결과: 승인` 줄이 있으며, 같은 섹션에 `미완료` 표기가 없음
- `--check` 모드에서 `terminology.index.json`이 누락된 경우 단일 구조 오류로 보고됨 (먼저 `./gradlew indexTerminology` 또는 `./gradlew validateTerminology` 실행 필요)

상태 판정은 별개다.

- `validateHarness`: 통합 게이트(`gate.mjs`, REQ-010). 전체 카드 RED/GREEN/BLUE + 카드 정적 검증(CARD-*) + cross-artifact(REF-*/TRC-*) + BE-*/FE-*/SCN-* error + TRM strict error 차단.
- `validateRequirementCard -Preq=REQ-XXX`: 선택 카드 RED 차단. finding은 `requirements[]` 교집합으로 필터.
- `validateRequirementCardBlue -Preq=REQ-XXX`: 위에 더해 선택 카드 GREEN 잔존 시 TRACE 카테고리로 차단.
- `validateTerminology` (safe): 표준 용어 finding을 emit만 한다 (게이트 차단 자체는 `gate.mjs`의 TRM 카테고리가 수행).
- `validateTerminologyStrict`: 통합 게이트와 동일한 TRM 차단 정책을 단독 게이트로 확인할 때 쓰는 진단 도구.

## 수동 리뷰 항목

- 수용 기준 문장이 테스트로 옮길 수 있는 결과 문장인가
- 정상/예외/경계 조건이 빠지지 않았는가
- 목록 조회 API가 있으면 페이징 수용 기준이 별도로 포함되어 있는가
- 열린 질문이 모두 닫혔는가 (승인 전)
