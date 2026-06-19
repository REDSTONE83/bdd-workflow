# Change Set: 2026-06-18 하네스 UI 검증 강화

상태: 완료
요청일: 2026-06-18
변경 유형: 하네스 개선, 표준 개정, 수정
영향 요건: REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037
논의 상태: 없음

## 요청 요약

- 검증중 상태인 하네스 UI 요건(REQ-029~037)의 구현·AC·시나리오·테스트 적절성을 점검한 결과, 채널 강제 공백 1건과 그로 인해 묻혀 있던 기능/커버 공백을 확인했다.
- 가장 중요한 발견: harness scope의 front-end 표준 검사가 `covers`를 선언한 story의 play 성공 조건(`expect`)을 강제하지 않아, 렌더 전용 스토리가 (UI) 수용 기준을 GREEN으로 통과시키고 있었다(`validate-front-end-standards.mjs:337` + harness 분기 누락).
- 채널 강제를 복원하고, 그로 인해 드러나는 공백(REQ-031 보드 play 전무, REQ-035 실패 경로 미커버 등)을 메우며, REQ-030 자동 갱신/scope 전환을 fixture 흉내가 아니라 실제 라이브 백엔드로 구현한다.

## 작업 범위

- `validate-front-end-standards.mjs`가 harness scope에서도 `FE-STORY-COVER-NO-PLAY`(covers 있으나 play/expect 없음)를 error로 보고하도록 강제를 확장한다.
- REQ-029에 채널 강제를 (STATIC) 수용 기준으로 1급화하고 시나리오·self-test로 회귀를 막는다.
- REQ-031 요건 보드의 5개 (UI) 수용 기준에 play 성공 조건을 작성한다. 하위 관계는 `aria-label="하위 요건 행"`으로 관찰가능하게 만든다.
- REQ-030 자동 갱신/scope 전환을 라이브 백엔드로 구현한다: `/api/artifact-summary`(생성 시각·산출물 없음·오래된 원본) + `/api/events` SSE(build/{scope}·docs 파일 watch) 서버, `useArtifactSummary` 훅(react-query + EventSource), `AppRouter` 컨테이너 배선, `AppShell` 제어형 scope 전환. (STATIC) 수용 기준과 self-test를 추가한다.
- REQ-035 `Failed` 스토리에 covers+play를 추가해 "성공 또는 실패"의 실패 절반을 커버하고, 명령 실행 서버의 요건 인자 형식·미지원 거절을 self-test로 검증한다.
- REQ-032 AC ID 글꼴을 본문(`text-sm`)보다 한 단계 큰 `text-base`로 바로잡고, 시나리오별 커버리지 판정(연결됨)과 연결 테스트 단언을 보강한다.
- REQ-033/034/036/037 play를 AC 주장에 맞게 심화한다: 게이트 4종 필터, Change Set 대화상자 선택→목록 좁힘, 표준 용어 비-key 필드 검색, 요건 picker 8필드 검색·단일 선택·CSS class 단언 제거(aria-selected/aria-label).

## 제외 범위

- 하네스 UI 서버의 명령 실행 backend(child process) 실제 구현. `/api/commands/run`은 계속 허용 목록 검사까지만 한다(REQ-035 범위).
- 라이브 백엔드의 인증·원격 접근. localhost 전용을 유지한다(REQ-030 범위).
- 요건 상세의 시각 전용 세부(AC4 "번호 없는", AC6 "상단 정렬" 등 role/name으로 표현 불가한 항목)의 강제.

## 완료 조건

- harness scope에서 `covers`를 가진 render-only story가 `FE-STORY-COVER-NO-PLAY` error로 보고된다.
- REQ-031 보드 5개 (UI) AC가 play 성공 조건으로 검증된다.
- REQ-030 서버가 산출물 요약을 제공하고 산출물 파일 변경을 SSE 이벤트로 통지한다.
- REQ-035 실패 경로가 covers+play로 검증되고, 서버가 잘못된 요건 인자를 거절한다.
- `cd harness/ui && npm run test:storybook`, `npm run harness:self-test`, `npm run harness:validate`가 통과하고 REQ-029~037 추적 상태가 GREEN이다.

## 검증 명령

- `cd harness/ui && npm run typecheck`
- `cd harness/ui && npm run test:storybook`
- `npm run harness:self-test`
- `npm run harness:validate`

## 결정 로그

- 2026-06-18: `FE-STORY-COVER-NO-PLAY` 강제를 harness scope로 확장한다. 표준 `harness-ui.md`(168/170/306)가 covers story의 play 성공 조건을 요구하는데 검사가 application scope로만 게이팅되어 있어, REQ-029 검증 채널의 "사용자 관찰 수준 검증" 목적이 harness에서 실제로는 비어 있었다. 강제를 켜 REQ-031 보드의 렌더 전용 스토리가 즉시 드러나게 했다.
- 2026-06-18: REQ-030 자동 갱신/scope 전환을 fixture 흉내가 아니라 실제 라이브 백엔드로 구현한다. 표시 전용 원칙(REQ-010 단일 게이트)은 유지하되, 서버는 `build/{scope}` 산출물을 가공 없이 요약하고 파일 watch→SSE로만 통지하며, 화면은 추적/게이트 판정을 재계산하지 않는다.
- 2026-06-18: 자동 갱신 검증은 두 층으로 나눈다. 화면 모델 갱신 시 새로 고침 없는 재렌더는 (UI) story(`AutoRefreshUpdated`)로, 파일 변경→갱신 이벤트 통지는 (STATIC) self-test로 판정한다. EventSource 배선은 런타임 컨테이너(`AppRouter`)에 두어 프레젠테이셔널 `AppShell` story 계약을 유지한다.
- 2026-06-18: 시각 전용 구조(들여쓰기/세로선, 선택 강조)는 CSS class 단언 대신 `aria-label`/`aria-selected` 같은 접근성 의미로 관찰가능하게 만들어 검증한다. 표준이 CSS class를 완료 근거로 쓰지 못하게 하기 때문이다.

## 열린 논의

- 없음
