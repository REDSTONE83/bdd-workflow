# 표준 용어 운영 가이드

이 디렉터리는 프로젝트에서 사용하는 표준 용어 사전이다. 요건 카드, API 설명, 테스트, 코드 식별자 사이의 어휘를 한 곳에서 관리해 의미가 흔들리지 않게 한다.

## 파일 구조

```text
docs/terminology/
  schema.json          용어 파일 스키마
  README.md            이 문서
  draft.json           아직 승인되지 않은 후보 용어
  domains/
    common.json        공통 인프라 명칭 (id, code 등)
    user.json          사용자/계정 도메인
    account.json       회원 가입 행위 도메인
```

새 도메인이 생기면 `docs/terminology/domains/<domain>.json`을 추가한다.

## term key 형식

```text
형식: {domain}.{concept}[.{subConcept}]
허용: user.email, user.passwordHash, account.signup
금지: userEmail, user_email, user/email, User.Email
```

key는 안정 식별자다. rename은 별도 변경으로만 진행한다.

## term 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `ko` | O | 정식 한국어 표기. 전역 allow surface에 자동 포함. |
| `en` | O | 정식 영어 표기. 전역 allow surface에 자동 포함. |
| `meaning` | O | 정의 문장. **ban 검사 대상에서 제외된다.** |
| `allow` | X | 허용 동의어 배열. 전역 allow surface에 추가됨. |
| `ban` | X | 금지 표현 배열. |
| `names` | X | 코드/스키마 명칭. 카테고리는 enum 고정. |
| `note` / `reason` | X | 운영 메모. 검증 대상 아님. |

## `names` 카테고리

```text
java    class / record / interface 이름
method  method 이름 (record accessor 포함)
field   인스턴스 field 및 record component
column  DB 컬럼
table   DB 테이블
json    JSON 필드
path    URL path segment (단/복수 자동 추론 없음, 실제 사용 segment만 등록)
```

새 카테고리는 schema 변경을 통해서만 추가한다.

## ban 검사 규칙

ban 매치는 다음 알고리즘으로 평가한다.

```text
allowSurfaces = ⋃ over all terms of (term.ko, term.en, term.allow, term.names.*)
banSurfaces   = ⋃ over all terms of (term.ban with originTerm)

for each banMatch in text:
  if any allow surface range fully contains banMatch.range:
    ignore
  else:
    finding(BAN_VIOLATION, originTerms = [...terms that ban this surface])
```

- canonical `ko`, `en`은 자동으로 allow surface에 포함된다. "회원 가입"이 자기 자신의 ban "회원"을 트리거하지 않는 이유다.
- allow surface는 **전역 합집합**이다. term A의 ban이 term B의 allow에 덮여도 무시된다.
- 동일 ban surface를 여러 term이 선언하면 finding 하나에 `originTerms` 배열로 묶는다.

## 검사 대상

**텍스트 surface 검사 (ban / unknown / draft / ambiguous)**

- 요건 카드 본문 (마크다운 fenced code block 제외)
- `@Covers`
- `@DisplayName`
- `@Operation.summary`
- `@Operation.description`
- `@Schema.description`
- `@ApiResponse.description`

**코드명 검사 (`names` 규칙)**

- Java class / record / interface 이름
- method 이름
- 인스턴스 field 및 record component
- DTO record component 이름
- JSON 필드 이름
- Entity table / column 이름

## 정규화 정책

- 검색(`terminology search`)은 한국어 공백 제거, 영어 case-insensitive, snake/camel/kebab 통합 normalization을 적용한다.
- ban / names 검증은 **정확 일치**로 시작한다. 영어 case-insensitive 도입은 schema 변경으로만 켠다.

## 검색 CLI의 원본 의존

- `terminology search`는 매 호출마다 `docs/terminology/domains/*.json`과 `draft.json`을 **직접 로드**한다. `terminology.index.json`에 의존하지 않는다.
- 새 term을 추가한 직후 `indexTerminology`를 돌리지 않아도 검색 결과에 즉시 반영된다.
- `terminology.index.json`은 validate 일관성과 외부 도구용 생성물로만 둔다.

