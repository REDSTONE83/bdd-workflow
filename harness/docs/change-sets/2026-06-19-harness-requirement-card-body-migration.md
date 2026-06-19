# Change Set: 2026-06-19 하네스 요건 카드 본문 이관

상태: 완료
요청일: 2026-06-19
변경 유형: 마이그레이션, 수정
영향 요건: REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012, REQ-030, REQ-031, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037
논의 상태: 없음

## 요청 요약

- 하네스 요건 카드에 남아 있는 legacy 본문 섹션을 새 요건 검증 워크플로우 용어와 생성 설계 표면 기준으로 이관한다.
- 현재 하네스 카드 검사에는 `CARD-LEGACY-SECTION` warning 48건이 남아 있으며, 이번 작업은 warning 정책이 아니라 실제 카드 본문을 정리하는 마이그레이션이다.
- 이관 후 하네스 요건 카드는 `검증 대상`, `API Skeleton`, `DB Skeleton`, `UI Skeleton`, `Storybook 계약`, `BDD 테스트 리뷰`를 사람이 직접 관리하지 않는다.

## 작업 범위

- 13개 하네스 요건 카드에서 legacy top-level 섹션을 제거하거나 새 섹션명으로 이관한다.
- `## BDD 테스트 리뷰`는 `## 수용 테스트 리뷰`로 바꾸고 기존 리뷰 이력과 최신 `결과:` 라인은 보존한다.
- `## 수용 테스트 리뷰` 아래 중첩된 `### 요건 Skeleton 설계 이력`/`### 요건 Skeleton 승인 이력` 제목은 이미 이관된 REQ-032 템플릿에 맞춰 모두 `### 요건 설계 승인 이력`으로 정규화한다.
- 같은 서브섹션의 인라인 라벨도 새 용어로 바꾼다: `UI Skeleton:`→`UI 설계:`, `Storybook 계약:`→`UI 설계 검토 표면:`, `서버 Skeleton:`→`서버 설계:`, `Skeleton 결과:`→`설계 결과:`. 리뷰 이력 내용 자체는 보존하되 카드의 `Skeleton` 어휘는 0건으로 만든다.
- `## 검증 대상`, `## API Skeleton`, `## DB Skeleton`, `## UI Skeleton`, `## Storybook 계약`은 생성 산출물 기반 설계 표면과 trace report에서 확인하도록 카드 본문에서 제거한다.
- UI 하네스 카드의 Storybook 검토 상태는 소스 metadata와 `harness/ui` source index가 소유한다는 점을 검증 결과로 확인한다.
- 대상 카드와 warning 기준은 2026-06-19 현재 `CARD-LEGACY-SECTION` 48건이다.
  - `BDD 테스트 리뷰`: 13건
  - `검증 대상`: 7건
  - `API Skeleton`: 7건
  - `DB Skeleton`: 7건
  - `UI Skeleton`: 7건
  - `Storybook 계약`: 7건

## 제외 범위

- `CARD-LEGACY-SECTION` warning을 error로 승격하는 정책 변경.
- 파서의 legacy alias 제거.
- 앱 요건 카드 본문 이관. 앱 scope 작업은 `app/docs/change-sets/2026-06-19-app-requirement-card-design-surface-migration.md`에서 이미 처리했다.
- 생성 산출물(`build/*`, `harness/ui/storybook-static`, `harness/ui/test-results`) 직접 수정.

## 완료 조건

- `harness/docs/requirements`에 legacy top-level 섹션 `## 검증 대상`, `## API Skeleton`, `## DB Skeleton`, `## UI Skeleton`, `## Storybook 계약`, `## BDD 테스트 리뷰`가 남지 않는다.
- `build/harness/findings/requirement-cards.findings.json`에서 `CARD-LEGACY-SECTION` warning이 0건이 된다.
- 13개 대상 카드 모두 필수 섹션 `## 수용 테스트 리뷰`를 가지며, 각 카드의 최신 `결과:` 라인이 보존되어 `승인` 상태가 유지된다.
- 13개 대상 카드에 `Skeleton` 어휘 잔존이 0건이다(`### 요건 Skeleton …` 제목과 인라인 `… Skeleton:`/`Skeleton 결과:` 라벨 포함).
- 하네스 요건 trace는 `BLUE=16`, `RED=0`, `GREEN=0`을 유지한다.
- 하네스 Change Set index와 Change Set report warning이 0건을 유지한다.

