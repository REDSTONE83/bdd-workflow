# Change Set: 2026-06-10 하네스 로컬 웹 UI MVP

상태: 진행중
요청일: 2026-06-10
변경 유형: 신규
영향 요건: REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037
논의 상태: 없음

## 요청 요약

- 하네스·워크플로우 작업을 로컬 퍼스트 웹 UI로 진행할 수 있게 한다.
- MVP 범위는 관제(읽기 전용 조회)와 검증 명령 실행이다. 문서 쓰기와 승인 액션은 후속 단계로 미룬다.
- UI Skeleton 검토와 UI AC 커버리지는 Storybook Vitest로, TDD는 Vitest 보조 테스트로 진행할 수 있는 기반을 함께 마련한다.

## 작업 범위

- 신규 하네스 요건 발급(초안 시작):
  - REQ-029 하네스 UI 검증 채널 (harness/ui Storybook Vitest 결과를 하네스 scope 추적에 집계)
  - REQ-030 하네스 UI 앱셸
  - REQ-031 하네스 UI 요건 추적 보드
  - REQ-032 하네스 UI 요건 상세 추적
  - REQ-033 하네스 UI 게이트 현황 조회
  - REQ-034 하네스 UI Change Set 진행 조회
  - REQ-035 하네스 UI 검증 명령 실행
  - REQ-036 하네스 UI 표준 용어 조회
  - REQ-037 하네스 UI 요건 검색/선택 대화상자
- 요건별 `.feature` 시나리오를 `harness/docs/scenarios`에 작성한다.
- Skeleton 설계 전에 하네스 UI 구조, 데이터 경계, Storybook, FE BDD, 명령 실행 표준을 `harness/docs/standards/harness-ui.md`에 확정한다.
- REQ-029~REQ-037 카드에 Skeleton 설계를 남긴다. 설계 범위는 검증 설계, UI/검사기/서버 Skeleton, Storybook 계약, 추적 정책이다.
- harness/ui 프로젝트 스캐폴드: React + Vite + TypeScript + Tailwind, Storybook, Vitest, Playwright (Skeleton 단계부터).
- 하네스 검증 채널 확장: harness/ui Storybook Vitest 메타데이터 collector, 테스트 결과 병합, 추적 판정의 front-end 테스트 채널 사용 (REQ-029).
- 하네스 Storybook 정적 검증 와이어링: harness/ui story 메타데이터 수집, 카드 Storybook 계약 대조, `harness:validate`의 harness/ui Storybook build 실행 (REQ-029).
- `harness/tools/run.mjs`에 하네스 UI 기동 명령과 `harness:validate` 입력 단계를 추가한다.
- AGENTS.md와 하네스 문서의 직접 관리 산출물 목록·명령 안내를 갱신한다.

## 제외 범위

- 문서 작성·편집·승인 액션(P3): 카드/Change Set/시나리오 편집, 열린 질문 워크플로우, 승인 버튼.
- Storybook 연동 화면, git 컨텍스트 표시, OpenAPI 뷰어(P4).
- 데스크탑 앱 패키징(Electron 등), 원격 접근, 인증.
- 하네스 UI 서버·화면의 `build/` 생성 산출물 직접 쓰기. UI는 산출물을 읽기만 한다. 허용된 검증 명령이 기존 하네스 도구를 통해 `build/` 산출물을 갱신하는 것은 검증 명령 실행(REQ-035)의 정상 동작이다.

## 완료 조건

- REQ-029~REQ-037이 카드 워크플로우(초안 → Skeleton → 테스트 → 구현 → 검증)를 거쳐 승인된다.
- `npm run harness:validate`가 통과하고, 하네스 UI 카드의 (UI) 수용 기준이 harness/ui Storybook Vitest 결과로 판정된다.
- 하네스 UI에서 두 scope의 요건 추적 현황, 표준 용어 목록, 게이트 현황, Change Set 진행을 조회하고 허용된 검증 명령을 실행할 수 있다.

## 검증 명령

- `npm run harness:trace -- --requirement REQ-029` (REQ-030~REQ-037 동일)
- `npm run harness:validate`
- Skeleton 단계 이후: `cd harness/ui && npm run typecheck && npm run test && npm run build-storybook && npm run e2e`

## 결정 로그

