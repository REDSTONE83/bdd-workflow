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
- `확인 질문 로그`
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

### 확인 질문 로그 / 의사결정 로그

요건 작성 중 사용자에게 한 질문과 답변은 `확인 질문 로그`에 남긴다. 답변으로 확정된 정책은 `의사결정 로그`에 다음 항목으로 기록한다.

- 결정일
- 결정
- 이유
- 결정자
- 영향

결정이 수용 기준을 바꾸면 Acceptance Test의 `@Covers`와 `@DisplayName`도 함께 갱신한다.

### BDD 테스트 리뷰

초안 단계에서는 `미완료`로 둘 수 있다. 수용 기준과 Acceptance Test가 리뷰되기 전에는 요건 카드 상태를 `승인`으로 바꾸지 않는다.

## 금지 사항

- API 목록이나 테스트 메서드 목록을 카드에 직접 적지 않는다. 코드의 `@Requirement`, `@Covers` 스캔으로 자동 생성된 리포트(`back-end/build/harness/trace-report.md`)에서 확인한다.
- 별도 시나리오 ID, API ID, 테이블 ID를 만들지 않는다.

## 자동 검증 항목

- `validateHarness`: 카드 파싱, `@Requirement`에 카드에 없는 ID가 있는지 검사.
- `validateTerminology` (safe): 표준 용어 사용/누락을 warning으로 보고.
- `validateTerminologyStrict`: draft, 미등록, ban 위반 등을 error로 보고.

## 수동 리뷰 항목

- 수용 기준 문장이 테스트로 옮길 수 있는 결과 문장인가
- 정상/예외/경계 조건이 빠지지 않았는가
- 목록 조회 API가 있으면 페이징 수용 기준이 별도로 포함되어 있는가
- 열린 질문이 모두 닫혔는가 (승인 전)
