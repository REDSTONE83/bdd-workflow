# 하네스 UI 표준

이 표준은 `harness/ui` 로컬 웹 UI의 설계와 이후 구현이 따라야 하는 공통 규칙을 정의한다. 하네스 UI는 하네스 산출물을 사람이 빠르게 읽고 검증 명령을 실행하기 위한 로컬 전용 관제 화면이다.

## 기본 원칙

- 하네스 UI는 로컬 퍼스트 도구다. 서버는 loopback 주소에서만 요청을 받고 원격 접근, 인증, 멀티 저장소 워크스페이스를 다루지 않는다.
- 화면과 UI 서버는 RED/GREEN/BLUE, 게이트 카테고리, Change Set 완료 여부를 재계산하지 않는다. `build/{scope}` 산출물과 하네스 도구의 판정 값을 그대로 표시한다.
- UI 서버는 생성 산출물을 직접 쓰지 않는다. 산출물 갱신은 허용된 검증 명령이 기존 하네스 러너를 통해 수행한다.
- 문서 작성·편집·승인 액션은 MVP 범위가 아니다. 원본 파일 작업 진입점은 로컬 에디터 링크까지만 제공한다.
- 화면 요건의 범위, 수용 기준, `.feature` 수용 시나리오, UI 설계 검토 표면은 같은 사용자 관찰 결과를 말해야 한다.

## 표준의 독립성

`harness/ui` 표준의 단일 기준은 이 문서다. 애플리케이션 프런트엔드와 같은 기술 스택을 쓰더라도 app 표준을 상속하거나 참고하지 않는다.

- `app/docs/standards/*`는 `harness/ui` 설계, 구현 리뷰, 테스트 설계, 승인 판단의 입력으로 쓰지 않는다.
- app 구현과 app 테스트는 참고 구현이나 비교 자료로 삼지 않는다.
- `harness/ui`의 구조, 화면 밀도, 데이터 경계, 테스트 채널, UI 설계 검토 표면은 이 문서가 우선한다.
- Storybook 플랫폼 구성은 예외적으로 app과 동일한 버전·addon·DocsPage 구성을 유지한다. 이는 검토 도구의 사용 경험을 맞추기 위한 것으로, app 화면 표준이나 app 컴포넌트 구현을 상속한다는 뜻이 아니다.
- app 표준이 바뀌어도 `harness/ui`에 자동 적용하지 않는다.
- `harness/ui` 표준을 바꿀 때 app 표준을 같이 바꿀 필요는 없다. 두 표준이 의도적으로 달라질 수 있다.
- UI 컴포넌트/위젯의 한국어 문서 어휘만 `harness/docs/standards/ui-vocabulary.md`를 공유한다.

## 기술 기준

MVP의 기술 기준은 다음과 같다.

- React + TypeScript
- React Router
- TanStack Query
- Vite
- Tailwind CSS
- Base UI-compatible shadcn/ui primitive
- Storybook
- Vitest
- Storybook Vitest browser mode
- Tooltip
- UI 서버: Node + TypeScript

이 선택은 `harness/ui`의 현재 구현 기준이다. 하네스 UI가 별도 데스크톱 앱, 다른 CSS 체계, 다른 테스트 러너로 전환되면 이 문서를 먼저 갱신하고 그 뒤 설계와 구현을 바꾼다.

## 코드 구성 기준

`harness/ui` 코드는 하네스 관제 도구의 업무 흐름을 기준으로 나눈다. app feature 구조를 그대로 복사하지 않는다.

- feature 이름은 하네스 작업자가 보는 업무 영역으로 정한다. 예: `requirements`, `terminology`, `gates`, `change-sets`, `runs`.
- 화면 상태를 만들기 위한 fixture와 화면 모델은 `harness/ui` 안에서 소유한다.
- 하네스 산출물 DTO는 `src/lib/harness-data`에 둔다.
- React 컴포넌트가 `build/` JSON 원형을 직접 순회하지 않는다.
- 공통 컴포넌트는 두 개 이상의 하네스 UI 영역에서 실제 반복된 뒤에만 `src/components`로 올린다.
- app 코드나 app 테스트 helper를 import하지 않는다. 필요한 패턴은 하네스 UI 경계 안에 복사하지 말고 하네스 UI용으로 새로 정의한다.

## 프로젝트 구조

표준 위치는 다음과 같다.

```text
harness/ui/
  package.json
  vite.config.ts
  vitest.config.ts
  .storybook/
    main.ts
    preview.ts
  tools/
    source-index.mjs
  server/
    index.ts
  src/
    main.tsx
    App.tsx
    index.css
    app/
      AppRouter.tsx
      providers.tsx
    components/
      ui/
    features/
      shell/
      requirements/
      terminology/
      gates/
      change-sets/
      runs/
    lib/
      harness-data/
    test/
```

역할:

