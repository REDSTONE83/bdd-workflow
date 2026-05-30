# Front-end UI / 스타일 표준

프런트엔드 UI는 shadcn/ui, Tailwind CSS, lucide-react를 기본으로 한다. 화면은 실제 업무를 수행하는 도구로 설계하며, 마케팅용 랜딩 페이지 구성을 기본값으로 두지 않는다.

## 기술 선택

- React + TypeScript
- Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui
- lucide-react

## 디자인 토큰

색상, radius, ring, border, background는 `src/index.css`의 CSS variable과 Tailwind token으로 관리한다.

- 임의 hex 값을 컴포넌트 안에 반복하지 않는다.
- 새 색상은 의미 이름으로 token화한다.
- dominant palette가 한 색상 계열로만 읽히지 않게 한다.
- 버튼, 입력, 카드 radius는 기본 8px 이하를 유지한다. 기존 컴포넌트 token이 다르면 token을 우선한다.

## 컴포넌트 작성

공통 primitive는 `src/components/ui/`에 둔다.

- shadcn/ui 컴포넌트 구조를 유지한다.
- variant는 `class-variance-authority`로 표현한다.
- class merge는 `cn()`을 사용한다.
- 아이콘은 lucide-react를 우선 사용한다.
- 텍스트만 있는 도구 버튼보다 의미가 분명한 아이콘 버튼을 우선한다. 낯선 아이콘에는 tooltip을 둔다.

도메인 컴포넌트는 `src/features/{domain}/components/`에 둔다.

- 업무 의미가 강한 컴포넌트를 공통 컴포넌트로 올리지 않는다.
- 공통화는 두 개 이상의 feature에서 실제 중복이 확인된 뒤 진행한다.

## 화면 레이아웃

- 앱의 첫 화면은 실제 사용 가능한 화면이어야 한다.
- 업무 도구 화면은 조용하고 밀도 있게 구성한다. 과장된 hero, 장식 카드, 불필요한 일러스트를 기본값으로 두지 않는다.
- 정보 비교, 반복 작업, 상태 파악이 쉬워야 한다.
- page section을 card처럼 띄우지 않는다. card는 반복 항목, modal, 명확히 프레임이 필요한 도구에만 쓴다.
- card 안에 card를 중첩하지 않는다.

## 데스크톱 화면 기준

프런트엔드 표준 검증은 데스크톱 화면만 대상으로 한다. 모바일/태블릿 반응형 동작은 기본 표준에서 제외하고, 별도 요건이 승인된 경우에만 그 요건 안에서 다룬다.

```text
desktop: 1440 x 900
```

검토 항목:

- 기준 데스크톱 화면에서 주요 업무 진입점이 첫 화면에 보이는가
- 버튼과 입력이 기준 화면 밖으로 나가지 않는가
- 테이블, 모달, drawer가 기준 화면 안에서 조작 가능한가
- 텍스트와 컨트롤이 겹치거나 잘리지 않는가

## 텍스트와 밀도

- viewport 너비에 직접 비례해 font-size를 키우지 않는다.
- letter spacing은 기본 0으로 둔다.
- 버튼/탭/카드 안의 텍스트는 줄바꿈 또는 축약 정책을 명시한다.
- 긴 단어가 컨테이너를 밀어내지 않게 한다.
- hero scale type은 실제 hero에만 쓰고, dashboard/card/sidebar 내부 heading은 더 작은 체계를 쓴다.

## 상태 표현

사용자가 자연스럽게 기대하는 상태를 빠뜨리지 않는다.

```text
loading
empty
error
disabled
focused
selected
hover
submitting
success
permission denied
not found
```

- form error는 입력과 연결한다.
- destructive action은 취소 가능한 확인 절차를 둔다.
- toast는 일시 알림에 쓰고, 사용자가 수정해야 하는 오류는 화면 안에 남긴다.

### Form-level 서버 오류 Alert

특정 입력에 귀속되지 않는 form-level 서버 오류(중복 자원 거절, 인증 실패, 일시 실패 등)는 다음 구조로 표시한다. 화면 간 시각 위계와 사용자 행동 안내를 일정하게 유지하기 위한 표준이다.

