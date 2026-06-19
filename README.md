# bdd-workflow

요건 카드, 시나리오, 코드, 테스트 결과를 `REQ-XXX` 하나로 잇는 **코드 중심 BDD 하네스**와, 그 하네스로 검사하는 예제 애플리케이션을 함께 담은 저장소다.

## 한눈에 보기

- 사람이 직접 관리하는 ID는 **요건 ID(`REQ-XXX`)뿐**이다. API ID, 화면 ID, 시나리오 ID는 만들지 않는다.
- 요건 카드의 **수용 기준(AC)** 이 테스트의 `@Covers` / `Covers` 메타데이터와 연결되어 구현 완료 여부를 판정한다.
- 저장소는 **애플리케이션(`app/`)** 과 **하네스(`harness/`)** 를 최상위에서 분리하고, 검증 산출물은 `build/`에 생성한다.
- 이 README는 사람용 진입점이다. 에이전트/기여자 작업 규칙은 [AGENTS.md](AGENTS.md)에 있다.

## 저장소 구조

```text
bdd-workflow/
├─ AGENTS.md            작업 규칙 인덱스 (에이전트/기여자)
├─ package.json         scope별 검증 명령 (app:* / harness:* / repo:*)
├─ app/                 애플리케이션 (예제 제품: 인증 + 할 일 관리)
│  ├─ docs/             요건 카드 · Change Set · 시나리오 · 구현 표준
│  ├─ back-end/         Spring Boot API (Java 17, Gradle)
│  └─ front-end/        React / Vite / TypeScript + Storybook + Playwright
├─ harness/             추적 · 검증 하네스
│  ├─ docs/             하네스 문서 · 요건 · 표준 · 용어
│  ├─ annotations/      @Requirement, @Covers (애플리케이션이 사용)
│  ├─ source-indexer/   JavaParser 기반 백엔드 소스 인덱서
│  ├─ tools/            Node collector · validator · trace · report · gate
│  ├─ self-test/        하네스 요건을 검증하는 self-test
│  └─ ui/               하네스 산출물 조회 + 검증 명령 실행용 로컬 웹 UI
└─ build/               생성 산출물 (직접 편집 금지)
   ├─ app/              앱 검증 산출물 (indexes · findings · state · reports)
   └─ harness/          하네스 검증 산출물
```

`build/*`, `app/front-end/dist`, `*/storybook-static`, `playwright-report` 등은 하네스/빌드가 다시 생성하므로 **사람이 직접 편집하지 않는다**.

## 빠른 시작

### 사전 요구사항

- **JDK 17** (백엔드 Gradle 툴체인)
- **Node.js LTS** (프런트엔드 · 하네스 도구 · 하네스 UI)

### 설치

루트의 `app:*` / `harness:*` 명령은 Node 내장 모듈만 사용하므로 **루트 `npm install`은 필요 없다.** 의존성 설치는 다음 위치에서만 한다.

```bash
cd app/front-end && npm install     # 프런트엔드
cd harness/ui && npm install        # 하네스 UI
# 백엔드는 ./gradlew 가 의존성을 직접 내려받는다 (별도 설치 불필요)
```

### 첫 검증

```bash
npm run repo:validate               # 앱 게이트 + 하네스 게이트를 순차 실행
```

### 하네스 UI 띄우기

```bash
npm run harness:ui                  # 로컬 하네스 UI dev 서버 (Vite)
cd harness/ui && npm run server     # 검증 명령 실행용 API 서버
```

## 핵심 개념

요건의 상태는 추적 결과에 따라 다음으로 판정한다. 상세 기준은 [overview.md](harness/docs/overview.md)에 있다.

