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

### 보호 앱 셸

인증된 업무 화면이 둘 이상으로 늘어나면 상단 헤더와 1차 내비를 공유하는 보호 앱 셸을 둔다. 이 앱 셸은 프로젝트 공통 레이아웃이지 shadcn/ui primitive가 아니므로 `src/components/`에 두고, `src/components/ui/`로 올리지 않는다.

- 보호 앱 셸은 기존 인증 헤더, 1차 내비, 본문 영역으로 구성한다.
- 1차 내비는 업무 화면 사이 이동만 다룬다. 로그인, 회원 가입 같은 비인증 화면에는 보호 앱 셸을 적용하지 않는다.
- 내비 항목은 React Router의 현재 경로와 연결해 활성 상태를 표시한다. 활성 상태를 색상만으로 구분하지 않고 텍스트/위치/시각 강조가 함께 드러나게 한다.
- 새 보호 route가 추가되면 해당 route의 요건 카드에 앱 셸 표시와 내비 이동 AC를 둔다.
- 보호 route를 추가하면서 로그인 후 복귀 대상이 늘어나면 인증 카드가 소유한 redirect 신뢰 목록도 함께 검토하고, 필요 시 해당 카드 메타데이터와 의사결정 로그를 갱신한다.
- 보호 앱 셸을 추가하거나 항목을 바꾸면 Storybook에 주요 활성 route 상태를 둔다. 예: `CategoriesActive`, `TodosActive`.
- 같은 레이아웃이 두 개 이상의 실제 보호 화면에서 안정적으로 쓰이기 전에는 더 일반적인 layout primitive로 추상화하지 않는다.

참조 구현:

- 앱 셸: `front-end/src/components/ProtectedLayout.tsx`
- 기존 인증 헤더: `front-end/src/components/ProtectedHeader.tsx`
- 활성 route Storybook: `front-end/src/components/ProtectedLayout.stories.tsx`

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
- modal/dialog 안의 form-level 오류도 같은 구조를 따른다. 공간이 좁다는 이유로 `<AlertTitle>`을 생략하지 않는다.
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

참조 구현:

- Alert primitive: `front-end/src/components/ui/alert.tsx`
- Alert primitive Storybook: `front-end/src/components/ui/alert.stories.tsx`
- 회원 가입 form-level 오류: `front-end/src/features/signup/pages/SignupPage.tsx`
- 로그인 form-level 오류: `front-end/src/features/auth/pages/LoginPage.tsx`

### Form Dialog 생명주기

생성/수정처럼 목록 맥락 안에서 하나의 객체를 다루는 폼은 modal 또는 drawer 안의 form dialog로 둘 수 있다. form dialog는 화면 전역 상태와 섞지 않고, 대화상자 인스턴스 안에서 입력·검증·submitting·서버 오류 상태를 소유한다.

- 구조는 `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` + form + `DialogFooter`를 기본으로 한다.
- form 입력 상태는 dialog 본문 안의 하위 컴포넌트가 소유한다. dialog가 열릴 때 초기값으로 새로 시작하도록 본문을 remount하거나 key를 부여한다. 단순히 props 변화를 `useEffect`로 복사해 동기화하지 않는다.
- 생성과 수정이 같은 form을 공유하면 mode별 제목, 설명, submit label만 달리하고 검증·오류 표시·submitting 동작은 동일하게 유지한다.
- 클라이언트 검증은 submit 전에 수행하고, 오류는 해당 입력 아래에 둔다. 이때 서버 요청을 보내지 않는다는 사실은 사용자 시나리오 문장이 아니라 테스트 assertion으로 검증한다.
- submit 중에는 확인 버튼을 실제 `disabled` 상태로 만들고 `aria-busy`를 둔다. 중복 제출은 handler와 disabled 상태 양쪽에서 막는다.
- cancel/close 버튼도 submit 중에는 비활성화할 수 있다. 닫기를 허용하는 경우에는 진행 중 요청의 취소 또는 결과 무시 정책을 코드와 테스트에서 명확히 한다.
- 성공하면 dialog를 닫고 목록/상세 같은 서버 상태를 갱신한다. 성공 toast는 요건에서 요구할 때만 둔다.
- 특정 입력에 귀속되지 않는 서버 오류는 위 "Form-level 서버 오류 Alert" 구조로 dialog 안에 남긴다. 사용자가 수정해야 하는 오류를 toast로만 표시하지 않는다.
- 서버가 field-level 오류를 반환하고 필드가 특정되면 해당 입력 아래 오류로 매핑한다. 원시 오류 코드 문자열은 사용자 문구로 그대로 노출하지 않는다.
- Storybook에는 최소 `Create`, `Edit`, 주요 field error, `Submitting`, 대표 서버 거절 상태를 둔다. 성공 후 닫힘은 route/page mock story의 상호작용으로 검토할 수 있다.

