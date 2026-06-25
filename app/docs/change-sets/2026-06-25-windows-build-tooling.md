# Change Set: 2026-06-25 앱 프런트엔드 Windows 빌드 도구

상태: 완료
요청일: 2026-06-25
변경 유형: 빌드/실행 환경
영향 요건: 없음
논의 상태: 없음
관련 Change Set: harness/docs/change-sets/2026-06-25-windows-runner-support.md

## 요청 요약

- 앱 프런트엔드의 빌드/테스트 도구가 Windows에서도 동작하도록 보완한다. cmd가 해석하지 못하는 POSIX 셸 문법(인라인 `VAR=값` 접두, `${VAR:-기본}` 확장)과 `.bin` 셸 shim 실행 문제를 제거한다.

## 작업 범위

- `package.json`의 storybook 스크립트(`test:storybook`/`storybook`/`build-storybook`)를 cross-env로 전환해 인라인 환경 변수 접두를 OS와 무관하게 처리한다(cross-env devDependency 추가).
- JUnit 출력 경로를 `vitest.config.ts`에서 `process.env.STORYBOOK_JUNIT_FILE ?? 기본값`으로 읽어, cmd가 해석하지 못하는 `${STORYBOOK_JUNIT_FILE:-...}` 셸 확장을 제거한다.
- `playwright.live.config.ts`를 크로스 플랫폼화한다. Windows에서는 `gradlew.bat` 대신 `java -jar gradle-wrapper.jar`로 gradle을 실행하고(러너와 동일 방식), 셸별 따옴표를 분기하며, 프런트엔드 dev 서버의 `VITE_BACKEND_ORIGIN`을 인라인 접두 대신 `webServer.env`로 전달한다.
- `tools/generate-api-client.mjs`가 `.bin/openapi-typescript`(Windows에서 `.cmd` shim) 대신 패키지의 JS 엔트리(`bin/cli.js`)를 `node`로 직접 실행하도록 바꾼다.

## 제외 범위

- 생성된 API 클라이언트(`src/api/generated/*`) 내용 변경(별도 정렬 드리프트는 본 작업과 무관하며 손대지 않는다).
- 앱 요건/시나리오/카드 변경(이번 작업은 빌드 도구 변경으로 요건이 없다).
- POSIX 동작 변경(기존 명령 동작은 동일하게 유지한다).

## 완료 조건

- storybook 스크립트가 cross-env로 OS와 무관하게 실행된다. ✓
- Storybook JUnit 결과가 러너 주입 경로(또는 기본 경로)에 생성된다. ✓
- live e2e Playwright 설정이 Windows에서 `gradlew.bat`과 `webServer.env`로 동작하도록 구성된다. ✓
- API 클라이언트 생성이 `.bin` shim 없이 `node`로 동작한다. ✓
- 앱 게이트(`npm run app:validate`)가 기존과 동일하게 통과한다. ✓

## 검증 명령

- `cd app/front-end && npm run typecheck`
- `npm run app:e2e`
- `cd app/front-end && npm run api:generate`
- `cd app/front-end && npx playwright test --list -c playwright.live.config.ts`
- `npm run app:validate` (repo:validate에 포함)

## 검증 결과

- 2026-06-25: `cd app/front-end && npm run typecheck` 통과. playwright.live/vitest 설정 포함 타입 오류 0.
- 2026-06-25: `npm run app:e2e` 통과(23 files, 99 tests). cross-env 실행 후 JUnit이 러너 주입 경로 `build/app/runs/<id>/test-results/storybook-junit.xml`에 생성됨을 확인.
- 2026-06-25: `cd app/front-end && npm run api:generate` 통과. `node`로 `bin/cli.js`를 실행해 스키마 생성.
- 2026-06-25: `npx playwright test --list -c playwright.live.config.ts` 통과. 설정 파싱 및 테스트 2건 목록 확인.
- 2026-06-25: `npm run repo:validate` 통과(exit 0). app gate pass, 요건 모두 BLUE.
- 실제 Windows 실행은 `windows-latest` CI(`.github/workflows/windows.yml`)에서 검증한다.

## 결정 로그

- 2026-06-25: 인라인 `VAR=값` 접두는 cross-env로, `${VAR:-기본}` 셸 확장은 vitest 설정의 `process.env ?? 기본값`으로 대체한다. cross-env는 환경 변수 주입만 하므로 기본값 처리는 설정으로 옮기는 것이 크로스 플랫폼에 안전하다.
- 2026-06-25: openapi-typescript는 `.bin` shim 대신 `node bin/cli.js`로 실행한다. node 실행 파일은 OS 무관하게 spawnSync로 직접 실행되고 Node가 인자 인용을 처리해 셸/배치 우회가 필요 없다.
- 2026-06-25: live e2e의 gradle 기동도 Windows에서는 `gradlew.bat` 대신 `java -jar gradle-wrapper.jar`로 실행해 러너와 방식을 통일한다(JAVA_HOME이 있으면 그 java.exe, 없으면 PATH의 java). 배치 파일 의존을 없애 러너와 일관성을 유지한다.

## 열린 논의

- 없음
