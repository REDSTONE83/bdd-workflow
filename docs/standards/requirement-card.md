# 요건 카드 표준

요건 카드는 `/docs/requirements/REQ-XXX-*.md` 파일로 관리한다. 카드는 사람이 5-15분 안에 검토할 수 있는 크기를 유지한다.

## 필수 항목

- `요건 ID`
- `제목`
- `우선순위`
- `상태`
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

각 문장은 Acceptance Test의 `@Covers` 값과 정확히 일치해야 한다. 문장은 테스트 가능한 결과 중심으로 적는다.

목록 조회 API가 범위에 포함되면 페이징 수용 기준을 반드시 별도 문장으로 둔다. 목록이 작거나 현재 화면에서 전부 보여도 예외로 두지 않는다. 최소한 요청한 `page`/`size`에 맞는 `content` 슬라이스와 `page`, `size`, `totalElements`, `totalPages` 메타데이터를 검증할 수 있어야 한다. 정렬/필터와 페이징은 한 문장에 뭉개지 말고, 필요하면 각각 독립 수용 기준으로 나눈다.

좋은 예:

```text
- 유효한 정보이면 계정이 생성된다
- 중복 이메일이면 가입이 거절된다
- 비밀번호가 8자 미만이면 가입이 거절된다
- page=0&size=2로 목록을 조회하면 첫 번째 페이지 항목과 전체 페이지 메타데이터가 반환된다
- page=1&size=2로 목록을 조회하면 두 번째 페이지 항목과 동일한 전체 건수가 반환된다
```

피해야 할 예:

```text
- 회원 가입을 잘 처리한다
- 예외 처리를 한다
```

문장 작성 절차와 모호성 해소 질문 목록은 `docs/harness/requirement-authoring.md`를 참고한다.

### 표준 용어

`docs/terminology/`에 등록된 term key만 적는다. 검색은 `node back-end/tools/terminology.mjs search <표현>`, 새 후보 등록은 `node back-end/tools/terminology.mjs draft add ...`를 쓴다. `draft.json`은 직접 편집하지 않는다.

draft 용어가 카드에 남아 있어도 일상 검증(`validateHarness`)은 통과한다. 최종 승인 게이트인 `./gradlew validateTerminologyStrict`에서는 error가 되어 빌드를 실패시킨다. 자세한 내용은 [`terminology.md`](./terminology.md)를 본다.

### 열린 질문 / 의사결정 로그

요건 작성 중 사용자에게 던졌으나 아직 확정되지 않은 질문은 `열린 질문`에만 둔다. 답변이 오면 그 내용을 다음 위치 중 해당하는 곳에 반영하고 `열린 질문`에서 제거한다.

- 동작 자체가 바뀌면 → `범위` 또는 `제외 범위`
- 검증 가능한 결과로 표현되면 → `수용 기준`
- 정책 선택과 그 근거를 남겨야 하면 → `의사결정 로그`

`의사결정 로그`는 다음 항목으로 기록한다.

- 결정일
- 결정
- 이유
- 결정자
- 영향

결정이 수용 기준을 바꾸면 Acceptance Test의 `@Covers`와 `@DisplayName`도 함께 갱신한다. 카드를 `승인`으로 올리려면 `열린 질문`이 비어 있어야 한다.

### BDD 테스트 리뷰

초안 단계에서는 `미완료`로 둘 수 있다. 수용 기준과 Acceptance Test가 리뷰되기 전에는 요건 카드 상태를 `승인`으로 바꾸지 않는다.

## 금지 사항

- API 목록이나 테스트 메서드 목록을 카드에 직접 적지 않는다. 코드의 `@Requirement`, `@Covers` 스캔으로 자동 생성된 리포트(`back-end/build/harness/trace-report.md`)에서 확인한다.
- 별도 시나리오 ID, API ID, 테이블 ID를 만들지 않는다.

## 자동 검증 항목

`validateHarness`, `validateRequirementCard -Preq=REQ-XXX`, `validateRequirementCardBlue -Preq=REQ-XXX`가 공통으로 적용하는 카드 정적 검증은 다음과 같다.

- 파일명 `REQ-NNN-*.md` 형식, `요건 ID` 형식(`REQ-\d{3,}`), 파일명 ID와 카드 ID 일치, 카드 ID 중복 없음
- 필수 항목/섹션 존재: `제목`, `우선순위`, `상태`, `## 사용자/목적`, `## 범위`, `## 표준 용어`, `## 제외 범위`, `## 수용 기준`, `## 의사결정 로그`, `## BDD 테스트 리뷰`, `## 열린 질문`
- `상태` 허용값: `초안`, `검토중`, `승인`
- `우선순위` 허용값: `높음`, `중간`, `낮음`
- `수용 기준`이 비어 있지 않고, 같은 문장이 중복되지 않음
- `표준 용어` bullet이 term key 형식(`domain.concept` 또는 `domain.concept.subConcept`)이고, `terminology-index.json`에 등록되어 있으며(draft도 인정), 같은 key가 중복되지 않음
- 카드 본문에 등장한 `REQ-\d{3,}` 참조가 다른(또는 자기) 요건 카드로 실제 존재함
- `상태: 승인`인 카드는 열린 질문이 모두 닫혀 있고, `## BDD 테스트 리뷰` 섹션에 `결과: 승인` 줄이 있으며, 같은 섹션에 `미완료` 표기가 없음
- `--check` 모드에서 `terminology-index.json`이 누락된 경우 단일 구조 오류로 보고됨 (먼저 `./gradlew indexTerminology` 또는 `./gradlew validateTerminology` 실행 필요)

상태 판정은 별개다.

- `validateHarness`: 전체 카드 기준 RED/GREEN/BLUE 집계 + 카드 정적 검증 + `@Requirement`에 카드에 없는 ID가 있는지 검사 + 안전 모드 용어 검증.
- `validateRequirementCard -Preq=REQ-XXX`: 선택 카드 RED 차단 + 카드 정적 검증(선택 카드만).
- `validateRequirementCardBlue -Preq=REQ-XXX`: 위에 더해 선택 카드 BLUE 미달 차단.
- `validateTerminology` (safe): 표준 용어 사용/누락을 warning으로 보고.
- `validateTerminologyStrict`: draft, 미등록, ban 위반 등을 error로 보고. 카드 정적 검증의 “등록 여부”와는 책임이 다르다(이쪽은 의미론 게이트, 정적 검증은 카드가 가리킨 key가 사전에 존재하는지만 본다).

## 수동 리뷰 항목

- 수용 기준 문장이 테스트로 옮길 수 있는 결과 문장인가
- 정상/예외/경계 조건이 빠지지 않았는가
- 목록 조회 API가 있으면 페이징 수용 기준이 별도로 포함되어 있는가
- 열린 질문이 모두 닫혔는가 (승인 전)
