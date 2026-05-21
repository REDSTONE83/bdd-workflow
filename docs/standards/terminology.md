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

## 자주 쓰는 명령

```bash
# 용어 검색
node back-end/tools/terminology.mjs search <표현>

# 새 용어 후보 등록 (draft.json 직접 편집 금지)
node back-end/tools/terminology.mjs draft add ...
node back-end/tools/terminology.mjs draft update ...
node back-end/tools/terminology.mjs draft delete ...

# safe 검증
cd back-end && ./gradlew validateTerminology

# strict 게이트
cd back-end && ./gradlew validateTerminologyStrict
```
