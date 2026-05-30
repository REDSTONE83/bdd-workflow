# 요건 카드

요건 ID: REQ-014
제목: 할 일 카테고리 관리 화면
우선순위: 중간
상태: 승인
구현 대상: front-end

## 사용자/목적

로그인 사용자는 브라우저에서 자신의 할 일 분류용 카테고리를 보고, 만들고, 수정하고, 삭제할 수 있어야 한다.

## 범위

- 보호 영역에 `/categories` 경로의 카테고리 관리 화면을 추가하고, 비인증 사용자가 접근하면 로그인 화면으로 보낸다. 카테고리 화면 경로로 진입했다가 로그인하면 다시 카테고리 화면으로 돌아오도록, `/categories`를 로그인 후 신뢰 이동 대상에 추가한다.
- 카테고리 화면은 보호 화면 앱 셸(상단 헤더 + 1차 내비) 안에서 동작하며, 내비로 할 일 화면과 카테고리 화면 사이를 오갈 수 있다.
- 화면은 본인의 카테고리 목록을 정해진 정렬 순서(정렬 순서 오름차순, 같으면 먼저 등록한 것 위)로 보여주고, 각 항목은 이름과 색상을 함께 보여준다. 목록은 `docs/standards/front-end-state.md`와 `docs/standards/front-end-ui.md`의 가상 스크롤 목록 표준을 따라 페이징 API 위에서 동작한다: 한 번에 한 묶음(20개, 백엔드 기본 묶음 크기)을 불러와 보이는 항목만 렌더링하고, 목록을 아래로 스크롤하면 다음 묶음을 이어 불러온다. 명시적 페이지 이동 컨트롤과 전체 개수 표시는 두지 않는다. 카테고리가 하나도 없으면 빈 상태 안내를 표시한다. 설명은 목록 항목에 표시하지 않으며, 설명 변경·비우기는 수정 입력 화면에서 확인한다.
- 사용자는 새 카테고리 만들기를 열어 이름, 색상, 설명을 입력하는 모달 입력 영역에서 카테고리를 만든다. 정렬 순서는 입력하지 않고 목록 맨 뒤에 추가되도록 서버 기본값에 맡긴다.
- 사용자는 각 항목에서 수정 모달을 열어 이름, 색상, 설명을 부분 수정한다. 색상과 설명은 비울 수 있다. 이름·설명·색상 검증은 생성과 수정 양쪽에서 동일하게 적용한다.
- 사용자는 각 항목에서 삭제를 확인 모달로 거친 뒤 영구 삭제한다. 확인 모달에는 그 카테고리에 묶였던 할 일이 미분류로 바뀐다는 설명을 함께 표시한다.
- 화면은 이름 빈 값/공백, 이름 50자 초과, 설명 500자 초과, 색상 형식 오류를 제출 전에 안내한다.
- 서버가 중복 이름으로 생성 또는 수정을 거절하면 사용자는 같은 모달에서 중복 이름 안내를 확인할 수 있다.
- 카테고리를 만들거나 수정하거나 삭제하는 요청을 기다리는 동안 중복 제출을 막고 진행 중 상태를 표시한다.
- 카테고리 목록은 서버 상태로 관리하고, 생성·수정·삭제가 성공하면 목록을 다시 불러와 화면에 반영한다.
- 생성·조회·수정·삭제는 기존 REQ-003의 카테고리 API 계약을 사용한다. 이 카드는 카테고리 API, 저장 정책, 검증 정책을 변경하지 않는다.
- route 기준 page mock Storybook story와 상태별 story, Playwright FE BDD 테스트로 화면 상태와 사용자 흐름을 검증한다.
- 구현 단계에서는 `/todos` placeholder가 같은 앱 셸 내비를 함께 쓰도록 갱신해 내비에서 두 화면이 일관되게 보이도록 한다.

## 표준 용어

- category.category
- category.name
- category.color
- category.description
- category.displayOrder
- category.create
- category.list
- category.update
- category.delete
- category.duplicateName
- todo.task
- todo.categoryRef
- ui.appShell
- ui.desktopViewport
- ui.accessibilityCheck

