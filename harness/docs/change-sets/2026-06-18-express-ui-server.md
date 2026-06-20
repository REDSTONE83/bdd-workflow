# Change Set: 2026-06-18 하네스 UI Express 서버 도입

상태: 완료
요청일: 2026-06-18
변경 유형: 하네스 개선, 마이그레이션
영향 요건: REQ-030, REQ-035
논의 상태: 없음

## 요청 요약

- 하네스 UI가 프런트엔드와 백엔드로 분리되어 보이고, 서빙 경로가 이중화되어 있다. 개발 모드는 Vite가 `/api/*`를 미들웨어로 임베드해 처리하고(`harness/ui/vite.config.ts`), 독립 실행은 raw `node:http` 서버(`harness/ui/server/index.ts`)가 API만 제공하며 빌드된 SPA를 함께 서빙하는 경로가 없다.
- 분리의 실체는 데이터 계층이 `node:fs`에 묶여 클라이언트/서버 경계가 강제되고, 그 경계를 서빙하는 진입점이 둘로 나뉘어 있다는 점이다. 프런트/백을 가르는 별도 런타임이 더 있는 것이 아니라, 한 서버가 UI와 API를 함께 소유하지 않는 것이 문제다.
- 경량 로컬 웹서버 하나가 JSON API, SSE 자동 갱신, 빌드된 SPA 정적 자산을 모두 서빙하도록 서버 프레임워크를 Express로 일원화한다. 이번 작업은 서버 프레임워크 도입과 서빙 일원화로 한정하고, 데이터 계약과 화면 동작은 그대로 둔다.

## 작업 범위

- `harness/ui`에 `express`(Express 5)와 타입 정의(`@types/express`) 의존성을 추가한다. 정적 자산 서빙은 내장 `express.static`을 사용한다.
- `harness/ui/server/index.ts`를 Express 앱으로 재구성한다. 현재 서버가 이미 Node `http` req/res 모델로 작성돼 있으므로, 기존 `handleHarnessApiRequest`의 분기 로직을 Express 라우터로 옮기되 모든 `/api/*` 엔드포인트의 경로·메서드·상태코드·JSON 응답 계약을 변경 전과 동일하게 유지한다(`/api/health`, `/api/commands`, `/api/requirements`, `/api/requirements/:id`, `/api/gate`, `/api/change-sets`, `/api/command-runner`, `/api/terminology`, `/api/artifact-summary`).
- SSE `/api/events`는 기존 `response.write` 기반 핸들러와 `fs.watch` 산출물 자동 갱신 동작을 Express `res`에 거의 그대로 이식한다.
- `/api/commands/run`(POST)은 기존 스텁 동작(허용 목록 검증, 202 응답, 허용 목록 밖 명령 거절)을 그대로 옮긴다. 실제 명령 실행 연결은 이번 범위에서 다루지 않는다.
- 빌드된 SPA(`harness/ui/dist`) 정적 자산을 `express.static`으로 서빙하고, 매칭되지 않는 클라이언트 라우트 요청은 `index.html`로 폴백한다. 단일 프로세스가 5180에서 UI·API·SSE를 함께 제공한다.
- 데이터 계층 `harness/ui/src/lib/harness-data/artifact-api.ts`는 변경하지 않는다(JSON 계약 불변).
- 개발 모드는 Vite(HMR)를 유지하되, `harness/ui/vite.config.ts`의 `/api/*` 미들웨어가 동일한 Express 앱(Connect 호환)에 마운트되도록 정리해 API 진실 원천을 한 곳으로 둔다.
- localhost(127.0.0.1) 전용 바인딩과 `HARNESS_UI_PORT`(기본 5180)를 유지한다.
- 단일 서버 기동에 필요한 npm 스크립트와 `harness/tools/run.mjs`의 `harness:ui` 배선을 정리하되, 기존 `npm run harness:ui` 개발 기동 동작은 깨지 않는다.

## 제외 범위

- Agent SDK(`@anthropic-ai/claude-agent-sdk`) 도입, WebSocket, `canUseTool` 대화형 승인 프로토콜, 잡 매니저 확장. 추후 기능 개선 시 별도 Change Set에서 진행한다.
- 문서 편집 API(요건 카드·Change Set·시나리오 쓰기), 낙관적 동시성, git 검토·커밋 흐름. 별도 Change Set에서 다룬다.
- 실제 검증 명령 실행 백엔드 연결(REQ-035 러너의 명령 실행). 스텁 동작을 유지한다.
- 데이터 계약, 화면 동작, 요건 수용 기준 변경. 순수 서빙·프레임워크 교체로 한정한다.
- SSR/HTMX 전환 등 프런트엔드 아키텍처 변경. React SPA를 유지한다.
- 인증, 원격 접근, CSRF/Origin 강화 등 쓰기·실행 도입에 수반되는 보안 작업. 쓰기·에이전트 기능을 도입하는 별도 Change Set에서 함께 다룬다.
- 생성 산출물(`build/*`, `harness/ui/dist`, `storybook-static`, `test-results`)의 커밋.

## 완료 조건