- 컨테이너: `<Alert variant="destructive">` (회복 가능한 일시 오류여도 사용자가 인지하고 행동을 정해야 하므로 destructive variant 를 사용한다).
- 아이콘: `lucide-react` 의 `AlertCircle` 을 기본으로 사용한다. 아이콘은 `aria-hidden="true"` 로 두고 의미는 `AlertTitle` 이 전달한다.
- 제목: `<AlertTitle>` 한 줄로 상태를 요약한다. 표준 용어 사전(`docs/terminology/`)에 등록된 표현과 같은 단어를 쓴다 (예: `account.duplicateEmail` → "이미 등록된 이메일입니다").
- 본문: `<AlertDescription>` 한 줄로 사용자가 다음에 취할 행동을 제시한다. 다른 화면으로 이동해야 해결되는 오류면 본문 안에 `<Link>` 또는 `<Button>` 으로 진입점을 둔다. 링크는 본문 텍스트의 일부로 자연스럽게 녹인다.
- 본문이 텍스트 + inline 링크처럼 여러 노드로 이루어지면 전체를 하나의 `<p>` 로 감싼다. `AlertDescription` 컨테이너는 `grid` 라서 직접 자식으로 들어간 텍스트 노드와 `<Link>` 가 각각 별도 grid item 이 되어 줄바꿈이 강제된다. `<p>` 하나로 감싸면 단일 grid item 안에서 링크가 inline 으로 흐른다.
- `<AlertDescription>` 한 줄만 두는 minimal 사용은 form-level 오류에서 금지한다. 입력별 검증 안내(`fieldErrors`)는 Alert 가 아니라 해당 입력 아래의 `<p>` 로 표시한다.
- 본문이 사용자에게 어느 필드가 잘못됐는지 노출해서는 안 되는 카드(예: 로그인 인증 실패)는 본문 텍스트도 그 정책을 따른다 (해당 카드 AC 우선).

예 (가입 화면 중복 이메일):

```tsx
<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle>이미 등록된 이메일입니다</AlertTitle>
  <AlertDescription>
    이 이메일은 이미 사용 중입니다. 본인 계정이면{" "}
    <Link to="/login" className="underline underline-offset-4">
      로그인 화면으로 이동
    </Link>
    하거나 다른 이메일을 사용해 주세요.
  </AlertDescription>
</Alert>
```

## 폼 입력 UX

화면 간 입력 경험을 일관되게 두기 위해 다음 규칙을 공통으로 적용한다. 비인증 단일 카드 폼(로그인, 회원 가입 등)과 보호 화면의 form은 같은 의미가 적용되는 한 본 절을 그대로 따른다. 본 절은 카드별 AC로 반복하지 않으며, 표준에서 벗어나는 동작이 필요하면 카드 `의사결정 로그`에 결정과 이유를 남기고 해당 카드 AC로 명시한다.

### 자동 포커스 (auto-focus)

- 화면이 폼 하나를 사용자 주 작업으로 두는 경우(예: 로그인, 회원 가입, 비밀번호 재설정처럼 화면 진입 = 폼 입력)에는 화면 로드 시 첫 번째 입력에 자동 포커스를 둔다.
- modal/drawer 안의 폼도 열린 직후 첫 번째 입력에 자동 포커스를 둔다.
- 보호 화면 안의 보조 inline form(목록 위 검색 박스, 인라인 편집 등)은 자동 포커스를 두지 않는다. 화면 진입 시 키보드 사용자가 예측할 수 있는 시작 지점을 유지한다.
- 자동 포커스는 시각/스크린리더 모두에게 동일하게 적용되며, 별도의 `aria-live` 안내는 두지 않는다.

### autocomplete

모든 사용자 입력에는 의미에 맞는 `autocomplete` 속성을 둔다. 비밀번호와 이메일은 의미를 구분한다.

```text
이름                                autocomplete="name"
이메일 (로그인 식별자)              autocomplete="username"
이메일 (식별자가 아닌 연락처 등)    autocomplete="email"
기존 비밀번호 (로그인)              autocomplete="current-password"
새 비밀번호 (회원 가입, 비밀번호 변경) autocomplete="new-password"
일회용 코드                         autocomplete="one-time-code"
```