- 2026-06-10: MVP 범위는 P1 관제 + P2 검증 명령 실행으로 한다. 쓰기 없이도 즉시 가치가 있고 파일 원천 리스크가 없다. (사용자가 권장안 채택)
- 2026-06-10: MVP의 쓰기는 로컬 에디터 점프까지만 제공한다. 문서 쓰기는 후속 Change Set에서 diff 미리보기와 함께 도입한다. (사용자가 권장안 채택)
- 2026-06-10: AI 에이전트는 UI에 내장하지 않는다. 에이전트는 CLI에서 병행 작업하고 UI는 파일 watch로 변경을 반영한다. (사용자가 권장안 채택)
- 2026-06-10: 위치는 `harness/ui`, 스택은 React + Vite + TypeScript + Tailwind로 `app/front-end`와 동일하게 맞춘다. (사용자가 권장안 채택)
- 2026-06-10: 하네스 UI는 RED/GREEN/BLUE와 게이트 판정을 재계산하지 않고 `build/{scope}` 산출물과 게이트 도구 판정을 그대로 표시한다. REQ-010 단일 게이트 원칙을 유지하기 위해서다.
- 2026-06-10: 하네스 UI 카드의 (UI) 수용 기준은 harness/ui Storybook Vitest story 테스트가 커버하고, 이를 위해 하네스 scope에 front-end 테스트 채널을 추가한다(REQ-029). Vitest 단위 테스트는 TDD 보조로 두고 AC 커버리지에 포함하지 않는다.
- 2026-06-10: REQ-029 구현 전까지 UI 카드의 (UI) 수용 기준 RED는 초안/Skeleton/테스트 단계의 정상 RED로 본다.
- 2026-06-10: harness scope의 Storybook 정적 검증(story 메타데이터 수집, Storybook 계약 대조, Storybook build 실행)을 REQ-029 범위에 포함한다. 하네스 UI 카드의 Skeleton 승인 게이트 강도를 app scope와 맞추기 위해서다.
- 2026-06-10: 카드 초안 검토 결과 두 가지를 조정한다. `build/` 산출물 경계는 "UI 서버는 직접 쓰지 않고, 갱신은 허용된 검증 명령이 실행하는 기존 하네스 도구가 한다"로 명확화하고, 허용 명령은 npm script 전부에서 명시 등록한 검증 명령 목록으로 좁힌다(REQ-035 의사결정 로그 참조).
- 2026-06-10: Skeleton 설계 전에 `harness/docs/standards/harness-ui.md`를 신설해 하네스 UI의 구조, 산출물 읽기 경계, Storybook 상태, FE BDD 채널, 명령 실행 허용 목록을 표준으로 고정한다.
- 2026-06-10: 하네스 UI 표준은 app front-end 표준을 상속하거나 참고하지 않는 독립 표준으로 둔다. 같은 기술 스택을 쓰더라도 관제 도구의 데이터 경계와 검증 채널이 달라질 수 있기 때문이다.
- 2026-06-10: Tauri 데스크탑 전환·하네스 도구 Rust 포팅·MCP 서버 제공 가능성을 검토했고, 그래도 웹 UI를 먼저 진행한다. UI는 `build/{scope}` 데이터 계약에만 결합되어 도구 구현 언어 교체와 독립이고, Tauri 프런트엔드는 웹 프런트엔드를 그대로 재사용하며, tauri-driver가 macOS를 지원하지 않아 Playwright FE BDD 채널용 웹 타깃은 전환 후에도 유지해야 한다. 전환 순서는 웹 UI MVP → 필요 시 MCP 서버(기존 Node 도구 래핑으로 선행 가능) → Rust 코어 포팅(데이터 계약 동일 유지) → Tauri 래핑(웹 타깃 병행 유지)으로 한다.
- 2026-06-10: 전환 대비 가드레일을 Skeleton 설계에 반영한다. 화면의 데이터 접근은 단일 클라이언트 모듈로 격리하고, 산출물 watch 갱신과 실행 로그 스트림은 구독 인터페이스로 추상화하고, 허용 명령 레지스트리는 id와 메타데이터 기반으로 정의해 실행 백엔드 교체가 레지스트리 변경으로 끝나게 한다.
- 2026-06-10: Skeleton 설계 산출물은 카드에 먼저 남기고, 실제 harness/ui Storybook surface와 source index를 만든 뒤 REQ-029~REQ-035를 `Skeleton 검토중`으로 올린다. 실행 테스트가 아직 없으므로 최신 BDD 테스트 리뷰 `결과:`는 `미완료`로 둔다.
- 2026-06-10: REQ-033 게이트 화면은 `gate.mjs`의 카테고리 판정을 UI가 재계산하지 않도록 `build/{scope}/reports/gate-report.json` 또는 동등한 machine-readable DTO를 사용한다.
- 2026-06-10: 하네스 UI 데이터 조회는 TanStack Query를 유지한다. 표준이 요구하는 query cache 무효화 기반 자동 갱신, 화면 공통 로딩/조회 실패 상태, 화면 간 산출물 공유 캐시, scope 전환 경합 차단을 자체 store로 재구현하지 않기 위해서이고, `app/front-end`와 같은 라이브러리라 패턴 재학습이 없다. (사용자가 권장안 채택)
- 2026-06-12: AppShell 좌측 LNB에 표준 용어 메뉴를 추가하고, 전체 표준 용어 목록 조회/검색 화면을 REQ-036으로 분리한다. 표준 용어 화면은 `terminology.index.json` 산출물을 표시하고 원본 용어 사전 편집은 다루지 않는다.
- 2026-06-12: 실행 화면과 Change Set 화면이 함께 쓰는 요건 검색/선택 대화상자를 REQ-037로 분리한다. 부모 화면은 선택값 적용만 소유하고, 후보 표시·검색·단일 선택·선택 해제·빈 결과 UI 계약은 공용 요건에서 검증한다.

## 열린 논의

- 없음