참조 구현:

- Dialog primitive: `front-end/src/components/ui/dialog.tsx`
- Dialog primitive Storybook: `front-end/src/components/ui/dialog.stories.tsx`
- 카테고리 생성/수정 Skeleton: `front-end/src/features/categories/components/CategoryFormDialog.tsx`
- 카테고리 생성/수정 Storybook: `front-end/src/features/categories/components/CategoryFormDialog.stories.tsx`

### Destructive 확인 Dialog

삭제, 영구 취소, 되돌릴 수 없는 상태 변경처럼 파괴적인 동작은 `AlertDialog` 기반 확인 절차를 둔다.

- 제목은 동작 대상과 동작을 함께 말한다. 예: "`업무` 카테고리를 삭제할까요?"
- 설명은 사용자가 확인 전에 알아야 할 결과를 적는다. 영향받는 항목 수를 정확히 알 수 있으면 표시하고, 알 수 없으면 건수를 추정하지 않고 일반 결과만 설명한다.
- footer에는 취소 버튼과 destructive variant 확인 버튼을 둔다. 확인 버튼 텍스트는 동작 동사로 쓴다. 예: "삭제", "취소 확정".
- 확인 요청 중에는 확인 버튼을 `disabled` + `aria-busy`로 표시하고 중복 실행을 막는다. 취소/닫기를 비활성화할지 여부는 요청 취소 가능성과 결과 처리 정책에 맞춘다.
- 성공하면 dialog를 닫고 관련 서버 상태를 갱신한다.
- 실패하면 dialog를 닫지 않고 form-level 서버 오류 Alert를 dialog 안에 표시해 사용자가 재시도하거나 취소할 수 있게 한다.
- Storybook에는 최소 `Default`, `Submitting`을 둔다. 서버 실패를 화면에서 별도 처리하면 `Error` 상태도 둔다.

참조 구현:

- AlertDialog primitive: `front-end/src/components/ui/alert-dialog.tsx`
- AlertDialog primitive Storybook: `front-end/src/components/ui/alert-dialog.stories.tsx`
- 카테고리 삭제 확인 Skeleton: `front-end/src/features/categories/components/CategoryDeleteDialog.tsx`
- 카테고리 삭제 확인 Storybook: `front-end/src/features/categories/components/CategoryDeleteDialog.stories.tsx`

## 목록 가상 스크롤

묶음(page) 단위 서버 목록을 명시적 페이지 컨트롤 없이 스크롤로 더 보여주는 화면은 가상 스크롤로 렌더링한다. 서버 상태 구성은 `front-end-state.md`의 "무한 로드 / 가상 스크롤 목록"을 따른다.

- 보이는 영역(viewport window)에 들어오는 항목만 DOM에 렌더링하고, 화면 밖 항목은 마운트하지 않는다(`@tanstack/react-virtual` 기준).
- 스크롤이 목록 끝에 가까워지면 다음 묶음을 이어 불러온다. 트리거는 목록 끝의 센티넬 요소를 관찰하거나 스크롤 위치 임계값으로 둔다.
- 다음 묶음을 불러오는 동안 목록 하단에 로딩 표시를 둔다. 더 받을 묶음이 없으면 추가 요청을 보내지 않는다.
- 비어 있는 목록은 빈 상태 안내로 표시한다. 스크롤 컨테이너만 빈 채로 두지 않는다.
- 이전/다음·페이지 번호 같은 명시적 페이지 이동 컨트롤은 두지 않는다. 고정 페이지 컨트롤이 요건상 필요한 화면은 카드 `의사결정 로그`에 결정과 이유를 남긴다.