- `server`: 산출물 조회 API, 파일 감시 알림, 허용 명령 실행과 실행 로그 스트림을 제공하는 로컬 UI 서버.
- `src/app`: 라우터, provider, 전역 query/cache, 앱 조립.
- `src/features/shell`: 앱셸, scope 전환, 전역 신선도/산출물 상태.
- `src/features/requirements`: 요건 보드와 요건 상세.
- `src/features/terminology`: 표준 용어 목록, 검색, 상세 조회.
- `src/features/gates`: 게이트 카테고리 요약과 검사 결과 목록.
- `src/features/change-sets`: Change Set 목록과 상세.
- `src/features/runs`: 허용된 검증 명령 실행 화면과 실행 상태.
- `src/lib/harness-data`: UI 서버 API client, 산출물 DTO, 화면 모델 변환, 산출물 변경·실행 로그 구독 인터페이스. React 컴포넌트가 `build/` JSON 형태나 알림 전송 방식에 직접 묶이지 않게 한다.
- `tools/source-index.mjs`: harness/ui page, story, Storybook Vitest 테스트 메타데이터 수집기.

공통 UI primitive는 `src/components/ui`에 둔다. 업무 의미가 있는 조합 컴포넌트는 해당 feature 안에 둔다. Base UI-compatible shadcn/ui primitive를 기본 구현 기준으로 삼되 app의 primitive 구현을 직접 공유하지 않는다.

## UI 서버

UI 서버 코드는 `harness/ui/server`에 둔다. 화면과 같은 패키지에서 TypeScript로 작성하고 Node로 실행한다.

- 역할은 세 가지다: `build/{scope}` 산출물과 원본 문서 메타데이터(경로, 수정 시각) 조회 API, 산출물 파일 감시와 변경 알림, 허용 목록 기반 검증 명령 실행과 실행 로그 스트림 제공.
- 서버는 loopback 주소에만 바인딩한다. 기본 포트 값과 포트 변경 방법은 REQ-030 카드가 소유한다.
- 서버는 생성 산출물과 원본 문서를 쓰지 않는다. 산출물 갱신은 허용된 검증 명령이 실행하는 기존 하네스 러너가 수행한다.
- 변경 알림과 실행 로그 스트림의 전송 방식은 서버 구현 상세다. 화면은 `src/lib/harness-data`의 구독 인터페이스로만 소비하고, 전송 방식 교체(polling, SSE, WebSocket, 데스크톱 이벤트)가 화면 코드에 번지지 않게 한다.
- localhost 바인딩, 허용 목록 밖 명령 거절, 화면 데이터와 산출물 판정 값 일치 같은 서버 계약은 (STATIC) 수용 기준으로 두고 `harness/self-test`가 검증한다.

## 데이터 경계

하네스 UI의 화면 원천은 다음 순서로 고정한다.

1. `build/{app|harness}/state/trace.state.json`
2. `build/{app|harness}/findings/*.findings.json`
3. `build/{app|harness}/reports/*.json` (`gate-report.json` 포함)
4. `build/{app|harness}/indexes/*.json`
5. 원본 문서의 파일 경로와 수정 시각

UI 서버는 이 데이터를 읽어 화면에 맞는 DTO로 얇게 정리할 수 있지만, 판정 값을 새로 계산하지 않는다.

- 요건 상태, AC 판정, RED 사유, BLUE 차단 사유는 `trace.state.json` 값을 그대로 쓴다.
- 게이트 카테고리 차단 여부는 통합 하네스 게이트 도구가 제공한 결과 또는 그 결과에서 생성된 산출물을 쓴다.
- 게이트 화면은 `gate-report.json` 또는 동등한 machine-readable DTO를 표시하고, 카테고리 분류와 차단 여부를 화면에서 다시 계산하지 않는다.
- Change Set 화면은 Change Set 인덱스와 리포트를 표시하고 완료 여부를 자체 판정하지 않는다.
- 표준 용어 화면은 선택한 scope의 `terminology.index.json`을 UI 서버의 `/api/terminology?scope={harness|application}` DTO로 표시하고, term key, status, sourceFile, meaning, allow, ban, names 값을 화면 DTO에서 보존한다. 화면은 용어 사전 원본 파일(`domains/*.json`, `draft.json`)을 직접 읽지 않는다.
- 요건 상세 화면은 trace state의 `coverage`, scenario index의 scenario 항목, trace state의 `apis`, `entities`, `frontEnd`, `designSurfaces` 항목과 source index 항목을 사용해 AC 목록, AC별 테스트, 수용 시나리오 목록, 수용 시나리오별 테스트, 연결된 API 설계, Request, Response, DB 설계, page, route, story를 표시한다. 화면은 이 연결을 새로 추론하지 않고 산출물 항목을 화면 DTO로만 정리한다.
- 연결된 UI story가 있으면 요건 상세의 UI 설계 검토 링크는 Storybook 링크를 우선 제공한다. 구현 파일 위치는 별도 보조 링크로 제공한다.
- 산출물이 없으면 빈 화면 대신 해당 scope의 생성 명령을 안내한다.
- 화면에는 표시 중인 산출물의 `generatedAt`을 노출한다.
- 원본 문서 수정 시각이 산출물 `generatedAt`보다 늦으면 오래된 데이터 경고를 표시한다.
- 파일 변경 반영은 UI 서버의 파일 감시와 query cache 무효화로 처리한다. 화면은 `src/lib/harness-data`의 구독 인터페이스로 변경 알림을 받고, 컴포넌트별 임의 polling을 흩뿌리지 않는다.
- 화면은 UI 서버 응답을 기다리는 동안 로딩 상태를 표시한다. 서버 호출 실패나 산출물 해석 실패는 빈 화면이 아니라 조회 실패 상태로 표시하고 다시 시도할 수 있는 진입점을 둔다.

