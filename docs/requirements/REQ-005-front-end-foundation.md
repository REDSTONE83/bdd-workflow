# 요건 카드

요건 ID: REQ-005
제목: 프런트엔드 기반 앱 셸
우선순위: 중간
상태: 승인
구현 대상: front-end

## 사용자/목적

프런트엔드 개발자는 React, Vite, shadcn/ui 기반 앱 셸에서 이후 화면 개발을 시작할 수 있어야 한다.

## 범위

- React/Vite/shadcn 기반 앱 셸을 첫 화면으로 제공한다.
- 앱 셸은 프런트엔드 기반 구성을 사용자가 확인할 수 있게 표시한다.
- 앱 셸은 데스크톱 기준 화면에서 핵심 요소가 잘리지 않아야 한다.
- 앱 셸은 자동 접근성 검사를 통과해야 한다.
- 앱 셸의 대표 컴포넌트 상태는 Storybook에서 확인할 수 있어야 한다.

## 표준 용어

- ui.appShell
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 실제 업무 도메인 화면 구현
- API 연동
- 인증 상태에 따른 라우팅
- Visual Regression 기준 이미지 승인

## 수용 기준

- 프런트엔드 기반 앱 셸이 표시된다
- 데스크톱 화면에서 앱 셸의 핵심 요소가 화면 밖으로 넘치지 않는다
- 자동 접근성 검사에서 위반이 없어야 한다

## 의사결정 로그

- 결정일: 2026-05-22
  결정: 프런트엔드 기반 검증은 별도 `front-end` 대상 요건으로 추적한다.
  이유: 기존 백엔드 요건에 앱 셸을 억지로 연결하면 요건 의미와 테스트 결과가 어긋난다.
  결정자: Tech Lead
  영향: FE 소스 인덱스, Storybook 표면, Playwright BDD 결과가 `REQ-005`로 집계된다.

- 결정일: 2026-05-22
  결정: 초기 FE BDD 검증은 앱 셸 표시, 데스크톱 overflow, 자동 접근성 smoke로 제한한다.
  이유: 현재 단계는 업무 화면이 아니라 프런트엔드 기반과 하네스 연결을 검증하는 단계다.
  결정자: Tech Lead
  영향: 세부 업무 흐름, API 연동, 시각 회귀 기준 이미지는 후속 업무 요건에서 다룬다.

- 결정일: 2026-05-23
  결정: 기본 프런트엔드 검증 범위에서 모바일/태블릿 반응형 기준을 제외하고 데스크톱 화면만 확인한다.
  이유: 현재 제품 검증 범위를 데스크톱 업무 화면으로 제한한다.
  결정자: Product Owner, Tech Lead
  영향: REQ-005의 모바일 수용 기준과 Playwright 테스트를 데스크톱 기준으로 바꾼다.

- 결정일: 2026-05-27
  결정: `/` 경로는 자체 화면을 두지 않고 인증 상태에 따라 `/login` 또는 `/todos` 로 redirect 한다. 앱 셸 수용 기준은 비인증 진입점인 `/login` 화면 셸에서 검증한다.
  이유: `front-end-ui.md` 의 "장식 hero 금지", "첫 화면은 실제 사용 가능한 화면" 표준과 REQ-011 인증 흐름 도입에 맞춘다. 기존 `App.tsx` 의 foundation hero 는 표준 위반이고 인증 사용자에게는 워크스페이스 진입에 방해가 된다.
  결정자: REDSTONE
  영향: `src/App.tsx`/`src/App.test.tsx` 제거, `src/app/RootRedirect.tsx` 가 `/` 라우트를 보유, `app-shell.spec.ts` 는 `/login` 화면 셸 기준으로 갱신. AC 문장은 그대로 유지한다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-005-front-end-foundation.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-22
  검증 설계: `.feature`의 Scenario들이 앱 셸 표시, 데스크톱 표시, 접근성 smoke 수용 기준을 각각 `Covers:`로 다룬다.
  API Skeleton: 해당 없음.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 첫 화면 `/`, 앱 셸, Button Storybook 대표 상태, loading/empty/error 상태 해당 없음.
  검증: `generateFrontEndSourceIndex`, `npm run validate:full`, `validateHarness` 대상.
  승인자: Tech Lead
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-23
  리뷰자: 사용자
  확인: Playwright BDD 테스트 3개가 수용 기준 3개를 `Covers`로 1:1 연결하고 모두 PASS. Storybook은 Button의 Default/Disabled/Loading 필수 상태를 제공해 `FE-STORY-MISSING-STATE` 위반 없음. `./gradlew validateRequirementCardBlue -Preq=REQ-005` BUILD SUCCESSFUL.
  결과: 승인

## 열린 질문

- 없음
