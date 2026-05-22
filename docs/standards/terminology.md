# 표준 용어 운영

용어 사전과 검사 알고리즘의 단일 소스는 `docs/terminology/README.md`다. 이 표준 문서는 일상 운영에서 기억해야 할 요점만 정리한다.

## 모드 두 가지

- `safe`(기본): 모든 finding을 warning으로 보고하고 항상 exit 0.
- `strict`: 심각 finding을 error로 보고하고 1개라도 있으면 exit 1.

`validateHarness`는 safe 모드 `validateTerminology`를 의존성으로 포함한다. 따라서 일상 빌드는 terminology finding 때문에 실패하지 않고, 잠재 위반은 `counts.strictError`로 누적되어 미리 보인다.

## 최종 승인 게이트

최종 승인이나 릴리스 전에는 strict를 따로 돌려 0으로 맞춘다.

```bash
cd back-end
./gradlew validateTerminologyStrict
```

이 게이트는 `validateHarness`에 연결하지 않는다. 즉 `validateHarness`를 우회적으로 strict 게이트로 만들지 않는다.

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

trace 리포트는 terminology finding을 카드별로 표시/집계만 한다. safe 리포트의 `strictError`는 "잠재 strict 실패" 지표로 같이 보여주되, RED/GREEN/BLUE 판정에는 반영하지 않는다. 실제 실패 게이트는 `validateTerminologyStrict` 태스크 하나뿐이다.

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