## `harness/ui` source index

REQ-029 이후 하네스 scope도 UI 검증 채널을 가진다.

- `harness/ui/tools/source-index.mjs`는 page, route, story, Storybook Vitest 테스트 메타데이터를 수집한다.
- 출력은 `build/harness/indexes/front-end.source-index.json`이다.
- 테스트 결과 canonical 파일은 `harness/ui/test-results/storybook-junit.xml`이다.
- `npm run harness:validate`는 harness/ui Storybook Vitest 테스트와 source index, Storybook build를 포함한다.

Storybook Vitest 메타데이터는 story `parameters.harness`에 둔다. `requirements`는 `REQ-XXX` 형식이고, `covers`는 요건 카드의 수용 기준 문장과 정확히 일치해야 한다.

```ts
export const StateSummary: Story = {
  tags: ["test"],
  parameters: {
    harness: {
      requirements: ["REQ-031"],
      covers: ["보드 상단에 추적 상태별 요건 수 요약이 표시된다"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("RED")).toBeVisible();
  },
};
```

`covers`가 있는 story는 반드시 성공 조건이 보여야 한다.

- `play` 함수 또는 `play`가 연결하는 `assert...` 함수에 `expect(...)` 검증을 둔다.
- `assert...` 함수는 story 파일 안에서 읽히게 두고, 공통 helper는 popup 탐색/닫힘 대기/반복 입력 같은 저수준 동작에만 둔다.
- 성공 조건은 작업자가 화면에서 확인하는 결과다. 내부 React state, fixture 객체, CSS class, 구현 함수명은 완료 근거로 쓰지 않는다.
- 대화상자, 메뉴, 펼침 영역처럼 portal 또는 조건부 렌더링을 쓰는 표면은 현재 열린 role/name 범위 안에서 검증한다.
- 클릭 가능한 흐름은 `userEvent`로 조작하고, DOM API를 직접 호출해 제출이나 열기 동작을 우회하지 않는다.
- 성공 흐름은 닫힘, 목록 반영, 필터 결과 변경, 상세 route 이동처럼 화면에 남는 결과를 기다린다.
- 실패/거절 흐름은 같은 카드나 대화상자 안에 재시도 가능한 안내가 남는지 확인한다.

Vitest 단위 테스트는 TDD 보조 테스트다. `Covers` 메타데이터를 붙이지 않고 AC 커버리지에 포함하지 않는다.

## 설계 규칙

설계 단계에서 각 UI 요건은 소스와 산출물에 요건 ID를 연결하고, 카드에는 사람이 승인해야 하는 의도와 수용 기준만 둔다.

- `UI 설계`: 화면 표면, 주요 영역, 표시 필드, 상태 목록, 사용자 행위. source index의 page/route/story metadata에서 추출한다.
- `UI 설계 검토 표면`: Storybook title과 named export 상태 목록. 카드 본문에 복사하지 않고 story metadata와 source index에서 확인한다.

화면에 표시해야 하는 필드가 `범위`에 있으면, 그 필드는 수용 기준 또는 제외 범위에도 드러나야 한다. 예를 들어 요건 목록 항목에 우선순위를 표시한다면 AC와 시나리오에도 우선순위가 포함되어야 한다.

시나리오의 `Then`이 특정 상태를 단언하면 `Given`은 그 상태를 만드는 조건을 명시해야 한다. 오래된 데이터 경고, 산출물 없음, 실행 중 잠금, 서버 거절 같은 조건은 별도 Given으로 준비한다.

## UI 설계 검토 표면

Storybook은 UI 설계 검토 표면이다. 구현 완료 전에도 사람이 주요 상태를 검토할 수 있어야 한다.