접근성:

- 가상화로 일부 항목만 DOM에 있어도 스크롤 컨테이너는 키보드로 끝까지 탐색 가능해야 하고, 보조 기술이 목록을 목록으로 인식하도록 적절한 role/구조를 둔다.
- 다음 묶음 로딩은 `aria-busy` 또는 상태 텍스트로 보조 기술에 알린다.

테스트:

- FE BDD/E2E는 한 묶음을 넘는 데이터에서 스크롤 후 다음 항목이 보이는지로 검증한다. 가상화로 처음에는 일부만 DOM에 있으므로, 특정 항목 존재를 단정하기 전에 스크롤한다.
- 가상 스크롤 구현 세부(렌더 윈도 크기, 라이브러리 내부 속성)를 테스트에 고정하지 않는다.

참조 구현:

- 카테고리 목록 Skeleton: `front-end/src/features/categories/components/CategoryList.tsx`
- 카테고리 목록 Storybook: `front-end/src/features/categories/components/CategoryList.stories.tsx`
- route page mock 상호작용: `front-end/src/features/categories/pages/CategoriesPage.stories.tsx`

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

### 선택 색상 입력

카테고리, 태그, 라벨처럼 사용자가 업무 데이터의 색상을 고르는 입력은 추천 스와치와 직접 입력을 함께 제공할 수 있다. 이 색상은 디자인 token이 아니라 사용자 데이터 값이므로 feature 상수로 관리한다. 단, UI chrome 색상과 상태 색상은 계속 `src/index.css` token을 따른다.

- 스와치만 제공하지 않는다. 허용 정책이 자유 색상을 포함하면 직접 입력 텍스트 필드를 함께 둔다.
- 직접 입력만 제공하지 않는다. 반복 사용자가 빠르게 고를 수 있도록 추천 스와치를 함께 둔다.
- 스와치는 `button type="button"`으로 만들고, 접근 가능한 이름을 둔다. 예: `aria-label="색상 #3b82f6 선택"`.
- 선택된 스와치는 `aria-pressed`와 focus-visible ring으로 상태를 드러낸다. 색상만으로 선택 상태를 구분하지 않는다.
- 직접 입력 필드는 `Label`과 연결하고, 형식 오류는 해당 입력 아래에 둔다.
- 색상을 비울 수 있는 요건이면 "지우기" 또는 동등한 명확한 버튼을 둔다. 지울 값이 없으면 버튼을 비활성화할 수 있다.
- 직접 입력 placeholder는 허용 형식을 보여준다. 예: `#RRGGBB`.
- feature마다 팔레트와 허용 형식이 다를 수 있으므로 팔레트 값, 정규식, 최대/최소 정책은 해당 feature 타입/상수에서 소유한다.
- Storybook에는 기본, 선택됨, 형식 오류, 비움 가능 상태를 검토할 수 있는 story를 둔다. 도메인 form story에서 상태를 충분히 보여주면 별도 공통 primitive story를 중복하지 않아도 된다.

참조 구현:

- 색상 상수와 검증 한계값: `front-end/src/features/categories/types.ts`
- 카테고리 색상 입력 Skeleton: `front-end/src/features/categories/components/CategoryFormDialog.tsx`
- 카테고리 색상 입력 Storybook: `front-end/src/features/categories/components/CategoryFormDialog.stories.tsx`

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
- form dialog가 열릴 때 입력/오류/submitting 상태를 예측 가능하게 초기화하고, 성공·실패·닫기 정책이 명확한가
- destructive 확인 dialog가 대상, 결과, 취소, 확인, submitting, 실패 재시도 상태를 모두 표현하는가
- 선택 색상 입력이 색상만으로 상태를 전달하지 않고 스와치·직접 입력·지우기·형식 오류를 접근 가능하게 제공하는가
- 보호 앱 셸을 새 route에 적용할 때 내비 활성 상태, route story, 로그인 후 복귀 영향이 함께 검토되었는가