## 제외 범위

- 카테고리 API, DB 스키마, 검증 정책 변경 (REQ-003을 따른다)
- 카테고리 수동 재정렬 UX (드래그 이동, 정렬 순서 직접 편집 입력) — 후속 카드로 분리한다
- 색상 사용자 정의 팔레트 관리
- 할 일 목록 본문과 할 일에 카테고리를 연결하는 화면 (REQ-002 FE 후속 카드에서 다룬다)
- 카테고리 검색, 필터, 사용자에게 보이는 페이지 이동 컨트롤(이전/다음·페이지 번호)과 전체 개수 표시 (목록은 가상 스크롤로만 더 불러온다)
- 삭제 시 영향받는 할 일 개수 표시 (카테고리 조회 응답에 건수가 없다)
- 가입 시 기본 카테고리 시드 동작 변경 (REQ-003을 따른다)
- 모바일/태블릿 전용 레이아웃 최적화

## 수용 기준

- (FE) `/categories` 경로에 접근하면 자신의 카테고리 목록이 보인다
- (FE) 카테고리 목록은 정해진 정렬 순서대로 보이며, 같은 순서면 먼저 등록한 카테고리가 위로 정렬되어 보인다
- (FE) 카테고리 목록의 각 항목은 이름과 색상을 함께 표시한다
- (FE) 카테고리가 한 묶음(20개)보다 많으면, 처음에는 첫 묶음의 카테고리까지만 보여주고 목록을 아래로 스크롤하면 다음 묶음의 카테고리를 이어서 보여준다
- (FE) 카테고리가 하나도 없으면 카테고리가 비어 있다는 안내가 보인다
- (FE) 카테고리 화면은 보호 화면 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다
- (FE) 비인증 사용자가 카테고리 화면 경로에 접근하면 로그인 화면으로 이동한다
- (FE) 카테고리 화면 경로로 진입했다가 로그인하면 카테고리 화면으로 돌아온다
- (FE) 새 카테고리 만들기를 열면 이름, 색상, 설명을 입력하는 입력 영역과 만들기 버튼이 보인다
- (FE) 카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다
- (FE) 카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다
- (FE) 카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다
- (FE) 카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다
- (FE) 유효한 정보로 카테고리를 만들면 새 카테고리가 목록에 나타난다
- (FE) 이미 사용 중인 이름으로 카테고리를 만들려고 하면 중복 이름 안내가 보인다
- (FE) 카테고리를 수정해 이름이나 색상을 바꾸면 변경된 이름과 색상이 목록에 반영된다
- (FE) 카테고리를 수정해 설명을 바꾼 뒤 수정 화면을 다시 열면 변경된 설명이 보인다
- (FE) 카테고리를 수정할 때 색상을 비우면 목록에서 그 카테고리의 색상 표시가 사라진다
- (FE) 카테고리를 수정할 때 설명을 비운 뒤 수정 화면을 다시 열면 설명이 비어 있다
- (FE) 카테고리를 수정할 때 이미 사용 중인 다른 이름으로 바꾸려고 하면 중복 이름 안내가 보인다
- (FE) 카테고리를 삭제하려고 하면 삭제를 확인받는 안내와 함께, 그 카테고리에 묶였던 할 일이 미분류로 바뀐다는 설명이 보인다
- (FE) 삭제를 확인하면 그 카테고리가 목록에서 사라진다
- (FE) 카테고리를 만들거나 수정하거나 삭제하는 요청을 기다리는 동안 해당 확인 버튼은 다시 누를 수 없는 상태로 표시된다
- (FE) 데스크톱 화면에서 카테고리 목록과 입력 영역의 주요 요소가 화면 밖으로 넘치지 않는다
- (FE) 카테고리 화면은 자동 접근성 검사에서 위반이 없어야 한다

## 의사결정 로그