- 입력 의미와 `autocomplete` 값이 어긋나지 않게 한다. 가입 폼이 `current-password`를 쓰면 브라우저/비밀번호 관리자가 기존 비밀번호를 채우려 시도해 사용자 경험이 깨진다.
- 자동완성을 의도적으로 비활성화해야 하는 경우(예: 일회성 검색 입력)에만 `autocomplete="off"`를 명시한다. 의미 매핑이 있는 입력은 생략하거나 `off`로 비우지 않는다.

### 비밀번호 show/hide 토글

- 모든 비밀번호 입력은 처음에 마스킹된 상태(`type="password"`)로 둔다.
- 입력 우측에 눈 모양 아이콘(`lucide-react`의 `Eye`/`EyeOff`) 토글 버튼을 둔다. 토글 버튼은 비밀번호 입력과 같은 form control 묶음 안에 두고, label과 오류 메시지는 입력에 그대로 연결한다.
- 토글이 보이기 상태이면 입력 type을 `text`로 바꿔 입력값이 그대로 보이고, 가리기 상태로 되돌리면 다시 `password`로 마스킹한다.
- 토글 버튼은 키보드로 접근 가능해야 한다. focus visible 상태를 유지하고, Tab 순서에서 비밀번호 입력 직후에 온다.
- 토글 버튼은 접근 가능한 이름과 현재 상태를 보조 기술에 안내한다. `aria-pressed`로 보이기/가리기 상태를 표현하고, 버튼의 접근 가능한 이름(`aria-label` 또는 텍스트)은 토글 상태에 따라 "비밀번호 보이기"/"비밀번호 가리기"로 갱신한다.
- 토글 상태는 같은 화면 인스턴스 안에서만 유지하고, 화면을 떠나거나 폼을 새로 띄울 때(서버 응답 실패로 비밀번호 입력을 비우는 경우 포함) 다시 가리기 상태로 초기화한다.
- 한 화면에 비밀번호 입력이 두 개 이상이면(예: 비밀번호와 비밀번호 확인) 각 입력의 토글은 서로 독립적으로 동작한다.

## 접근성

- 모든 form control은 label과 연결한다.
- 오류 메시지는 해당 입력과 연결한다.
- focus visible 상태를 없애지 않는다.
- 아이콘-only 버튼은 접근 가능한 이름을 가진다.
- 색상만으로 상태를 구분하지 않는다.
- disabled 상태는 시각적으로만이 아니라 실제 조작 불가 상태여야 한다.
- keyboard navigation으로 주요 업무를 수행할 수 있어야 한다.

## Storybook

공통 컴포넌트는 Storybook story를 둔다. route/page를 추가하거나 변경하면 실제 page 컴포넌트를 `MemoryRouter`와 필요한 mock provider로 감싼 route 기준 page mock story를 둔다. Story는 두 분류로 나눈다.

### Router/provider 데코레이터는 하나만 둔다

route/page mock story는 `MemoryRouter`와 mock provider로 감싸되, **Router 래퍼는 한 스토리의 렌더 트리에 정확히 하나만** 둔다. Storybook 데코레이터는 덮어쓰기가 아니라 합성(중첩)된다. 적용 순서는 바깥에서 안쪽으로 `global → meta(component) → story`이고, 스토리 레벨 데코레이터가 meta 데코레이터 **안쪽**에 들어간다. 따라서 meta 데코레이터에서 이미 `<MemoryRouter>`로 감쌌다면, 특정 스토리에서 진입 경로만 바꾸려고 스토리 레벨에 두 번째 `<MemoryRouter>` 데코레이터를 추가하면 Router가 중첩되어 react-router가 `You cannot render a <Router> inside another <Router>` 오류를 던진다.

스토리마다 다른 라우팅 진입 상태(`initialEntries`)가 필요하면, 두 번째 Router를 추가하지 말고 meta 데코레이터 하나가 `parameters`에서 진입 경로를 읽게 한다.