- Storybook 구성은 app과 동일하게 Storybook `10.4.1`, `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`를 기본으로 한다.
- Storybook 실행은 loopback 주소에만 바인딩하고, Storybook HOME은 `harness/ui` 내부 cache 경로를 사용해 사용자 홈 디렉터리에 설정 파일을 쓰지 않는다.
- Storybook DocsPage 구성은 app과 동일하게 제목, component 설명, 대표 canvas, controls, named export별 상태 설명을 보여준다.
- a11y addon은 모든 story에서 켜되, 설계 단계에서는 `todo` 수준의 보조 검토 신호로 둔다. 접근성 실패를 게이트 차단으로 승격하려면 별도 요건과 테스트 기준을 추가한다.
- 각 meta는 `tags: ["autodocs", "test"]`를 둔다.
- Storybook title은 feature와 화면 책임이 드러나게 쓴다. 예: `Harness/Requirements/RequirementBoard`.
- named export 이름은 안정적인 영어 PascalCase를 쓴다. 예: `Default`, `EmptyArtifacts`, `StaleArtifacts`, `Filtered`, `Running`.
- 각 story는 `parameters.harness.requirements`로 관련 요건을 연결한다.
- 경로 화면 story는 실제 route 진입 화면을 mock provider와 fixture로 감싼다.
- 대화상자처럼 portal을 여는 story는 Docs view에서 문서 본문을 가리지 않도록 닫힌 호출 화면 프레임으로 렌더링하고, 열린 상태 검토는 Canvas view에서 유지한다.
- Docs 설명은 화면 목적, 주요 표시 요소, 사용자 흐름, 관찰 포인트를 한국어 업무 문장으로 적는다. component 설명뿐 아니라 named export별 `docs.description.story`도 작성한다.
- 하네스가 소유한 Base UI-compatible shadcn/ui primitive는 `Harness/UI/Primitives` story에서 함께 검토한다. 이 story는 app primitive와의 호환성을 증명하는 용도가 아니라 하네스 UI 자체 토큰과 밀도를 검토하는 표면이다.

최소 상태:

- 공통: 모든 경로 화면 story 묶음은 로딩(loading)과 조회 실패(error) 상태를 포함한다.
- 앱셸: 기본 산출물 있음, 산출물 없음, 오래된 데이터, scope 전환.
- 요건 보드: 목록형 카드, 상위/하위 요건 구조, 하위 요건 들여쓰기, 제목 검색 필터 적용, 상태 필터 적용, 빈 결과, RED/GREEN/BLUE/INACTIVE 요약, 요건 ID 선택 후 상세 route 이동.
- 요건 상세: 정상 상세, AC/수용 시나리오 확인 가능, RED 사유 있음, BLUE 차단 있음, 연결 산출물 있음, API/DB/UI 설계 있음, Storybook 검토 링크 있음.
- 게이트: 통과, 카테고리 차단, finding 펼침, 필터 적용.
- 표준 용어: 전체 목록, 검색 결과, 도메인 필터, 승인 상태 필터, 선택 상세, 빈 결과.
- Change Set: 목록형 카드, 카드 내부 펼침 상세, 영향 요건 필터 적용, 영향 요건 이동.
- 요건 검색/선택 대화상자: 기본 열림, 목록형 후보 카드, 상위/하위 요건 구조, 하위 후보 들여쓰기, 검색 결과, 상위 검색 하위 포함, 선택 요건 있음, 긴 후보 목록 스크롤, 빈 결과.
- 실행 화면: 실행 가능, 실행 대상 요건 미선택, 실행 대상 요건 선택됨, 실행 중, 성공, 실패, 허용 목록 밖 요청 거절.

## 화면 설계

하네스 UI는 운영 도구다. 화면은 조용하고 밀도 있게 구성한다.