- 결정일: 2026-05-30
  결정: 카테고리 관리 화면은 REQ-003을 수정하지 않고 새 front-end 요건 카드 REQ-014로 분리한다.
  이유: REQ-003은 이미 승인된 백엔드 카테고리 카드이고, 화면 구현을 섞으면 기존 BE 완료 판정과 후속 FE 판정이 한 카드 안에서 불필요하게 얽힌다. REQ-001/REQ-013(가입 API/가입 화면) 분리와 같은 패턴을 따른다.
  결정자: Tech Lead
  영향: 본 카드는 `/categories` route와 FE 화면, Storybook, Playwright FE BDD 테스트만 추적한다. 카테고리 생성/수정/삭제/조회의 정상·검증·중복·부재 정책은 REQ-003을 따른다.

- 결정일: 2026-05-30
  결정: 카테고리 관리 화면은 보호 영역 전용 `/categories` route로 두고, 보호 화면 앱 셸에 할 일 화면과 카테고리 화면을 오가는 1차 내비를 도입한다.
  이유: 카테고리 화면을 독립적으로 검토·검증·BLUE 도달 가능하게 두면서, 이후 할 일 관리 화면이 같은 앱 셸 내비를 재사용한다. 카테고리를 할 일 화면 안의 모달로만 두면 할 일 화면 카드에 종속되어 카테고리-먼저 진행 순서와 충돌한다.
  결정자: Product Owner, Tech Lead
  영향: 보호 화면 앱 셸(헤더 + 1차 내비) 구성 요소가 새로 생긴다. `/categories`는 비인증 접근 시 로그인 화면으로 보내는 가드로 감싼다. 구현 단계에서 기존 `/todos` placeholder도 같은 앱 셸 내비를 쓰도록 갱신해 두 화면 내비가 일관되게 한다.

- 결정일: 2026-05-30
  결정: 카테고리 목록은 페이징 API 위에서 가상 스크롤(무한 로드)로 동작한다. 한 묶음은 20개(백엔드 기본 묶음 크기)로 두고, 한 번에 한 묶음을 불러와 보이는 항목만 렌더링하며, 스크롤이 끝에 가까워지면 다음 묶음을 이어 불러온다. 명시적 페이지 이동 컨트롤과 전체 개수 표시는 두지 않는다. 이 동작은 `docs/standards/front-end-state.md`와 `docs/standards/front-end-ui.md`의 가상 스크롤 목록 표준으로 명문화한다.
  이유: 카테고리 조회 API는 묶음 단위 응답이라 "한 화면에 전부"를 정확히 만족시키려면 묶음을 모두 끌어와야 하고, 첫 묶음만 보여주고 나머지를 버리면 사용자가 자기 카테고리 일부를 못 본다. 모든 묶음을 한 번에 합쳐 받는 방식은 대용량 목록에서 비용이 크고 곧 만들 할 일 목록(REQ-002, 실제 대용량 페이징)에는 맞지 않는다. 페이징 API 기반 가상 스크롤은 보이는 만큼만 렌더링하면서 스크롤로 전체를 도달 가능하게 하고, 같은 패턴을 할 일 목록이 재사용한다. 카테고리 수가 적으면 한 묶음으로 끝나 추가 조회 없이 자연스럽게 동작한다.
  결정자: Product Owner, Tech Lead
  영향: 목록은 무한 쿼리(`useInfiniteQuery`)로 묶음 크기 20으로 묶음을 이어 받고, 가상 스크롤(`@tanstack/react-virtual`)로 보이는 항목만 렌더링한다. 화면에는 묶음 번호·더 보기·페이지 이동 컨트롤·전체 개수 표시를 두지 않는다. 사용자에게 보이는 페이지 이동 컨트롤은 제외 범위로 유지하되, 묶음 크기·다음 묶음·빈 묶음은 수용 기준으로 둔다. 구현 단계 작업 목록에 `@tanstack/react-virtual` 도입과 무한 쿼리 구성을 포함한다.

