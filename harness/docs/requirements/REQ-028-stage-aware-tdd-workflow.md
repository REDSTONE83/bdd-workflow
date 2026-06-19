# 요건 카드

요건 ID: REQ-028
제목: 단계 인식 TDD 요건 워크플로우
우선순위: 높음
상태: 승인
요건 종류: 하네스
명세 역할: 원자 요건
대상 시스템: harness
제품 영역: harness
품질 속성: usability
검증 수준: static
관련 요건: REQ-010, REQ-012
대체 요건: 없음

## 사용자/목적

하네스 작업자와 리뷰어는 요건 카드가 초안, 설계, 테스트, 구현, 검증, 승인 중 어느 단계인지에 따라 필요한 산출물과 게이트 강도를 다르게 확인할 수 있어야 한다.

## 범위

- 요건 카드 상태를 엄격한 TDD 흐름에 맞게 단계화한다.
- 설계 승인 전에는 API/DB/UI 설계를 source index와 생성 산출물에서 검토 가능한 수준으로 준비한다.
- UI가 있는 요건은 Storybook을 UI 설계 검토 표면으로 사용한다.
- 테스트 승인 단계에서는 모든 AC가 실행 테스트 코드와 연결되었는지 확인하되, 구현 전 실패 자체는 허용한다.
- 검증중 또는 승인 상태의 RED는 통합 게이트에서 차단한다.
- 구현중 이전 단계의 RED는 상태 보고에는 남기되 통합 게이트 차단 사유로 보지 않는다.

## 표준 용어

본 요건은 하네스 워크플로우 정책이라 카드에 등록할 표준 용어가 없다.

## 제외 범위

- 기존 모든 애플리케이션 요건 카드를 새 상태로 즉시 일괄 마이그레이션.
- Storybook 시각 회귀 baseline 도입.
- 테스트 충분성의 의미론적 품질을 완전 자동 판정.

## 수용 기준

- (STATIC) 요건 카드 상태는 `초안`, `설계 검토중`, `설계 승인`, `테스트 작성중`, `테스트 승인`, `구현중`, `검증중`, `승인`, `대체됨`을 지원한다
- (STATIC) `설계 승인` 이후 단계의 요건은 필요한 API/DB/UI 설계 표면이 소스 기반 추출 결과에 있어야 한다
- (STATIC) UI 설계 검토 표면이 있는 요건은 선언한 Storybook surface와 named export 상태가 실제 Storybook source index에 있고 해당 요건 metadata와 연결되어야 한다
- (STATIC) `npm run app:validate`는 Storybook build를 실행해 UI 설계 검토 표면이 빌드 가능한지 확인한다
- (STATIC) 테스트 승인 단계는 AC별 실행 테스트 연결을 요구하지만 구현 전 테스트 실패 자체는 통합 게이트 차단 사유로 보지 않는다
- (STATIC) `gate.mjs --check`는 `검증중` 또는 `승인` 카드의 RED를 TRACE 실패로 차단한다
- (STATIC) 승인 카드의 수용 테스트 리뷰 검사는 자유 텍스트가 아니라 최신 `결과:` 라인을 기준으로 `승인` 또는 `미완료` 상태를 판정한다

## 의사결정 로그

- 결정일: 2026-06-08
  결정: 요건 카드 상태 하나로 TDD 워크플로우 단계를 표현한다.
  이유: 별도 검토 단계 필드를 두면 상태와 단계가 불일치할 수 있고 하네스가 어느 쪽을 신뢰해야 하는지 불명확해진다.
  결정자: REDSTONE
  영향: 카드 상태 enum과 하네스 게이트 정책을 단계 인식 방식으로 확장한다.

- 결정일: 2026-06-08
  결정: UI 검토 표면은 설계 단계에서 Storybook으로 실제 확인 가능해야 한다.
  이유: 상태 표나 문서만으로는 Dialog/List/Page 하위 상태 누락을 잡기 어렵다.
  결정자: REDSTONE
  영향: 요건별 UI 설계 검토 표면과 FE 정적 검사를 도입한다.

## 수용 테스트 리뷰

- 시나리오 문서: `harness/docs/scenarios/REQ-028-stage-aware-tdd-workflow.feature`

### 요건 설계 승인 이력

- 승인일: 2026-06-08
  검증 설계: 단계별 상태 enum, 설계 표면, UI 설계 검토 표면, app validate Storybook build, 단계별 RED 차단 정책, 수용 테스트 리뷰 결과 라인 파싱을 STATIC AC로 검증한다.
  API 설계: 해당 없음.
  DB 설계: 해당 없음.
  UI 설계: 해당 없음.
  검사기 설계: `index-requirements.mjs`가 수용 테스트 리뷰와 legacy 설계 섹션 alias를 수집하고, `evaluate-trace-state.mjs`가 source index 기반 API/DB/UI 설계 표면을 생성하며, `validate-front-end-standards.mjs`/`gate.mjs`/`run.mjs`가 단계별 정적 검사를 수행한다.
  추적 정책: 설계 검토중 단계의 테스트 누락 RED는 허용하고, 설계 승인 이후 설계 표면 누락 RED는 차단하며, 테스트 승인/구현중 단계의 테스트 누락 RED는 차단하고, 실행된 테스트 실패 RED는 검증중 전까지 허용한다.
  검증: `npm run harness:tool-test`, `npm run harness:self-test`.
  승인자: REDSTONE
  설계 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-08
  리뷰자: REDSTONE
  확인: 단계 상태 enum, 설계 표면, UI 설계 검토 표면, app validate Storybook build, 테스트 승인 게이트, 검증 단계 RED 차단 정책을 self-test로 확인했다.
  결과: 승인

- 리뷰일: 2026-06-08
  리뷰자: REDSTONE
  확인: 승인 카드의 수용 테스트 리뷰 상태가 자유 텍스트가 아니라 최신 `결과:` 라인으로 계산되는지 parser tool-test와 validator self-test로 확인한다.
  결과: 승인

- 리뷰일: 2026-06-19
  리뷰자: REDSTONE
  확인: 카드 상태 enum을 `설계 검토중`/`설계 승인`으로 전환하고, `수용 테스트 리뷰` 섹션과 source index 기반 `designSurfaces` 생성, `TRACE-DESIGN-*` 게이트 차단, UI 설계 검토 표면 대조를 self-test와 tool-test로 확인한다.
  결과: 승인

### 최종 승인 리뷰

- 승인일: 2026-06-19
  승인자: REDSTONE
  확인: `npm run harness:validate`와 `npm run harness:trace -- --requirement REQ-028` 기준 RED가 없고, 최신 수용 테스트 리뷰 결과가 승인 상태다.
  결과: 승인

## 열린 질문

- 없음