- 첫 화면은 실제 관제 화면이어야 하며 랜딩 페이지를 만들지 않는다.
- 상단 머리 영역에는 제품명, 현재 scope, scope 전환, 산출물 생성 시각, 자동 갱신 상태를 둔다.
- 1차 내비는 상단 가로 메뉴가 아니라 좌측 LNB로 둔다. LNB 항목은 요건, 표준 용어, 게이트, Change Set, 실행 화면 순서로 고정하고, 본문은 LNB 오른쪽에 표시한다.
- 필터와 상태 요약은 목록 위에 두고, 상세 정보는 선택 후 상세 화면에서 다룬다.
- 목록 화면의 필터 상태는 URL query로 보존한다. 목록에서 상세 route로 이동할 때 현재 query를 유지하고, 상세 화면의 목록 복귀 버튼은 메타데이터 카드 바깥 상단 좌측에 테두리 없는 내비게이션 스타일로 배치하며 같은 query를 유지한 목록 route로 이동한다.
- 요건 보드와 요건 검색/선택 대화상자는 각 요건을 목록형 카드로 표시한다. 요건 ID와 제목은 한 줄에 두고 긴 제목은 말줄임 처리하며, 추적 상태 뱃지는 카드 우측 끝에 배치한다. 요건 보드의 카드 상태, 제품 영역, 우선순위는 제목 바로 오른쪽에 접두 문자 없는 종류별 색상의 작은 뱃지로 같은 줄에 표시하고 별도 보조 줄을 만들지 않는다. `명세 역할`과 상위/하위 요건 구조는 같은 줄의 보조 뱃지로 축약 표시한다. 하위 요건의 상위 관계는 카드의 `관련 요건`에 있는 상위 REQ를 UI 서버 DTO의 `parentRequirementIds`로 정리하고, 상위 요건의 하위 관계는 역방향 관계를 `childRequirementIds`로 정리해 화면에 전달한다. 화면에는 상위 요건 ID와 하위 요건 수만 표시하고 전체 관련 요건 목록은 상세 화면에서 다룬다. 하위 요건 카드는 좌측 들여쓰기와 세로선으로 부모 아래 항목임을 드러낸다. 화면 컴포넌트는 카드 원문이나 `build/` JSON에서 계층을 다시 추론하지 않는다.
- 요건 상세는 메타데이터 카드 바깥 상단 좌측에 테두리 없는 목록 복귀 내비게이션을 두고, 요약 머리 영역 아래에서 개요, AC, 수용 시나리오, UI 설계, API 설계, DB 설계, 산출물/소스 탭으로 주요 정보군을 구분한다. 개요 탭은 요약 지표와 함께 요건 카드의 사용자/목적, 범위, 표준 용어 key와 한국어/영어 이름, 제외 범위, 의사결정 로그를 보여주고 대표 AC나 대표 API 카드를 두지 않는다. AC 탭은 AC 카드 목록 안에서 AC ID를 기본 본문보다 한 단계 큰 고정폭 글꼴로 표시하고 검증 채널은 ID 옆 유형별 색상 뱃지로 표시한다. AC 카드의 판정 상태는 우측에 두고, 연결 테스트와 연결 수용 시나리오는 바로가기 링크로 제공하며 연결 테스트 라벨과 목록 컨텐츠는 상단 정렬한다. 수용 시나리오 탭은 번호 없는 Given/When/Then 시나리오 목록 안에서 Covers 기준 커버리지 판정과 연결 테스트를 함께 보여준다. UI 설계 탭은 UI 표면을 세로 목록형 카드로 보여주고 각 카드에는 description, Storybook 검토 링크, 구현 위치를 제공한다. API 설계 탭은 연결된 API 작업을 세로 목록형 카드로 표시하며 펼칠 수 있는 Request/Response를 보여준다. Request/Response 필드가 다른 객체 타입을 참조하면 해당 필드는 참조 객체 펼침 영역으로 하위 필드를 확인할 수 있어야 한다. DB 설계 탭은 trace state `entities[]`에서 온 DB table을 세로 목록형 카드의 주 정보로 보여주고 JPA Entity className, listener, 구현 위치는 보조 정보로 제공한다. 컬럼 목록은 columnName, PK 여부, nullable, unique, updatable, length를 먼저 표시하고 fieldName, javaType, annotation, 연결 요건은 보조 정보로 표시한다. RED/BLUE 판정 사유는 별도 테스트 탭에 두지 않고 AC 탭의 판정 사유 영역에서 보여준다. 산출물/소스 탭에서 연결 산출물은 요건 카드와 수용 시나리오만 목록형 카드로 보여주고, 소스코드 위치는 연결 산출물 파일을 제외한 구현 표면만 목록형 카드로 보여준다. `Page`, `Route`, `Story` 소스 종류는 각각 `UI Page`, `UI Route`, `UI Story` 뱃지로 구분한다. 작업자는 상세 화면에서 설계가 어떤 수용 기준, 수용 시나리오, UI 설계, API 설계, DB 설계, 테스트, 구현 표면에 걸려 있는지 한 번에 확인할 수 있어야 한다.
- Change Set 화면은 제목, 상태, 영향 요건 필터를 목록 위에 두고 각 Change Set을 목록형 카드로 표시한다. 영향 요건 필터는 Select가 아니라 REQ-037 요건 검색/선택 대화상자의 선택 결과를 사용하고, 필터 막대에는 선택된 요건 ID만 한 줄로 표시하며 돋보기 아이콘으로 검색/선택 대화상자를 연다. 상세는 대화상자가 아니라 카드 내부 펼침으로 제공한다. 카드 요약에는 제목, 상태, 요청일, 영향 요건 수, 열린 논의 수를 보여주고, 상태 뱃지는 카드 우측 상단에 둔다. 개별 영향 요건과 영향 요건 추적 상태는 카드 요약에 표시하지 않고 펼침 상세의 영향 요건 목록에서만 보여준다. 펼침 상세에는 요청 요약, 작업 범위, 완료 조건, 검증 명령, 열린 논의, 영향 요건 상세 이동을 둔다.
- 요건 검색/선택 대화상자는 호출 화면이 전달한 후보 요건 목록을 목록형 카드로 보여주며 요건 ID와 제목은 한 줄에, 추적 상태 뱃지는 카드 우측 끝에, 명세 역할·상위 요건 ID·하위 요건 수는 같은 줄의 보조 뱃지로 밀도 있게 표시한다. 긴 제목은 한 줄 안에서 말줄임 처리한다. 카드 상태, 제품 영역, 우선순위는 검색 대상에는 포함하지만 후보 카드에는 표시하지 않는다. 대화상자 상단에는 현재 선택 요약 영역을 두지 않고, 후보 목록 안의 선택 표시와 검색 입력 안의 작은 선택 해제 버튼으로 단일 선택, 선택 해제, 빈 결과 상태를 제공한다. 대화상자 높이는 검색 결과 수와 무관하게 viewport 기준 고정값을 유지하고, 제목·설명·검색 입력·닫기 버튼은 유지한 채 후보 목록 영역만 빈 상태 또는 상하 스크롤 상태로 바뀐다. 상위 요건이 검색어와 직접 일치하면 직계 하위 후보 요건도 함께 표시하고 `상위 검색 포함`으로 구분한다. 하위 요건이 직접 검색된 경우에는 상위 요건을 자동 포함하지 않고, 일반 관련 요건과 재귀 하위 요건도 자동 확장하지 않는다. 대화상자는 선택값의 업무 의미를 해석하지 않고, 선택값 적용은 호출 화면 요건이 소유한다.
- 카드 안에 카드를 중첩하지 않는다. 카드 사용은 반복 항목이나 명확히 프레임이 필요한 도구로 제한한다.
- 데스크톱 기준 화면은 1440 x 900이다. 모바일/태블릿은 별도 요건이 생기기 전까지 검증 범위가 아니다.
- 긴 파일 경로, 긴 요건 제목, 긴 finding 메시지는 줄바꿈 또는 축약 정책을 둔다.
- 상태 색상만으로 의미를 전달하지 않는다. RED/GREEN/BLUE/INACTIVE와 게이트 카테고리는 텍스트 라벨을 함께 표시한다.