## 검증 모드

| 모드 | 용도 | 동작 | exit |
|------|------|------|-----:|
| `safe` (기본) | 개발 중 / 초기 통합 | 모든 finding을 warning으로 보고 | 0 |
| `strict` | 최종 승인 / 릴리스 검증 | 심각 finding은 error로 보고 | error 있으면 1 |

```bash
node harness/tools/terminology.mjs validate           # safe
node harness/tools/terminology.mjs validate --strict  # strict
```

각 finding은 두 severity 필드를 동시에 가진다.

- `severity`: 현재 모드에서의 보고 등급
- `strictSeverity`: strict 모드 기준 등급 (모드 무관하게 항상 동일)

safe 모드에서도 `strictSeverity=error`인 finding은 `counts.strictError`에 누적되어, 최종 검증 전에 잠재 위반 수를 파악할 수 있다.

## finding 종류

| kind | safe severity | strict severity | 의미 |
|------|---------------|-----------------|------|
| `BAN_VIOLATION` | warning | error | 금지 표현 사용 |
| `UNKNOWN_TERM` | warning | error | 카드의 term key가 용어집에 없음 |
| `INVALID_TERM_KEY` | warning | error | 카드의 term key 형식이 잘못됨 |
| `GLOSSARY_NAME_DUPLICATE` | warning | error | 같은 코드/DB 이름을 여러 term이 소유 |
| `DRAFT_TERM` | warning | error | draft 용어가 최종 검증까지 남음 |
| `UNREGISTERED_CODE_NAME` | warning | warning | 코드명이 용어집 `names`에 없음 |
| `AMBIGUOUS_SURFACE` | warning | warning | 같은 표현이 여러 term에 걸림 |
| `TERM_NOT_DECLARED_IN_CARD` | warning (도입 예정) | warning (도입 예정) | 자리만 비워둠 |

`TERM_NOT_DECLARED_IN_CARD`는 초기 단계에서 미도입 상태로 두고, 카드와 코드의 cross-link이 안정화된 뒤 활성화한다.

## RED/GREEN/BLUE 결합

태스크 분담은 다음과 같다.

- `npm run app:validate`와 `npm run harness:validate`에는 safe 기본의 terminology validation을 연결한다.
- 실제 실패 판정은 REQ-010 통합 게이트(`gate.mjs`)가 `terminology.findings.json`의 `strictSeverity: error`를 TRM 카테고리로 차단해 담당한다.
- 단독 진단이 필요하면 `node harness/tools/terminology.mjs validate --strict`를 실행한다.
- trace 리포트는 terminology finding을 REQ별로 표시/집계하기만 한다. safe 리포트의 `strictError`는 RED/GREEN/BLUE 판정에는 반영하지 않지만, 통합 게이트에서는 실패 사유가 된다.

| 조건 | trace 표시 | 판정 영향 |
|------|-----------|-----------|
| safe finding이 있고 `strictError = 0` | REQ별 finding 카운트 표시 | 없음 |
| safe finding이 있고 `strictError > 0` | strict 실패 지표 함께 표시 | TRM 게이트 실패 (scope별 validate fail) |
| strict 진단(`node harness/tools/terminology.mjs validate --strict`)에서 error | 단독 명령이 exit 1 | 진단 실패 |

## term 상태 분류

```text
domains/*.json에 있음  approved   통과
draft.json에만 있음    draft      safe=warning, strict=error
어디에도 없음           unknown    safe=warning, strict=error
```

- 같은 키가 두 파일에 동시에 있으면 hard error.
- draft 승격은 `draft.json`에서 제거 후 `domains/<domain>.json`에 추가하는 단순 이동이다.

## 카드 `## 표준 용어` 섹션 정책

요건 카드의 `## 표준 용어`에는 해당 카드의 비즈니스 의미에 핵심적인 용어만 등록한다.

