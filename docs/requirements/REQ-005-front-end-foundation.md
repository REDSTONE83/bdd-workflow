# 요건 카드

요건 ID: REQ-005
제목: 프런트엔드 기반 앱 셸
우선순위: 중간
상태: 검토중
구현 대상: front-end

## 사용자/목적

프런트엔드 개발자는 React, Vite, shadcn/ui 기반 앱 셸에서 이후 화면 개발을 시작할 수 있어야 한다.

## 범위

- React/Vite/shadcn 기반 앱 셸을 첫 화면으로 제공한다.
- 앱 셸은 프런트엔드 기반 구성을 사용자가 확인할 수 있게 표시한다.
- 앱 셸은 모바일 너비에서도 핵심 요소가 잘리지 않아야 한다.
- 앱 셸은 자동 접근성 검사를 통과해야 한다.
- 앱 셸의 대표 컴포넌트 상태는 Storybook에서 확인할 수 있어야 한다.

## 표준 용어

- ui.appShell
- ui.responsiveLayout
- ui.accessibilityCheck

## 제외 범위

- 실제 업무 도메인 화면 구현
- API 연동
- 인증 상태에 따른 라우팅
- Visual Regression 기준 이미지 승인

## 수용 기준

- 프런트엔드 기반 앱 셸이 표시된다
- 모바일 화면에서 앱 셸의 핵심 요소가 화면 밖으로 넘치지 않는다
- 자동 접근성 검사에서 위반이 없어야 한다

## 의사결정 로그

- 결정일: 2026-05-22
  결정: 프런트엔드 기반 검증은 별도 `front-end` 대상 요건으로 추적한다.
  이유: 기존 백엔드 요건에 앱 셸을 억지로 연결하면 요건 의미와 테스트 결과가 어긋난다.
  결정자: Tech Lead
  영향: FE 소스 인덱스, Storybook 표면, Playwright BDD 결과가 `REQ-005`로 집계된다.

- 결정일: 2026-05-22
  결정: 초기 FE BDD 검증은 앱 셸 표시, 모바일 overflow, 자동 접근성 smoke로 제한한다.
  이유: 현재 단계는 업무 화면이 아니라 프런트엔드 기반과 하네스 연결을 검증하는 단계다.
  결정자: Tech Lead
  영향: 세부 업무 흐름, API 연동, 시각 회귀 기준 이미지는 후속 업무 요건에서 다룬다.

## BDD 테스트 리뷰

- 시나리오 문서: `docs/scenarios/REQ-005-front-end-foundation.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-22
  검증 설계: `.feature`의 Scenario들이 앱 셸 표시, 모바일 표시, 접근성 smoke 수용 기준을 각각 `Covers:`로 다룬다.
  API Skeleton: 해당 없음.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 첫 화면 `/`, 앱 셸, Button Storybook 대표 상태, loading/empty/error 상태 해당 없음.
  검증: `generateFrontEndSourceIndex`, `npm run validate:full`, `validateHarness` 대상.
  승인자: Tech Lead
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-22
  리뷰자: Tech Lead, QA
  확인: Playwright BDD 테스트가 세 수용 기준을 `Covers`로 연결하고, Storybook은 대표 Button 상태를 통해 FE 표면을 제공한다.
  결과: 미완료

## 열린 질문

- 없음