## 목록형 카드와 빈 상태

목록형 카드는 하네스 UI의 기본 반복 항목 표현이다. 표, 중첩 카드, 대형 preview 카드로 대체하지 않는다.

- `compact` 목록형 카드는 요건 보드와 요건 검색/선택 대화상자의 기본이다. 한 줄 안에 ID, 제목, 보조 뱃지, 우측 상태 뱃지를 배치하고 `px-3`, `py-1.5` 또는 `py-2` 수준의 밀도를 유지한다. 제목은 한 줄 말줄임 처리한다.
- `standard` 목록형 카드는 요건 상세 탭, Change Set, API 설계, DB 설계, UI 설계처럼 설명과 보조 링크가 필요한 항목에 쓴다. 기본 패딩은 `p-4`이고, 첫 줄에는 종류 뱃지와 제목, 우측 상태 뱃지를 둔다.
- `disclosure` 목록형 카드는 Change Set 상세, Request/Response, DB 설계 컬럼처럼 하위 내용을 펼칠 때 쓴다. 상세는 카드 내부 `Collapsible`로 열고, 별도 대화상자로 상세를 띄우지 않는다.
- 빈 결과는 단순 텍스트만 두지 않고 같은 목록 영역 안의 dashed border 메시지로 표시한다. 빈 상태도 목록 높이와 주변 레이아웃을 불필요하게 흔들지 않아야 한다.
- 목록형 카드 안에 다른 `Card`를 중첩하지 않는다. 하위 정보는 `Collapsible`, 구분선, definition list, 링크 목록으로 표현한다.

## 뱃지 크기와 색상

뱃지는 판정·종류·메타데이터를 좁은 공간에서 식별하기 위한 보조 표식이다. 색상만으로 의미를 전달하지 않고 항상 텍스트 라벨을 함께 둔다.

- 기본 뱃지는 일반 카드와 상세 영역에 쓴다.
- 작은 뱃지는 목록형 카드의 같은 줄 메타데이터에 쓴다. 작은 뱃지는 `min-width`를 강제하지 않고 `px-1.5`, `py-0`, `text-[10px]`, `leading-4` 수준의 밀도를 유지한다.
- `RED`와 실패·차단은 destructive/red 계열, `GREEN`과 통과는 success/green 계열, `BLUE`와 정보성 완료는 info/sky 계열, 경고·대기·Request는 warning/amber 계열, `INACTIVE`와 비활성은 slate 계열을 쓴다.
- 요건 보드의 카드 상태, 제품 영역, 우선순위는 접두 문자 없이 작은 뱃지로 표시한다. 같은 화면 안에서 카드 상태, 제품 영역, 우선순위의 tone은 서로 구분되어야 한다.
- API method, source kind, AC channel, DB 설계/Request/Response kind는 종류 뱃지로 표시한다. `Page`, `Route`, `Story`는 각각 `UI Page`, `UI Route`, `UI Story` 라벨을 쓴다.

## 검색/선택 대화상자

검색/선택 대화상자는 많은 후보 중 하나를 찾는 공통 패턴이다.