## 검증 명령

- `rg -n "^## (검증 대상|API Skeleton|DB Skeleton|UI Skeleton|화면/라우팅 Skeleton|Storybook 계약|UI / Storybook 계약|UI Storybook 계약|BDD 테스트 리뷰)$" harness/docs/requirements` (0건이어야 함)
- `rg -n "Skeleton" harness/docs/requirements` (h2 섹션 외 중첩 제목·인라인 라벨까지 0건이어야 함. 이미 이관된 REQ-028/029/032 포함 전체)
- `npm run harness:trace`
- `npm run harness:validate`
- `npm run repo:validate`

## 검증 결과

- 2026-06-19: 13개 하네스 요건 카드 본문 이관 완료. h2 legacy 섹션(`검증 대상`/`API Skeleton`/`DB Skeleton`/`UI Skeleton`/`Storybook 계약`) 제거, `## BDD 테스트 리뷰`→`## 수용 테스트 리뷰` 리네임, 중첩 `### 요건 Skeleton {설계,승인} 이력`→`### 요건 설계 승인 이력` 정규화. 인라인 라벨(`API/DB/Service/화면·라우팅/검사기/도구/UI/서버 Skeleton:`→`… 설계:`, `Storybook 계약:`→`UI 설계 검토 표면:`, `Skeleton 결과:`→`설계 결과:`)과 phase 산문(`Skeleton 단계`→`설계 단계` 등)을 새 용어로 갱신했다. 리뷰 이력 내용과 최신 `결과:` 라인은 보존했다.
- 2026-06-19: `rg "^## (검증 대상|API Skeleton|DB Skeleton|UI Skeleton|화면/라우팅 Skeleton|Storybook 계약|UI / Storybook 계약|UI Storybook 계약|BDD 테스트 리뷰)$" harness/docs/requirements` 0건. `rg "Skeleton" harness/docs/requirements` 0건(이미 이관된 REQ-028/029/032 포함 전체).
- 2026-06-19: 13개 대상 카드 모두 필수 섹션 `## 수용 테스트 리뷰`를 보유하고 최신 `결과: 승인`이 보존되어 상태 `승인`을 유지한다.
- 2026-06-19: `npm run harness:validate` 통과. `requirement-cards.findings.json`의 `CARD-LEGACY-SECTION` warning 48→0건, harness trace `BLUE=16, RED=0, GREEN=0`(structureIssues 48→0), gate `passed=true`.
- 2026-06-19: harness Change Set index/report warning 0건.
- 2026-06-19: `npm run repo:validate` exit 0. app·harness 게이트 모두 `passed=true`(app trace RED=0).

## 결정 로그

- 2026-06-19: legacy 섹션 warning 정책과 실제 본문 이관을 분리한다. warning 정책은 `2026-06-19-legacy-requirement-card-warning-policy.md`에서 완료했고, 본 Change Set은 카드 본문을 직접 정리한다.
- 2026-06-19: `BDD 테스트 리뷰`의 리뷰 이력은 검증 근거이므로 삭제하지 않고 `수용 테스트 리뷰` 아래로 옮긴다.
- 2026-06-19: 이관은 h2 섹션뿐 아니라 중첩 `### 요건 Skeleton …` 제목과 인라인 `Skeleton` 라벨까지 이미 이관된 REQ-032 카드와 동일한 새 용어로 정규화한다. `CARD-LEGACY-SECTION`(h2 전용)과 본 Change Set의 h2 검증 grep만으로는 이 잔존을 잡지 못하므로 `Skeleton` 잔존 0건을 별도 검증한다.
- 2026-06-19: API/DB/UI/Storybook 설계 항목은 카드 본문에 복제하지 않고 source index, trace report, 하네스 UI 설계 표면에서 확인한다.
- 2026-06-19: error 승격은 본문 이관 완료 후 별도 Change Set에서 진행한다.

## 열린 논의

- 없음
