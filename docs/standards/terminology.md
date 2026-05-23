# 표준 용어 운영

용어 사전과 검사 알고리즘의 단일 소스는 `docs/terminology/README.md`다. 이 표준 문서는 일상 운영에서 기억해야 할 요점만 정리한다.

## 모드 두 가지

- `safe`(기본): 모든 finding을 warning으로 보고하고 항상 exit 0.
- `strict`: 심각 finding을 error로 보고하고 1개라도 있으면 exit 1.

`validateHarness`는 safe 모드 `validateTerminology`를 의존성으로 포함하지만, REQ-010 통합 게이트(`gate.mjs`)가 `terminology.findings.json`의 `strictSeverity: error`까지 차단한다. 따라서 일상 빌드도 strict 기준으로 통과해야 한다. `counts.strictError`는 잠재 위반이 아니라 즉시 실패 사유다.

## 단독 진단 게이트

`validateHarness`와 동일한 TRM 차단 정책을 따로 확인하고 싶을 때 strict 모드를 직접 돌릴 수 있다.

```bash
cd back-end
./gradlew validateTerminologyStrict
```

이 태스크는 `validateHarness` 체인에는 들어가지 않는 단독 진단 도구다. TRM 카테고리 차단 자체는 `gate.mjs`가 통합 게이트의 일부로 수행한다.

## finding severity

| Finding 종류              | safe    | strict |
| ------------------------- | ------- | ------ |
| `BAN_VIOLATION`           | warning | error  |
| `UNKNOWN_TERM`            | warning | error  |
| `INVALID_TERM_KEY`        | warning | error  |
| `GLOSSARY_NAME_DUPLICATE` | warning | error  |
| `DRAFT_TERM`              | warning | error  |
| `UNREGISTERED_CODE_NAME`  | warning | warning |
| `AMBIGUOUS_SURFACE`       | warning | warning |

`blue-blocker` severity 개념은 폐지되었다. draft 용어는 더 이상 BLUE 자체를 차단하지 않고, strict 게이트에서 error로만 잡힌다.

## trace 리포트와의 관계

trace 리포트는 terminology finding을 카드별로 표시/집계만 한다. safe 리포트의 `strictError`는 RED/GREEN/BLUE 판정에는 반영하지 않지만, `validateHarness`/`validateRequirementCard*` 통합 게이트는 `gate.mjs`의 TRM 카테고리에서 동일 강도로 차단한다. `validateTerminologyStrict`는 단독 진단 도구로 남는다.

## 카드 `## 표준 용어` 섹션에 무엇을 넣는가

요건 카드의 `## 표준 용어` 섹션은 해당 카드의 **비즈니스 의미**에 핵심적인 용어만 등록한다. 도메인-무관 공통 용어는 등록하지 않는다.

| 분류 | 카드 표준 용어에 넣는가 |
| --- | --- |
| `<카드 도메인>.*` (예: REQ-002의 `todo.*`, REQ-003의 `category.*`) | O |
| 카드가 참조하는 인접 도메인 (예: REQ-002의 `category.id`, `user.id`) | O |
| `common.*` (audit 컬럼, ApiError 부속, PageResponse 부속 등 도메인-무관 공통 인프라) | **X — 등록하지 않는다** |

근거:
- `common.*` 용어는 모든 카드가 자동으로 의존하므로 카드별 표준 용어 섹션에 반복 나열하면 잡음이 늘고 카드 리뷰 시 의미 있는 도메인 용어와 섞여 우선순위를 잃는다.
- `domains/common.json`에 한 번 등록되면 `UNREGISTERED_CODE_NAME` 검사를 통과하므로 카드에 다시 명시할 필요가 없다.
- 단, 카드의 비즈니스 결정이 공통 용어의 의미를 좁히거나 확장하는 경우(예: REQ-002에서 `priority` enum 정렬 순서를 정의)는 그 정의를 의사결정 로그에 남긴다. 카드 표준 용어 섹션과는 별개 작업.

## 자주 쓰는 명령

```bash
# 용어 검색
node tools/harness/terminology.mjs search <표현>

# 새 용어 후보 등록 (draft.json 직접 편집 금지)
node tools/harness/terminology.mjs draft add ...
node tools/harness/terminology.mjs draft update ...
node tools/harness/terminology.mjs draft delete ...

# safe 검증
cd back-end && ./gradlew validateTerminology

# strict 게이트
cd back-end && ./gradlew validateTerminologyStrict
```