- **포함**: 카드 도메인의 term (예: REQ-002의 `todo.*`), 카드가 참조하는 인접 도메인의 term (예: REQ-002의 `category.id`, `user.id`).
- **제외**: `common.*`처럼 모든 카드가 자동으로 의존하는 도메인-무관 인프라 용어 (audit 컬럼, ApiError 부속 필드, PageResponse 부속 필드 등). 한 번 `domains/common.json`에 등록되면 `UNREGISTERED_CODE_NAME` 검사를 통과하므로 카드별로 반복 명시하지 않는다.

근거: 공통 인프라 용어를 카드마다 나열하면 잡음이 늘고 카드 리뷰 시 의미 있는 도메인 용어와 섞여 우선순위를 잃는다. 카드의 비즈니스 결정이 공통 용어의 의미를 좁히거나 확장할 때만 의사결정 로그에 별도로 남긴다.

## 도메인 단어 결정 사항

- `회원`은 결과 객체명으로 쓰지 않는다. 가입 행위는 **회원 가입**, 결과 객체는 **계정**으로 표기한다.
- `signup` 영문 표기는 코드 method/path 기준으로 유지한다. 문서/OpenAPI 설명은 한국어 표준 용어를 우선한다.
- `account.signup`의 `ban`이 빈 배열인 것은 의도된 상태다. 행위 동의어는 표준어/허용어로 관리하고 금지어를 두지 않는다.

## 운영 흐름

1. 새 요건 작성 전 `node harness/tools/terminology.mjs search <표현>`으로 기존 용어를 찾는다.
2. 적합한 term이 있으면 카드의 `표준 용어`에 key를 적는다.
3. 적합한 term이 없으면 CLI로 draft 후보를 등록한다. `draft.json`을 직접 편집하지 않는다.
4. 도메인 합의 후 `domains/<domain>.json`으로 이동하면 approved로 승격되어 strict 검증에서도 통과한다.

### draft 관리 CLI

`draft.json`은 저장 포맷이고, 편집은 CLI로 한다. 검색에서 적합한 term을 찾지 못한 경우 또는 사용자의 명시적 선택으로만 신규 등록한다.

```bash
node harness/tools/terminology.mjs draft add \
  --key todo.dueDate \
  --ko "마감일" \
  --en "due date" \
  --meaning "할 일을 마치기로 한 목표 날짜." \
  --reason "REQ-002 작성 중 검색 결과가 없어 후보로 등록" \
  --name field=dueDate --name json=dueDate --name column=due_date
```

- `--key`, `--ko`, `--en`, `--meaning`, `--reason`은 필수.
- `--allow`, `--ban`, `--name category=value`, `--note`는 0회 이상 반복 가능.
- 이미 approved 또는 draft에 존재하는 key는 거부한다.

```bash
node harness/tools/terminology.mjs draft update todo.dueDate \
  --set "reason=시간 포함 여부 합의 후 승격" \
  --add-allow "due-date" \
  --add-name table=todo \
  --remove-name column=due_date
```

- `--set`은 `ko/en/meaning/note/reason`만 지원한다. allow/ban/names는 `--add-*` / `--remove-*`로 patch한다.
- 변경 옵션이 하나도 없으면 거부한다.

```bash
node harness/tools/terminology.mjs draft delete todo.dueDate
```

- 요건 카드의 `표준 용어` bullet에 등장하면 기본 거부한다. 어느 카드가 참조하는지 함께 출력한다.
- `--force`로 우회할 수 있다. 우회 시에도 어떤 카드가 여전히 참조 중인지 출력한다.

모든 쓰기는 변경 직후 `loadTerminology()` 진단을 다시 돌려 새 오류가 생기면 draft.json을 원상복구한다.

`draft.json`에 샘플 term을 한 개 이상 유지해 DRAFT_TERM 경로가 항상 살아 있는지 확인한다. 어느 카드도 참조하지 않는 draft term은 finding 0개로 termStatus에만 표시된다.
