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

## 접근성

- 모든 form control은 label과 연결한다.
- 오류 메시지는 해당 입력과 연결한다.
- focus visible 상태를 없애지 않는다.
- 아이콘-only 버튼은 접근 가능한 이름을 가진다.
- 색상만으로 상태를 구분하지 않는다.
- disabled 상태는 시각적으로만이 아니라 실제 조작 불가 상태여야 한다.
- keyboard navigation으로 주요 업무를 수행할 수 있어야 한다.

## Storybook

공통 컴포넌트는 Storybook story를 둔다. Story는 두 분류로 나눈다.

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

Storybook은 화면 설계서 대체 산출물로 본다. 단, Storybook story 자체가 요건 완료 판정은 아니다. 완료 판정은 카드 AC와 BDD 테스트 커버리지로 한다.

## 금지 사항

- CSS selector나 class 이름에 업무 의미를 의존
- 모든 margin/padding/font-size를 테스트로 고정
- Storybook 없는 공통 UI primitive 추가
- 접근 가능한 이름 없는 icon button
- 한 화면 전체가 단일 색상 계열로만 읽히는 팔레트
- 장식용 gradient orb, bokeh blob 배경

## 자동 검증 항목

- `npm run lint`: React hooks, TypeScript, 기본 정적 규칙 확인.
- `npm run build-storybook`: Storybook story가 빌드 가능한지 확인.
- `npm run e2e`: 대표 화면의 데스크톱/접근성 smoke test 확인.
- (예정) visual regression: 핵심 Storybook story와 주요 화면 screenshot baseline 비교.

## 수동 리뷰 항목

- 실제 업무 화면이 첫 화면에서 바로 사용 가능한가
- 공통 컴포넌트 상태가 Storybook에 충분히 표현되어 있는가
- 데스크톱 기준 화면에서 텍스트와 컨트롤이 겹치지 않는가
- 디자인 변경이 token/variant로 흡수되는가