- 대화상자 외곽 높이는 검색 결과 수와 무관하게 viewport 기준 고정 높이를 유지한다.
- 제목, 설명, 검색 입력, 닫기 버튼은 고정 영역에 두고 후보 목록 영역만 스크롤한다.
- 현재 선택 요약 영역은 두지 않는다. 선택 표시는 후보 카드 안에서 하고, 선택 해제는 검색 입력 오른쪽의 작은 아이콘 버튼으로 제공한다.
- 후보 목록은 compact 목록형 카드로 표시하고, 긴 제목은 한 줄 말줄임 처리한다.
- 검색 결과가 없어도 대화상자 높이는 유지하고 후보 목록 영역 안에 빈 상태를 표시한다.
- 대화상자가 Storybook Docs view 본문을 가리지 않도록 Docs story는 닫힌 호출 화면으로 렌더링하고, 열린 상태 검토는 Canvas story에서 유지한다.

## 컴포넌트와 스타일

하네스 UI의 스타일 기준은 app 화면과 독립이다.

- 기본 조작 요소와 정보 프레임은 `harness/ui`가 소유한 shadcn/ui primitive를 우선 사용한다. 예: `Button`, `Card`, `MetricCard`, `Badge`, `Table`, `Tabs`, `Alert`, `Input`, `Select`, `Collapsible`, `Dialog`, `Tooltip`.
- shadcn/ui primitive 파일은 `src/components/ui`에 두고, 업무 의미를 붙인 조합 컴포넌트는 feature 경계 안에 둔다.
- shadcn/ui를 추가하거나 수정할 때 app primitive와 app 테마 토큰을 참고 기준으로 삼지 않는다. Storybook 플랫폼 설정만 app과 동일하게 유지한다.
- 컴포넌트 스타일 셋은 Base UI-compatible `base-new-york`을 권장한다. 단, 색상과 밀도는 하네스 관제 화면 기준으로 유지하며 app의 `neutral` 토큰을 복사하지 않는다.
- `components.json`의 `baseColor`는 `slate`를 유지한다. 하네스는 문서/판정/소스 위치를 오래 보는 화면이므로 neutral보다 경계와 보조 텍스트 대비가 분명한 slate 계열이 적합하다.
- 상호작용 primitive는 Base UI를 내부 기반으로 사용한다. 예: `Button`, `Input`, `Select`, `Tabs`, `Collapsible`, `Dialog`, `Tooltip`, 향후 `Menu`. app primitive 파일을 import하지 않고, 하네스 wrapper가 공개 API와 스타일을 소유한다.
- `Button`의 `asChild` 같은 wrapper API는 하네스 화면 코드 안정성을 위해 유지할 수 있으나, 구현은 Radix Slot이 아니라 Base UI `render` 합성으로 제공한다.
- `Select`는 native `<option>` children API를 쓰지 않고 `options`, `value/defaultValue`, `onValueChange` API를 사용한다. 화면은 이벤트 객체가 아니라 선택 값 문자열에만 의존한다.
- `Tabs`는 Base UI Tabs를 사용하며 `defaultValue/value`, `TabsList`, `TabsTrigger`, `TabsContent` 조합으로 작성한다.
- 펼침/접힘 UI는 native `<details>`를 직접 쓰지 않고 `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`를 사용한다.
- 구조 primitive인 `Card`, `Badge`, `Alert`, `Table`은 Base UI에 1:1 대응 컴포넌트가 없으므로 `useRender` 기반 Base UI-compatible wrapper로 둔다. 이 wrapper는 `data-slot`, `render` 합성, 하네스 토큰을 소유한다.
- 반복되는 요약 수치 카드는 `MetricCard`를 사용한다. 업무별 제목/설명 반복 패턴은 해당 feature 안의 전용 컴포넌트로 올린다.
- 기본 컨트롤 높이는 `h-9`, 소형 컨트롤은 `h-8`, 큰 컨트롤은 `h-10`을 권장한다. 카드 radius는 8px 이하를 유지하고 그림자는 `shadow-sm` 이하로 제한한다.
- 장식적 hero, 마케팅형 카드 레이아웃, 대형 브랜딩 영역을 두지 않는다.
- 상태 요약, 필터, 목록, 상세, 로그처럼 반복 작업에 필요한 정보 밀도를 우선한다.
- 페이지 구역 전체를 카드처럼 띄우지 않는다.
- 반복 항목, 검사 결과, 실행 로그처럼 경계가 필요한 단위에만 카드를 쓴다.
- card 안에 card를 중첩하지 않는다.
- 색상은 상태 구분을 돕는 보조 수단이다. 상태명과 카테고리명 텍스트를 함께 둔다.
- 긴 텍스트는 컨테이너를 밀어내지 않도록 줄바꿈, 축약, 복사 가능한 전체값 표시 중 하나를 정한다.
- 아이콘만 있는 버튼에는 접근 가능한 이름과 `Tooltip` 도구 설명을 둔다.
- 키보드 포커스가 보이지 않는 조작 요소를 만들지 않는다.

## 테스트 기준

하네스 UI 테스트 기준도 이 문서가 소유한다.