| 상태 | 의미 |
|------|------|
| **RED** | 구현/AC 커버 테스트 없음 · 테스트 미실행·실패·스킵 · 알 수 없는 `REQ` 참조 |
| **GREEN** | 대상 시스템에 맞는 구현·검증 연결 있음 + 모든 AC가 PASS + 연결 테스트 모두 PASS |
| **BLUE** | GREEN 조건 충족 + 요건 카드 승인 + 열린 질문 없음 |
| **INACTIVE** | `상태: 대체됨` / `폐기` 카드 — 구조 검증은 받되 완료 판정에서 제외 |

검증 파이프라인은 4개 layer로 나뉜다.

```text
Collect  →  Validate  →  Trace  →  Report (+ gate)
원본        indexes      findings   state · reports · 게이트 종료 코드
```

`gate.mjs`가 단일 통합 게이트이며 실패를 8개 카테고리(TRACE/CARD/REF/TRC/BE/FE/SCN/TRM)로 분리한다. 자세한 내용은 [overview.md](harness/docs/overview.md)를 본다.

## 작업 흐름

요건 카드 작성 절차의 상세는 [requirement-authoring.md](harness/docs/requirement-authoring.md)를 따른다.

**애플리케이션 작업**

1. `app/docs/change-sets`에 작업 범위를 정리한다.
2. 요건은 `app/docs/requirements`, 시나리오는 `app/docs/scenarios`에 작성한다.
3. `app/back-end` · `app/front-end`에서 구현/테스트를 진행한다.
4. `npm run app:validate`로 앱 게이트를 통과시킨다. (Skeleton 단계는 `app:trace`로 현황만 본다)

**하네스 작업**

1. `harness/docs/change-sets`에 작업 범위를 정리한다.
2. 요건은 `harness/docs/requirements`, 시나리오는 `harness/docs/scenarios`에 작성한다.
3. `harness/tools` · `source-indexer` · `annotations`에서 구현하고 `harness/self-test`로 검증한다.
4. `npm run harness:validate`로 하네스 게이트를 통과시킨다.

> 혼합 작업은 앱/하네스 Change Set을 따로 만들어 서로 링크한다.

## 자주 쓰는 명령

| 명령 | 용도 |
|------|------|
| `npm run app:validate` | 앱 scope 통합 게이트 |
| `npm run app:trace -- --requirement REQ-XXX` | 앱 단일 요건 추적 현황 |
| `npm run app:test` | 앱 백엔드 테스트 (프런트엔드는 `app:e2e` / `app:e2e:live`) |
| `npm run harness:validate` | 하네스 scope 통합 게이트 |
| `npm run harness:trace -- --requirement REQ-XXX` | 하네스 단일 요건 추적 현황 |
| `npm run harness:self-test` | 하네스 self-test 실행 |
| `npm run harness:ui` | 로컬 하네스 UI dev 서버 |
| `npm run repo:validate` | 앱 게이트 + 하네스 게이트 순차 실행 |

백엔드/프런트엔드 상세 명령은 [AGENTS.md](AGENTS.md)의 "자주 쓰는 검증 명령"을 본다.

## 문서 맵

| 문서 | 내용 |
|------|------|
| [AGENTS.md](AGENTS.md) | 에이전트/기여자 작업 규칙 인덱스 |
| [app/docs/README.md](app/docs/README.md) | 애플리케이션 문서 개요 |
| [app/docs/standards/README.md](app/docs/standards/README.md) | 앱 구현 표준 (API · JPA · FE · 런타임) |
| [harness/docs/overview.md](harness/docs/overview.md) | 하네스 개요 · 상태 판정 · 파이프라인 |
| [harness/docs/project-structure.md](harness/docs/project-structure.md) | 폴더 구조 가이드 |
| [harness/docs/data-contracts.md](harness/docs/data-contracts.md) | 도구 간 JSON 데이터 계약 |
| [harness/docs/requirement-authoring.md](harness/docs/requirement-authoring.md) | 요건 카드 작성 절차 |
| [harness/docs/standards/](harness/docs/standards/) | 카드 · Acceptance · 용어 · UI 표준 |