- 결정일: 2026-05-30
  결정: 카테고리 화면은 보호 가드로 감싸 비인증 접근을 로그인 화면으로 보내고, `/categories`를 로그인 후 신뢰 이동 대상에 추가해 카테고리 경로로 진입한 사용자가 로그인 후 카테고리 화면으로 돌아오게 한다.
  이유: REQ-011 로그인 redirect는 open redirect 방어를 위해 신뢰 목록 정확 일치만 통과시키며 현재 목록에 `/categories`가 없어 카테고리 딥링크 후 로그인하면 할 일 화면으로 떨어진다. 카테고리 화면도 보호 진입점이므로 신뢰 목록에 추가하는 것이 사용자 기대에 맞다.
  결정자: Tech Lead
  영향: `/categories`를 보호 가드로 감싸고, REQ-011 `front-end/src/features/auth/loginRedirect.ts`의 신뢰 이동 대상에 `/categories`를 추가한다(구현 단계 작업, REQ-011 메타데이터 갱신 포함). 보호 가드 동작과 로그인 후 복귀를 각각 수용 기준으로 둔다.

- 결정일: 2026-05-30
  결정: 카테고리 생성·수정은 목록 위에 뜨는 모달 입력 영역으로 처리하고, 삭제는 확인 모달로 처리한다. 별도 생성/수정 전용 페이지나 행 인라인 편집은 두지 않는다.
  이유: 데스크톱 CRUD에서 목록 맥락을 유지한 채 한 항목을 다루는 표준 패턴이고, 검증 안내·진행 중·중복 이름 안내 같은 상태 표현을 한 곳에 모을 수 있다. 행 인라인 편집은 행마다 상태 표현이 흩어지고, 전용 페이지는 라우팅·상태 표면이 늘어난다.
  결정자: Tech Lead
  영향: 화면은 목록 + 생성/수정 모달 + 삭제 확인 모달로 구성한다. 모달 폼은 클라이언트 검증 안내, submitting, 중복 이름 거절 안내, 성공 닫힘 상태를 가진다.

- 결정일: 2026-05-30
  결정: 카테고리 수동 재정렬(드래그 이동, 정렬 순서 직접 입력)은 본 카드에서 제외하고, 생성 시 정렬 순서는 입력하지 않아 목록 맨 뒤에 추가되게 한다.
  이유: REQ-003 백엔드가 정렬 순서를 자동 할당하고 자동 재배치는 범위 밖으로 두었다. 재정렬 UX는 정렬 순서 갱신 흐름과 충돌 처리 표면이 따로 필요하므로 후속 카드로 분리해 본 카드를 검토 가능한 크기로 유지한다.
  결정자: Product Owner, Tech Lead
  영향: 생성 모달에는 정렬 순서 입력을 두지 않는다. 목록은 서버가 돌려주는 순서를 그대로 보여준다. 재정렬은 별도 후속 FE 카드에서 다룬다.

- 결정일: 2026-05-30
  결정: 색상 입력은 추천 색상 스와치와 직접 입력 텍스트를 함께 제공하고, 색상은 선택 입력(비울 수 있음)으로 둔다.
  이유: 스와치만으로는 자유 색상을 못 고르고, 텍스트만으로는 형식 오류 가능성이 커진다. 둘을 함께 두면 일반 사용자는 스와치로, 원하는 사용자는 직접 입력으로 고를 수 있고, 색상 형식 오류 안내 수용 기준은 직접 입력 경로에서 검증된다.
  결정자: Tech Lead
  영향: 색상 입력은 추천 스와치 + 직접 입력 텍스트로 구성하고 비우기를 허용한다. 색상 형식 검증 안내는 직접 입력 값이 형식에 맞지 않을 때 표시한다. 입력 UX 세부(자동 포커스, 키보드 제출 등)는 본 카드 AC가 아니며 `docs/standards/front-end-ui.md`와 REQ-011/REQ-013 패턴을 따른다.