- 단일 Express 서버가 5180(또는 `HARNESS_UI_PORT`)에서 JSON API, SSE `/api/events`, 빌드된 SPA 정적 자산을 모두 서빙한다.
- 기존 모든 `/api/*` 엔드포인트의 응답(상태코드와 JSON 형태)이 변경 전과 동일하다.
- SSE `/api/events`로 산출물 파일 변경 시 화면 자동 갱신이 동작한다(REQ-030 수용 기준 유지).
- localhost 전용 수신, 포트 5180, `HARNESS_UI_PORT` 재정의 동작이 유지된다(REQ-030 수용 기준 유지).
- 명령 실행 엔드포인트가 허용 목록 밖 요청을 거절하는 동작을 유지한다(REQ-035 수용 기준 유지).
- `cd harness/ui && npm run typecheck && npm run test && npm run build`가 통과하고, 기존 Storybook/Vitest 커버리지(REQ-029)가 그대로 GREEN이다.
- `npm run harness:validate`가 통과하고 REQ-030·REQ-035 trace 상태가 회귀하지 않는다.

## 검증 명령

- `npm run harness:trace`
- `npm run harness:validate`
- `cd harness/ui && npm run typecheck && npm run test && npm run build`
- `npm run harness:ui`
- `npm run harness:ui:serve`
- `curl -s http://127.0.0.1:5180/api/health`

## 검증 결과

- `cd harness/ui && npm run typecheck`: 통과. Express 라우터와 Vite 개발 미들웨어 타입 연결을 확인했다.
- `cd harness/ui && npm run test`: 통과. 17개 test file, 33개 test가 모두 PASS.
- `cd harness/ui && npm run build`: 통과. Vite production build가 `dist/index.html`과 정적 asset을 생성했다. 500kB 초과 chunk 경고는 게이트 실패가 아니며 기존 번들 크기 경고 성격이다.
- `npm run harness:self-test`: 통과. 62개 self-test가 모두 PASS. REQ-030 self-test에 단일 Express 서버의 SPA 정적 서빙, 클라이언트 라우트 `index.html` 폴백, `/api/health` JSON 응답 검증을 추가했다.
- `npm run harness:validate`: 통과. RED 0 / GREEN 0 / BLUE 16, gate PASS.
- `npm run harness:ui` + `curl -s http://127.0.0.1:5180/api/health`: 통과. dev 서버가 `http://127.0.0.1:5180/`에서 기동했고 health 응답은 `{"status":"ok","host":"127.0.0.1","port":5180}`.
- 2026-06-20: `npm run harness:ui:serve`를 추가했다. 루트 명령은 `harness/tools/run.mjs harness:ui:serve`를 거쳐 `harness/ui`의 `serve` 스크립트를 실행하고, `serve`는 production build 후 Express 서버를 기동한다. self-test가 루트 명령, runner 배선, `harness/ui` package script를 검증한다. 실제 실행 결과 production build 후 `http://127.0.0.1:5180`에서 서버가 기동했고, `/api/health`는 `{"status":"ok","host":"127.0.0.1","port":5180}`, `/requirements/REQ-030`은 `index.html` 폴백 200을 반환했다.
- `npm install --save-dev @types/express@^5`: `express` 런타임 의존성과 `@types/express` 개발 의존성 배치를 lockfile에 반영했다. npm audit 기준 5건(1 low, 4 critical) 취약점 알림이 남아 있으나 이번 Express 전환 게이트 실패 요인은 아니다.

## 결정 로그

- 2026-06-19: 서버 프레임워크로 Express(5)를 채택한다. 처음에는 Hono를 검토했으나, 현재 UI 서버가 이미 Node `http` req/res 모델로 작성돼 있어 동일 모델인 Express로의 이전이 diff와 회귀 위험이 작고, SSE 핸들러(`response.write`+`fs.watch`)를 거의 그대로 이식할 수 있으며, Vite 개발 서버의 Connect 미들웨어에 어댑터 없이 네이티브로 마운트되기 때문이다.
- 2026-06-19: Hono를 채택하지 않는다. Hono의 핵심 강점(엣지·멀티런타임·높은 처리량·엔드투엔드 타입 RPC)은 localhost 전용·Node 단일 사용자·읽기 위주 도구에는 적용되지 않고, 남는 우위(가벼운 의존성·약간 깔끔한 SSE/TS DX)는 raw `node:http`에서의 이전 비용과 Vite 통합 적합성을 넘지 못한다.
- 2026-06-18: 이번 범위는 서버 프레임워크 도입과 서빙 일원화로 한정한다. Agent SDK·WebSocket·대화형 승인·문서 편집 API는 계약과 보안 영향이 커서 별도 Change Set으로 분리하고, 추후 기능 개선 시 진행한다.
- 2026-06-18: 데이터 계층(`artifact-api.ts`)과 JSON 계약을 변경하지 않는다. 화면·테스트·요건 회귀 없이 서빙과 프레임워크만 교체하기 위해서다.
- 2026-06-18: React SPA를 유지한다. SSR/HTMX 전환(검토했던 대안)은 하네스 UI의 Storybook 검증 채널(REQ-029)을 재설계해야 하므로 이번 범위에서 채택하지 않는다.
- 2026-06-18: 개발 모드는 Vite를 유지하되 `/api/*`를 동일한 Express 앱에 위임(마운트)한다. 개발·운영의 API 동작이 한 구현에서 나오도록 진실 원천을 하나로 둔다.

## 열린 논의

- 없음