- Vitest는 화면 모델, 필터링, 정렬, DTO 변환, 입력 검증 같은 TDD 보조 테스트에 쓴다.
- Vitest 단위 테스트에는 `Covers` 메타데이터를 붙이지 않는다.
- Storybook Vitest story 테스트만 `(UI)` 수용 기준 커버리지에 들어간다.
- Storybook story의 `harness.requirements`와 `harness.covers`는 카드 수용 기준 문장과 정확히 맞춘다.
- Storybook story 테스트는 사용자 관찰 결과를 검증한다. 내부 React state, CSS class, 구현 함수명에 묶지 않는다.
- 상호작용이 필요한 `(UI)` 수용 기준은 story `play` 함수에서 접근 가능한 role/name 기반 쿼리와 사용자 행위를 검증한다.
- 방어 계약 테스트가 정상 UI 경로가 아닌 요청을 다루면 Given에 직접 서버 요청 같은 발생 경로를 명시한다.
- (STATIC) 수용 기준이 요구하는 서버 계약(localhost 바인딩, 허용 목록 거절, 산출물 판정 값 일치)은 `harness/self-test`가 검증한다.
- Storybook Vitest browser mode는 Chromium headless로 실행한다.
- 시각 스냅샷 기준선은 도입하지 않는다. 필요해지면 별도 요건으로 다룬다.
- canonical Storybook Vitest JUnit 결과 파일만 하네스 범위 추적에 사용한다. 부분 실행 결과는 추적 판정에 쓰지 않는다.

## 로컬 에디터 링크

원본 문서, 연결 산출물, 연결 소스코드의 파일 위치는 로컬 에디터 링크로 제공한다.

- 기본 형식은 `vscode://file/<절대 경로>:<라인>`이다.
- 요건 상세의 모든 탭은 로컬 파일 위치에 별도 `열기` 버튼을 두지 않고, 파일 경로/라인 위치 텍스트 자체를 링크 스타일 바로가기로 표시한다.
- Storybook URL처럼 브라우저에서 여는 검토 링크는 버튼 또는 강조 링크를 쓸 수 있다. 같은 카드 안에서 로컬 파일 위치 링크와 브라우저 검토 링크의 시각적 역할을 구분한다.
- UI 서버가 에디터 프로세스를 직접 실행하지 않는다.
- 파일이 없거나 line을 알 수 없으면 링크 대신 위치 텍스트와 확인 불가 상태를 표시한다.

## 검증 명령 실행

명령 실행은 허용 목록 방식만 사용한다.

허용 명령:

- `harness:trace`
- `harness:validate`
- `harness:self-test`
- `app:trace`
- `app:validate`
- `repo:validate`

규칙:

- 허용 명령은 id와 메타데이터(표시 이름, 대응 npm script, 허용 인자 형식, 단일 요건 지정 지원 여부)를 가진 레지스트리로 UI 서버에 정의한다. 화면과 서버가 명령 문자열을 각자 조립하지 않고, 실행 백엔드 교체는 레지스트리 변경으로 끝나야 한다.
- 루트 `package.json`에 script가 추가되어도 자동 허용하지 않는다.
- 실행 버튼은 명령 목록 하단의 독립 영역이 아니라 선택된 명령 카드 내부에 둔다.
- 단일 요건 지정 인자는 선택적 인자이며, 지정할 때는 `--requirement REQ-XXX` 형식만 허용한다. 화면은 요건 ID 자유 입력 대신 선택된 명령 카드 안의 REQ-037 요건 검색/선택 진입점으로 요건을 고르게 한다. 초기값은 미선택이고, 선택된 상태에서도 해제할 수 있어야 한다. 미선택 상태로 실행하면 `--requirement` 인자를 붙이지 않는다.
- 임의 셸 명령, 임의 인자, e2e 장시간 명령은 MVP에서 실행하지 않는다.
- 한 번에 하나의 명령만 실행한다.
- 실행 중에는 새 명령 시작을 막고 실행 중임을 표시한다.
- 로그는 실시간으로 표시하고 종료 후 성공 또는 실패를 표시한다.
- 실행 이력은 서버 세션 내 표시까지만 유지한다.

## 검증 명령

설계 이후 harness/ui 내부 명령은 다음 이름을 표준으로 둔다.

```bash
cd harness/ui
npm run typecheck
npm run lint
npm run test
npm run test:storybook
npm run build
npm run serve
npm run build-storybook
npm run source-index
npm run validate
```

루트 명령은 다음을 추가한다.

```bash
npm run harness:ui
npm run harness:ui:serve
npm run harness:front-end-source-index
```

`npm run harness:ui`는 Vite HMR 개발 서버를 띄운다. `npm run harness:ui:serve`는 `harness/ui`의 production build를 만든 뒤 Express 서버로 빌드된 SPA와 `/api/*`를 함께 제공한다.

`npm run harness:validate`는 REQ-029 구현 이후 harness/ui source index, Storybook build, Storybook Vitest 테스트 결과를 하네스 범위 추적에 포함한다.