- 결정일: 2026-05-30
  결정: 삭제 확인 모달은 영향받는 할 일 개수를 표시하지 않고, 묶였던 할 일이 미분류로 바뀐다는 일반 안내만 표시한다.
  이유: 카테고리 조회 응답에 카테고리별 할 일 건수가 없어 개수를 정확히 보여줄 수 없다. 건수 표시를 위해 백엔드 응답을 바꾸는 것은 REQ-003 변경이 되어 본 카드 범위를 벗어난다.
  결정자: Tech Lead
  영향: 삭제 확인 모달 문구는 건수 없이 "이 카테고리에 묶였던 할 일은 미분류로 바뀝니다" 의미의 일반 안내를 표시한다. 삭제로 인한 할 일 미분류 전환 자체의 사용자 검증은 REQ-002 범위에서 다룬다.

- 결정일: 2026-05-30
  결정: 카테고리 목록은 TanStack Query 서버 상태로 관리하고, 생성·수정·삭제 성공 후 카테고리 목록 쿼리를 무효화해 다시 불러온다. 본 카드가 프런트엔드 서버 상태 인프라(QueryClient, query key, mutation invalidation)를 처음 도입한다.
  이유: `docs/standards/front-end-state.md`가 서버 상태를 TanStack Query로 두도록 규정한다. 카테고리 화면이 첫 목록 조회 화면이므로 여기서 query key 규약과 mutation invalidation 정책을 확립하면 이후 할 일 화면이 같은 패턴을 재사용한다.
  결정자: Tech Lead
  영향: QueryClient provider를 앱에 도입하고, 카테고리 목록 query key와 생성/수정/삭제 mutation의 invalidation 대상을 `front-end-state.md` 규약에 맞춰 정의한다. 구현 단계 작업 목록에 QueryClient 도입을 포함한다.

## BDD 테스트 리뷰

시나리오 문서는 `docs/scenarios/REQ-014-category-management-screen.feature`에 Gherkin 형식으로 별도 작성하고 승인한다. 이 섹션에는 요건 단위 Skeleton 승인 이력과 전체 테스트 리뷰 결과만 요약한다.

- 시나리오 문서: `docs/scenarios/REQ-014-category-management-screen.feature` (작성 완료, 19개 Scenario)

### 요건 Skeleton 승인 이력