```tsx
// meta: Router 는 한 번만. 진입 경로는 parameters 로 주입한다.
decorators: [
  (Story, { parameters }) => (
    <MemoryRouter initialEntries={parameters.initialEntries ?? ["/login"]}>
      <AuthContext.Provider value={unauthenticatedAuth}>
        <Story />
      </AuthContext.Provider>
    </MemoryRouter>
  ),
]

// story: 데코레이터를 더하지 말고 parameters 만 바꾼다.
export const SignupCompletedNotice: Story = {
  parameters: { initialEntries: ["/login?signupCompleted=1"] },
}
```

같은 원칙이 단일 인스턴스여야 하는 다른 provider(전역 store, theme provider 등)에도 적용된다. 컨텍스트 "값"만 바꾸려면 provider를 중첩하지 말고 meta 데코레이터가 `parameters`로 값을 받아 한 번만 렌더한다.

### 필수 상태 (없으면 FE-STORY-MISSING-STATE)

해당 컴포넌트의 `*.stories.tsx` 파일이 존재할 때만 검사한다. 컴포넌트가 아직 만들어지지 않은 상태는 위반이 아니다(스캐폴드를 강제하지 않는다).

```text
Button: Default, Disabled, Loading
```

위 상태 이름은 `*.stories.tsx`의 named export(`export const Default: Story = ...`)와 정확히 일치해야 한다. 대소문자, 공백 모두 일치를 요구한다. 변형이 필요하면 표준을 먼저 갱신한다.

### 권장 예시 (검사하지 않음)

컴포넌트가 일반적으로 가질 만한 상태 모음이다. 룰은 두지 않고, 디자인 리뷰에서 확인한다.

```text
Button: Secondary, Outline, WithIcon
Input: Default, Focus, Error, Disabled
Modal: Default, Destructive, Loading
Table: Loading, Empty, Filled, Overflow
Pagination: First, Middle, Last, Disabled
```

`Input/Modal/Table/Pagination`처럼 아직 만들어지지 않은 컴포넌트의 스토리를 미리 강제하지 않는다. 해당 컴포넌트가 실제로 추가되는 시점에 필수 상태를 본 절에 옮겨 정의한다.

Storybook은 화면 설계서 대체 산출물로 본다. 단, Storybook story 자체가 요건 완료 판정은 아니다. 완료 판정은 카드 AC와 BDD 테스트 커버리지로 한다. page mock story는 라우팅 검증을 대신하지 않으며, 실제 route 진입과 사용자 흐름은 Playwright FE BDD 테스트로 확인한다.

## 금지 사항

- CSS selector나 class 이름에 업무 의미를 의존
- 모든 margin/padding/font-size를 테스트로 고정
- Storybook 없는 공통 UI primitive 추가
- Storybook 없는 route/page 추가
- 접근 가능한 이름 없는 icon button
- 한 화면 전체가 단일 색상 계열로만 읽히는 팔레트
- 장식용 gradient orb, bokeh blob 배경
- 비밀번호 입력에 show/hide 토글 없이 마스킹만 두는 형태
- 입력 의미와 어긋나는 `autocomplete` 값(예: 가입 폼 비밀번호에 `current-password`)

## 자동 검증 항목

- `npm run lint`: React hooks, TypeScript, 기본 정적 규칙 확인.
- `npm run build-storybook`: Storybook story가 빌드 가능한지 확인.
- `npm run e2e`: 대표 화면의 데스크톱/접근성 smoke test 확인.
- (예정) visual regression: 핵심 Storybook story와 주요 화면 screenshot baseline 비교.

## 수동 리뷰 항목

- 실제 업무 화면이 첫 화면에서 바로 사용 가능한가
- 공통 컴포넌트 상태가 Storybook에 충분히 표현되어 있는가
- route 기준 page mock story가 실제 page 컴포넌트와 필요한 mock provider로 구성되어 있는가
- 데스크톱 기준 화면에서 텍스트와 컨트롤이 겹치지 않는가
- 디자인 변경이 token/variant로 흡수되는가
- 단일 폼 화면(로그인, 회원 가입 등)에서 첫 번째 입력 자동 포커스, 의미에 맞는 `autocomplete`, 비밀번호 show/hide 토글이 표준대로 들어가 있는가