- 승인일: 2026-05-30
  검증 설계: `.feature` 작성 완료. 19개 Scenario가 25개 수용 기준을 모두 `Covers:`로 정확히 매핑함을 확인했다(누락·유령·중복 0, `traceRequirementCard -Preq=REQ-014` findings 0). 화면/스토리/FE BDD 테스트는 Skeleton·구현 단계에서 작성한다.
  API Skeleton: 해당 없음. 기존 REQ-003 카테고리 API 계약을 사용한다.
  DB Skeleton: 해당 없음.
  Service Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 별도 파일로 작성했고 routes.tsx swap·외부 API client 호출·loginRedirect 갱신은 구현 단계로 분리했다.
    - 화면/페이지: `front-end/src/features/categories/pages/CategoriesPage.tsx` (`@Route /categories`, `@Page CategoriesPage`, REQ-014). 콜백 prop(onCreate/onUpdate/onDelete/onLoadMore)으로만 동작하는 인터랙션 mockup이며 외부 API client는 호출하지 않는다.
    - 구성 요소: `features/categories/components/CategoryList.tsx`(목록·각 항목 이름+색상·빈 상태·가상 스크롤 prop 콜백 시뮬레이션), `CategoryFormDialog.tsx`(생성/수정 모달, 클라이언트 검증 안내·submitting·중복 이름 거절·성공 닫힘), `CategoryDeleteDialog.tsx`(삭제 확인·미분류 안내·submitting), `features/categories/types.ts`(view model·한계값·색상 프리셋).
    - 앱 셸: `front-end/src/components/ProtectedLayout.tsx`(상단 헤더 + 좌측 1차 내비 "할 일 / 카테고리").
    - shadcn 프리미티브: `components/ui/dialog.tsx`, `components/ui/alert-dialog.tsx`, `components/ui/textarea.tsx`(Base UI 기반) + 각 `*.stories.tsx`.
    - 접근 권한: 보호 가드(RequireAuth)로 감싸기와 REQ-011 loginRedirect 신뢰 목록에 `/categories` 추가는 routes.tsx swap과 함께 구현 단계로 분리.
    - 관찰 상태 story: Routes/CategoriesPage(Route /categories 인터랙티브 mock, Empty, ManyItems), Categories/CategoryFormDialog(Create / Edit / 이름 빈 / 이름 50자 초과 / 설명 500자 초과 / 색상 형식 오류 / Submitting / 중복 이름 거절), Categories/CategoryDeleteDialog(Default / Submitting), Categories/CategoryList(Default / Empty / ManyItemsLoadingMore), Components/ProtectedLayout(CategoriesActive / TodosActive), UI/Dialog·UI/AlertDialog·UI/Textarea.
  검증: `npm run typecheck` 통과, `npm run lint` 통과, `npm test` 통과(1 file, 11 tests), `npm run build` 통과, `npm run source-index` 0 issue(REQ-014 route `/categories`·page CategoriesPage·8개 story 파일/25개 story 연결 확인), `npm run build-storybook` 성공, `generateScenarioIndex`/`generateFrontEndSourceIndex` 갱신, `traceRequirementCard -Preq=REQ-014` findings 0(requirement-cards/cross-artifact/front-end-standards/scenarios/terminology 전부 0), 상태 RED(FE BDD `@Covers` 테스트는 구현 단계 작업이라 25개 AC가 의도적으로 MISSING).
  승인자: Codex 검토
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-05-30
  리뷰자: Product Owner, Tech Lead, QA
  확인: 25개 수용 기준을 모두 `@Covers` FE BDD 테스트(Playwright `front-end/tests/e2e/categories.spec.ts`, 21개 테스트)로 검증했고 전부 PASS, 누락·유령 Covers 0(`traceRequirementCard -Preq=REQ-014` 기준 모든 AC COVERED, 상태 GREEN).
    - API 결합: `src/api/categories.ts`가 REQ-003 카테고리 계약(목록 페이징/생성/수정/삭제)을 호출하고 409를 중복 이름 오류로 매핑한다. 페이징은 flat `page/size` query 로 직렬화한다.
    - 서버 상태: `src/app/queryClient.ts`(factory) + `features/categories/queryKeys.ts` + `hooks/useCategories.ts`의 `useInfiniteQuery`(묶음 크기 20 무한 로드) 와 생성/수정/삭제 mutation 의 `lists()` invalidation. QueryClientProvider 는 `AppRouter` 에 1회.
    - 가상 스크롤: `CategoryList`가 `@tanstack/react-virtual`로 보이는 항목만 렌더링하고 스크롤 끝 근접 시 다음 묶음을 이어 받는다.
    - 결선: 표현 컴포넌트 `CategoriesPage` + 컨테이너 `CategoriesPageContainer`(`@Route /categories`, `@UsesApi` GET/POST/PATCH/DELETE), `features/categories/routes.tsx`의 보호 라우트를 `AppRouter`에 swap.
    - REQ-011 보완: `RedirectIfAuthenticated`가 신뢰 `loginRedirect`(예: `/categories` 딥링크)를 존중하도록 수정(로그인 후 원래 보호 화면 복귀), `TRUSTED_LOGIN_REDIRECTS`에 `/categories` 추가, `/todos` placeholder를 공통 `ProtectedLayout`로 이관. 기존 REQ-011 redirect/보호 화면 E2E 무회귀 확인.
  검증: `npm run typecheck`/`lint`/`build`/`test`(12) 통과, `npm run e2e` 55/55 PASS(신규 21 + 기존 34, 무회귀), `npm run build-storybook` 성공, `npm run source-index` 0 issue, `./gradlew validateHarness` BUILD SUCCESSFUL(gate pass, BE/FE/SCN/CARD/REF/TRC/TRM 전부 0). REQ-014 상태 GREEN → 카드 승인으로 BLUE.
  결과: 승인

## 열린 질문

- 없음
