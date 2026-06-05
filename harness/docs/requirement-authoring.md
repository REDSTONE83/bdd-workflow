# 질문 기반 요건 카드 작성 가이드

## 목적

요건 카드는 단순 요청 기록이 아니라, 구현 전에 모호성을 줄이고 의사결정을 남기는 기준 문서다. 사용자 요청은 Change Set으로 정리하고, 요건 카드는 제품 또는 하네스 명세의 원천으로 유지한다. 이 하네스에서는 요건 카드의 `수용 기준`이 Acceptance Test의 `@Covers` 또는 FE BDD 테스트의 `Covers` 메타데이터와 연결되어 구현 완료 여부를 판단한다.

## 작성 흐름

```text
요청 접수
-> Change Set 작성 또는 갱신
-> 영향 범위 분류 (기존 REQ 수정 / 새 원자 요건 / 비기능 / 통합 / 정책 / 구현 슬라이스 / 하네스)
-> 요건 카드 초안 또는 영향 REQ 집합 확정
-> 사용자 확인 질문 (열린 질문에 기록)
-> 답변을 범위/제외 범위/수용 기준/의사결정 로그로 분배 후 열린 질문에서 제거
-> 수용 기준 확정
-> 검증 설계 작성
-> 요건 Skeleton 작성
-> Skeleton 검증
-> 사용자 승인
-> 실행 테스트 작성
-> 업무 구현
-> 하네스 검증
```

새 요청이 들어와도 바로 새 REQ를 만들지 않는다. 먼저 기존 원자 요건의 범위/AC를 바꿀지, 여러 REQ를 함께 수정할 Change Set인지, 통합/비기능/정책/구현 슬라이스 카드가 필요한지 판단한다. 기능 변경이나 정책 전환이면 별도 전환 REQ를 만들지 않고 canonical REQ의 최종 범위와 AC를 갱신한다. 변경 전 상태와 작업 순서는 Change Set에 두고, 정책 선택의 근거만 `의사결정 로그`에 남긴다. 수용 기준이 확정되면 시나리오 하나씩 승인받지 않는다. 영향 REQ 집합 단위로 검증 설계와 요건 Skeleton을 세울 수 있지만, 명세와 완료 판정은 각 REQ의 AC 단위로 유지한다. Skeleton 단계는 인터페이스와 계약을 검토하는 단계이므로 업무 로직, 성공 응답 본문, Repository 쿼리 계약, 실행 테스트는 작성하지 않는다. 동작 내용은 Service/Controller 내부 코멘트로만 설계해 둔다.

## 진행 용어

- 검증 설계: 수용 기준과 `.feature` 시나리오로 무엇을 검증할지 정한 것. 요건 Skeleton보다 먼저 작성한다.
- Change Set: 사용자 요청을 처리하기 위해 함께 바꾸는 REQ 집합. 영구 명세 원천이 아니라 작업 범위이며, 별도 사람이 관리하는 ID 없이 `app/docs/change-sets/*.md` 또는 `harness/docs/change-sets/*.md` 파일 경로를 identity로 쓴다.
- 요건 Skeleton: API/DB/Service 계약 골격. 업무 로직은 없고 동작 설계는 내부 코멘트로만 둔다.
- 화면/라우팅 Skeleton: 화면 이름, 업무 진입점, 예상 route 초안, 접근 권한, 주요 표시 정보. 실제 컴포넌트 구현이나 DOM 구조는 만들지 않는다.
- 실행 테스트: 승인된 검증 설계를 JUnit Acceptance Test 또는 FE BDD 테스트로 옮긴 코드. 요건 Skeleton 승인 후 작성한다.
- 업무 구현: Service 업무 로직, Controller 성공 응답 본문, 실제 FE 컴포넌트/라우팅/API client 연결을 작성하는 단계다.
- 검증: `npm run app:validate` 또는 `npm run harness:validate`로 scope별 AC, 시나리오, 테스트, API, Entity, 화면 연결과 테스트 결과를 확인하는 단계다. FE 로컬 검증은 `cd app/front-end`에서 별도로 실행한다.

## 질문해야 하는 내용

질문은 구현을 막는 모호성에 집중한다.

- 누가 이 기능을 사용하는가?
- 성공 결과는 무엇인가?
- 실패해야 하는 조건은 무엇인가?
- 중복, 누락, 형식 오류는 어떻게 처리하는가?
- 권한이나 인증이 필요한가?
- 화면 또는 라우팅이 필요한가?
- (화면 요건) 화면이 어떤 레이아웃(전역 헤더/사이드바가 있는 보호 화면, 비인증 단일 카드 등)을 따르고, 카드 또는 주요 컨테이너는 어떤 표시 요소(제목, 입력, 버튼, 링크, 안내 영역 등)로 구성되는가?
- 데스크톱 화면에서 반드시 보장해야 할 표현이 있는가?
- 접근성, 키보드 조작, 다크모드/테마 요구가 있는가?
- API 상태 코드와 오류 코드는 어떤 정책을 따르는가?
- 길이, 개수, 용량, 기간, 횟수, 시간 제한 같은 정량 기준은 무엇인가?
- 이번 범위에서 제외해야 하는 것은 무엇인가?

질문은 기본적으로 한 번에 하나만 한다. 서로 분리하면 같은 정책을 두 번 결정하게 되는 항목만 최대 3개까지 묶을 수 있다. 아직 확정되지 않은 질문은 카드의 `열린 질문`에만 둔다. 답변이 오면 그 내용을 `범위`/`제외 범위`/`수용 기준`/`의사결정 로그` 중 해당 위치에 반영하고, 같은 항목을 `열린 질문`에서 제거한 뒤 다음 질문으로 넘어간다. 답변 자체를 로그처럼 보존하지 않는다.

### 선택지와 추천안은 기본값이다

질문은 **항상 선택지형**으로 작성하고, **모든 선택지 질문에 추천안을 포함**한다. "어떻게 할까요?"처럼 열린 채로 던지지 않는다. 사용자가 정책 후보를 머릿속에서 만들어야 하는 부담을 줄이고, AI가 가진 도메인 추정을 명시적으로 드러내 사용자가 빠르게 동의/수정할 수 있게 하기 위해서다.

표기 형식은 다음을 따른다.

- **추천안을 첫 항목**으로 둔다.
- 추천안 라벨 끝에 `(권장)` 표기를 붙이고, 한 줄 근거(왜 추천하는지)를 함께 적는다. 근거가 없으면 추천이 아니다.
- 추천안 다음에 단순안, 확장안 순서로 다른 선택지를 둔다.
- 수치/문자열처럼 자유 입력이 의미 있는 경우 마지막에 `직접 입력` 옵션을 둔다.
- Claude Code 환경에서는 `AskUserQuestion` 도구를 우선 사용한다. 카드 본문에 옮길 때는 동일한 추천안 표기를 그대로 옮겨 적는다.
- Codex 환경에서는 `request_user_input` 도구를 우선 사용한다. 카드 본문에 옮길 때는 동일한 추천안 표기를 그대로 옮겨 적는다.

추천안은 AI 추정값이며 확정값이 아니다. 사용자가 명시적으로 그 항목을 선택하기 전에는 `수용 기준`이나 `의사결정 로그`로 승격하지 않는다. 사용자가 다른 항목을 고르거나 직접 입력으로 다른 값을 답하면 추천안 근거는 기록하지 않고 사용자의 선택만 남긴다.

선택지를 만들기 어려운 경우(아직 정책 후보가 너무 많거나, 사용자만 알 수 있는 도메인 사실을 묻는 경우)는 자유서술 질문을 한 번만 허용한다. 그 답변을 받으면 다음 차례에 선택지형 + 추천안으로 정리해 확인 질문을 다시 한다.

```text
첨부파일 1개당 최대 용량은 어떻게 둘까요?

A. 20MB (권장: 일반 문서 첨부과 사진 1~2장을 무리 없이 담을 수 있는 범위)
B. 10MB
C. 50MB
D. 직접 입력
```

## AC 확정 전 모호성 해소

범위 문장을 바로 수용 기준으로 옮기지 않는다. 먼저 Acceptance Test 또는 FE BDD 테스트의 어셔션을 만들 수 있는지 확인한다. 아래 항목 중 하나라도 답이 없으면 사용자에게 확인 질문을 하고 `열린 질문`에 둔다. 답변이 오면 정책 선택은 `의사결정 로그`에, 검증 가능한 결과는 `수용 기준`에 반영한 뒤 `열린 질문`에서 제거한다.

- 자동 생성, 기본값, 시드: 무엇이, 몇 개, 어떤 값으로, 어떤 순서로 생성되는가?
- 문자열 정규화: trim, 대소문자, 공백만 입력, 중복 비교 기준은 무엇인가?
- 선택 입력, 미입력: 필드를 보내지 않았을 때 필수 오류, 기본값, 자동 계산 중 무엇인가?
- 중복, 유일성: 유일성의 범위는 전체 시스템, 사용자별, 특정 상태별 중 어디인가?
- 수정 의미론: PUT/PATCH 중 무엇이며, 누락 필드와 명시적 `null`은 각각 어떤 의미인가?
- 목록 조회: 필터, 정렬, 페이지네이션의 기본 `page`/`size`, 최대 `size`, 범위 초과 페이지 응답은 무엇인가?
- 화면 상태: loading, empty, error, disabled, submitting, success, permission denied, not found 중 어떤 상태가 사용자가 관찰해야 하는 결과인가?
- 화면 레이아웃과 카드 구성: 화면이 어떤 레이아웃 단위(전역 헤더 + 사이드바가 있는 보호 화면, 비인증 중앙 단일 카드 등)에 속하고, 그 카드 또는 주요 컨테이너는 어떤 표시 요소(제목, 입력, 버튼, 링크, 안내 영역 등)로 구성되는가? 화면 간 공통 입력 UX(자동 포커스, autocomplete 속성, 비밀번호 show/hide 토글 등)는 본 카드 AC로 둘지, FE 공통 표준에 위임할지 정했는가?
- 라우팅: 딥링크, 보호 라우트, 뒤로가기/새로고침 후 복원, query state가 요건인지 단순 구현 상세인지 무엇인가?
- 데스크톱 화면: 기준 해상도에서 테이블/사이드바/모달이 화면 안에 들어오는가?
- 삭제: hard delete, soft delete, 참조 중인 자원 처리, 기본 데이터 보호 여부는 무엇인가?
- 오류 응답: 검증 실패, 중복, 없음, 타인 자원 접근의 HTTP 상태 코드와 오류 코드는 무엇인가?
- 정량 기준: 허용되는 최소값/최대값과 차단되는 미만/초과값은 무엇인가?

### 공통 리스크 패턴 점검

요건의 기능 종류와 무관하게 아래 패턴이 보이면, 정책을 질문으로 확정한 뒤 `범위`, `제외 범위`, `수용 기준`, `의사결정 로그` 중 하나에 귀속한다. 이 항목은 정적 검증 룰이 아니라 작성자와 리뷰어가 누락을 찾기 위한 공통 사고 틀이다.

- 실행 환경 경계: local/test/prod, FE/BE, browser/server, 배치/온라인, proxy/profile처럼 실행 위치나 환경에 따라 동작이 달라지는가? 달라진다면 환경별 정책과 검증 방법을 분리했는가?
- 생명주기 대칭: 생성, 발급, 저장, 시작, 구독, 예약한 것이 어떻게 삭제, 만료, 해제, 취소, 정리되는가? 생성 scope와 정리 scope가 같은가?
- 외부 계약 노출: API, route, OpenAPI, 이벤트, 메시지, 파일 형식, export/import, 화면 진입점처럼 사용자나 외부 클라이언트가 의존할 계약이 있는가? 공개/보호 범위와 호환성 정책이 명확한가?
- 불신 입력: query, redirect target, callback URL, filter, sort, path, 업로드 값처럼 사용자가 이동 대상, 조회 범위, 처리 대상을 바꿀 수 있는 입력이 있는가? 허용 범위, 거절 기준, 안전한 fallback을 정했는가?
- 실패 분류: validation failure, business rule failure, authentication/authorization failure, not found, conflict, transient failure를 같은 결과로 숨길지, 사용자가 구분하도록 드러낼지 정했는가?

기능 중립 예시는 다음과 같다.

```text
- 환경 경계: 로컬과 운영에서 파일 저장 위치가 다르면 각각의 저장·검증 정책을 분리한다.
- 생명주기 대칭: 예약 작업을 만들면 취소, 만료, 중복 실행 방지 정책도 함께 정한다.
- 외부 계약 노출: CSV export를 제공하면 컬럼 순서, 인코딩, 기존 클라이언트 호환성 정책을 정한다.
- 불신 입력: 정렬/필터 query는 허용값과 알 수 없는 값의 fallback을 정한다.
- 실패 분류: 형식 오류와 업무 규칙 위반을 같은 안내로 볼지, 구분해서 보여줄지 정한다.
```

확정된 답변은 다음처럼 검증 가능한 조건과 기대 결과로 바꾼다.

```text
- 정렬 순서를 입력하지 않으면 본인 카테고리의 최대 정렬 순서에 1024를 더한 값으로 할당된다
- 수정 요청에서 색상에 null을 명시하면 색상이 비워진다
- 본인의 카테고리 목록이 정렬 순서 오름차순, 동률이면 식별자 오름차순으로 조회된다
- page=0&size=2 요청은 정렬 순서대로 첫 두 항목과 totalElements=3, totalPages=2를 반환한다
- page=1&size=2 요청은 두 번째 페이지의 남은 항목과 동일한 totalElements를 반환한다
- 제목이 1자 이상 100자 이하이면 저장된다
- 제목이 0자이거나 101자 이상이면 저장이 거절된다
```

다음처럼 구체 값이나 관찰 가능한 결과가 빠진 문장은 수용 기준으로 확정하지 않는다.

```text
- 기본 카테고리가 생성된다
- 카테고리를 적절히 수정할 수 있다
- 목록이 조회된다
- 목록이 페이징된다
```

## 수용 기준 작성

수용 기준은 테스트 가능한 결과 문장이어야 한다.

목록 조회가 범위에 있으면 페이징 수용 기준을 반드시 작성한다. `PageResponse<T>` 엔벨로프 존재만으로 충분하지 않다. 사용자가 한 묶음에 몇 개씩 보는지, 한 번에 보는 개수를 바꿔 다음 묶음을 열면 결과가 어떻게 잘리는지, 전체 개수와 전체 묶음 수가 유지되는지를 관찰 가능한 문장으로 적는다. 정렬이 있는 목록은 페이징 전에 적용되는 정렬 순서도 별도 수용 기준으로 둔다.

### 화면 레이아웃과 카드 구성

화면이 범위에 포함되면 화면 레이아웃과 카드 구성을 페이징과 같은 원칙으로 다룬다. 사용자에게 어떤 표시 단위가 보이는지가 완료 판정에 직접 영향을 주기 때문이다. 화면에서 검증할 결과 AC는 `(UI)` 또는 사용자 여정이면 `(E2E)` 마커를 붙인다.

작성 순서는 다음과 같다.

1. `질문해야 하는 내용`의 화면 레이아웃·카드 구성 질문을 선택지형으로 사용자에게 던진다. 기본 레이아웃 후보(보호 화면 chrome 사용 / 비인증 중앙 단일 카드 / 화면 가운데 모달 / full-bleed 화면 등)와 카드의 주요 표시 요소(제목, 입력, 버튼, 링크, 안내 영역 등) 후보를 함께 제시하고, 같은 도메인의 기존 화면 카드(예: REQ-011 로그인)와 같은 패턴을 권장안으로 둔다.
2. 사용자가 확정한 레이아웃 단위와 카드 표시 요소를 `범위`에 한두 줄 narrative로 적는다. 예: "회원 가입 화면은 비인증 단일 카드 레이아웃을 사용하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면 링크로 구성한다."
3. 같은 구성을 `수용 기준`에 검증 가능한 한 줄로 별도 AC로 둔다. 예: "(UI) 회원 가입 화면은 화면 가운데에 하나의 회원 가입 카드를 표시하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크로 구성된다."
4. 입력 UX 세부(자동 포커스, autocomplete 속성, 비밀번호 show/hide 토글, 키보드 제출 등)는 본 카드 AC로 둘지 FE 공통 표준([`../standards/front-end-ui.md`](../standards/front-end-ui.md))에 위임할지를 별도 선택지형 질문으로 확정하고, 결정과 근거를 `의사결정 로그`에 남긴다. 본 카드 AC에 두기로 한 항목만 별도 수용 기준으로 적고, 위임한 항목은 카드 AC에 복제하지 않는다.

`범위`에만 적혀 있고 `수용 기준`에 없는 화면 구성은 FE BDD 테스트로 커버되지 않으므로 사용자가 보는 표시가 의도와 달라져도 RED로 잡히지 않는다. 화면이 범위에 있는 카드는 Skeleton 승인을 요청하기 전에 카드 구성 AC가 한 줄 이상 있는지 다시 확인한다.

### 화면 카드 AC 점검

화면을 포함하는 카드는 위 화면 레이아웃 AC 외에 다음을 Skeleton 승인 전에 한 줄씩 확인한다. 정적 룰이 아니라 작성자·리뷰어의 공통 사고 틀이며, 실제 리뷰에서 반복적으로 누락된 항목을 모았다.

- **관찰 위치 실재**: 각 결과 AC를 사용자가 관찰하는 위치(목록 항목 / 입력 화면 / 안내 영역 / 상세)가 화면 표시 범위에 실제로 존재하는가? 목록에 표시하지 않는 필드의 변경을 "목록에 반영된다"로 적지 않는다. 표시하지 않는 필드의 변경·비우기는 관찰 위치를 바꾸거나(예: "수정 화면을 다시 열면 …") 그 필드를 표시하도록 범위를 넓힌다.
- **범위 ↔ AC 행위 대칭**: `범위`에 적은 모든 사용자 관찰 동작이 검증 가능한 AC로도 있는가? 화면 구성뿐 아니라 보호 라우트 가드(비인증 → 로그인 이동), 로그인 후 복귀, 성공 후 이동, 모드별 동작도 포함한다. `범위`에만 있고 `수용 기준`에 없는 동작은 FE BDD 테스트로 커버되지 않아 RED로 잡히지 않는다.
- **CRUD·필드 대칭**: 생성/수정/삭제가 범위면 각각 결과 AC가 있는가? 생성과 수정에 같은 검증이 걸리면 AC를 "만들거나 수정할 때 …"로 양쪽을 덮거나 생성·수정 AC를 분리한다(생성만 검증해도 통과하는 문장을 두지 않는다). 비울 수 있는 필드(색상, 설명 등)는 필드마다 비우기 결과 AC를 둔다.
- **페이징 API 소비 정합**: 화면이 묶음(page) 단위 목록 API를 소비하면 표시 방식(전부 표시 / 무한·가상 스크롤 / 페이지 컨트롤)을 API 페이징 계약과 대조한다. "한 화면에 전부" 같은 표현이 기본 `size`·최대 `size`와 모순되지 않는지 확인하고, 묶음 크기 숫자를 `범위`/`의사결정 로그`에 고정한 뒤 묶음 크기·다음 묶음·빈 묶음을 AC로 둔다. 가상 스크롤·무한 로드 구성은 [`../standards/front-end-state.md`](../standards/front-end-state.md)·[`../standards/front-end-ui.md`](../standards/front-end-ui.md)를 따른다.
- **공유 모듈 영향**: 새 보호 라우트를 추가하면 로그인 redirect 신뢰 목록(`loginRedirect`)처럼 다른 카드가 소유한 공유 모듈에 미치는 영향을 점검한다. 갱신이 필요하면 `의사결정 로그`와 구현 단계 작업 목록에 "다른 카드 메타데이터 갱신"으로 남긴다.

시나리오 step과 카드 상태 표기에는 자동 경고(severity=warning, 게이트 비차단)가 붙는다.

- 시나리오 step(Given/When/Then)은 사용자 관찰 언어로만 적는다. "요청이 전송된다 / 전송되지 않는다" 같은 요청 전송 단정은 `SCN-STEP-IMPL-VOCAB` 경고로 잡힌다. 네트워크 미전송은 시나리오가 아니라 Playwright assertion에 둔다.
- `.feature` 시나리오 문서를 작성하면 카드의 "시나리오 문서:" 줄의 "작성 예정" 표기를 즉시 갱신한다. feature가 있는데 카드가 작성 예정으로 남아 있으면 `CARD-SCENARIO-STALE` 경고로 잡힌다.

### AC도 관계자 언어로 작성한다

수용 기준은 사용자/PO/QA가 함께 승인하는 **완료 기준**이다. BDD 시나리오만 관계자 언어로 정리해도 AC가 기술 어휘로 가득하면 원천 기준이 다시 개발자 문서가 된다. AC도 같은 방향을 따른다.

AC가 만족해야 하는 조건:

- 관계자가 읽고 승인할 수 있다.
- 테스트로 검증 가능하다.
- 구현 방식이 아니라 관찰 가능한 결과다.
- `null`, JSON 키(`title`, `content`, `totalElements` 등), HTTP 상태 코드, DTO 필드명, 오류 코드는 계약 자체가 AC가 아닌 한 AC에 쓰지 않는다.

기술 표현은 다음 위치로 내려보낸다.

- **AC에 남기는 정량/계약값**: `100자`, `8자 이상`, `기본 20`, `최대 100`. 사용자가 인지하는 한계이고 테스트 어셔션이 그대로 검증한다.
- **API 계약 (컨트롤러/DTO/OpenAPI)**: `null`, JSON 키, HTTP 메서드/상태 코드 같은 직렬화·전송 형식.
- **의사결정 로그**: 정책 선택(예: "다른 사용자의 자원은 부재와 동일하게 404"), 명세에 명시적으로 박아 둘 결정.
- **테스트 assertion**: `INVALID_CATEGORY`, `INVALID_REQUEST` 같은 오류 코드. AC는 "사용할 수 없는 카테고리라는 안내가 보인다" 같은 사용자 관찰 어휘로 둔다.

좋은 예:

```text
- 유효한 정보이면 계정이 생성된다
- 중복 이메일이면 가입이 거절된다
- 비밀번호가 8자 미만이면 가입이 거절된다
- 할 일 생성 시 설명을 비워 두면 설명 없이 저장된다
- 할 일 목록에서 현재 묶음 번호, 한 번에 보는 개수, 전체 할 일 수, 전체 묶음 수를 알 수 있다
- 할 일 목록에서 연결된 카테고리의 이름과 색상을 확인할 수 있고, 연결이 없으면 미분류로 확인된다
```

피해야 할 예 — 모호한 문장:

```text
- 회원 가입을 잘 처리한다
- 예외 처리를 한다
- 사용자 경험을 개선한다
```

피해야 할 예 — 기술 어휘가 AC에 들어간 경우:

```text
- 할 일 생성 시 설명에 null을 명시하면 설명 없이 저장된다
- 응답에는 content, page, size, totalElements, totalPages가 포함된다
- 할 일 응답에는 연결된 카테고리의 ID, 이름, 색상이 함께 반환되며, 연결이 없으면 카테고리 정보는 null이다
- INVALID_CATEGORY 오류 코드와 categoryId 필드가 응답된다
```

**예외**: 제품 자체가 외부 API여서 오류 코드/HTTP 상태 코드/JSON 형식을 외부 개발자가 직접 의존하는 경우(REQ-004 인증처럼 토큰 검증 결과를 외부 클라이언트가 코드 단위로 분기하는 경우 등), 그 값은 사용자/외부 개발자가 직접 보는 계약이므로 AC에 남길 수 있다.

## 검증 설계와 요건 Skeleton

AC가 확정되면 요건 하나를 기준으로 검증 설계와 요건 Skeleton을 만든다. 검증 설계는 수용 기준과 업무 시나리오가 맞는지 확인하는 기준이고, 요건 Skeleton은 API 계약, DB 스키마, Service 공개 메서드가 서로 맞는지 검토하기 위한 골격이다. 시나리오 하나씩 승인받지 않고, 요건 단위로 Skeleton을 검증하고 사용자 승인을 받은 뒤 같은 요건의 구현으로 넘어간다.

시나리오는 PO/QA/기획자/프론트엔드/백엔드가 함께 읽을 수 있는 업무 언어 단위이며, 원본은 Gherkin `.feature` 파일로 `app/docs/scenarios/REQ-XXX-*.feature` 또는 `harness/docs/scenarios/REQ-XXX-*.feature`에 둔다. 요건 1건당 `.feature` 파일 1개를 두고, 그 요건의 수용 기준을 검토하는 시나리오 묶음을 한 번에 작성한다.

Cucumber 실행 도구는 도입하지 않는다. `.feature`는 "공유 BDD 명세 + 하네스 추적 입력"으로만 사용한다. 테스트 실행은 평소처럼 JUnit이 담당하며, `.feature`는 사람이 읽고 하네스가 파싱한다.

파일명은 요건 카드와 짝을 맞춘다 (예: 요건 `REQ-002-personal-todo.md`에 대응하는 시나리오 파일은 `REQ-002-personal-todo.feature`).

시나리오 문서가 담는 정보:

- **`@REQ-XXX` 태그**: Feature 레벨 태그. 어떤 요건의 시나리오인지 연결한다.
- **Feature**: 요건 카드의 제목과 동등한 업무 언어 문장.
- **Scenario 제목**: 업무 언어 문장. AC 문장을 그대로 복사하지 않는다. (예: `할 일이 많은 사용자가 두 번째 목록 묶음을 이어서 확인한다`)
- **`Covers:` 블록**: 이 시나리오가 검증하는 수용 기준 문장 목록. Gherkin 표준 키워드는 아니며, Scenario 제목과 첫 Given 사이의 설명 블록(free-text description)에 둔다. 하네스는 이 블록을 파싱해 테스트의 `@Covers`와 같은 의미로 추적한다.
- **Given / When / Then / And**: 자연어 문장. 사용자 상태, 핵심 행위, 관찰 가능한 결과를 프론트엔드와 백엔드가 함께 이해할 수 있게 적는다.

요건 Skeleton은 별도 문서가 아니라 코드 골격(Controller/DTO/Entity/Repository/Service), 화면/라우팅 Skeleton, `previewSchema` 산출물로 둔다. `.feature` 파일은 시나리오 본문에만 집중하고, API/DB/Service 명세는 평소대로 `app/back-end/src/main/java`의 골격 코드에서 확인한다. `(UI)` 또는 `(E2E)` AC가 있는 요건은 화면 이름, 업무 진입점, route 초안, 접근 권한, 주요 표시 정보, 필요한 Storybook 상태를 카드의 Skeleton 승인 이력에 남긴다. 작성 기준은 `app/docs/standards`의 API/DB/FE 표준을 따른다.

```gherkin
@REQ-002
Feature: 개인 할 일 관리

  Scenario: 할 일이 많은 사용자가 두 번째 목록 묶음을 이어서 확인한다
    Covers:
      - 본인의 할 일 목록은 page와 size 쿼리 파라미터로 페이지 단위로 조회된다
      - 응답에는 content, page, size, totalElements, totalPages가 포함된다

    Given 사용자는 정렬 기준으로 보여질 할 일 6개를 가지고 있다
    And 다른 사용자의 할 일도 함께 존재한다
    When 사용자가 한 번에 2개씩 보도록 설정하고 두 번째 묶음을 연다
    Then 내 할 일 중 두 번째 묶음에 해당하는 2개만 보인다
    And 사용자는 현재 묶음 번호, 한 번에 보는 개수, 전체 개수, 전체 묶음 수를 알 수 있다
```

Gherkin 키워드는 영어(`Feature`/`Scenario`/`Given`/`When`/`Then`/`And`)를 사용하고 본문은 한국어로 적는다. `# language: ko` 지시자는 사용하지 않는다. 표준 Gherkin 파서는 `# language: ko`가 있으면 한국어 dialect 키워드(`기능`, `시나리오`, `조건/먼저`, `만일`, `그러면`, `그리고`)를 기대하므로 영어 키워드와 섞으면 파서에 따라 인식하지 못할 수 있다.

`Covers:` 블록은 Gherkin 파서가 description(free text)으로 다루는 영역이므로 표준 도구 호환을 깨지 않는다. 하네스는 이 영역에서 `Covers:` 헤더 다음의 `- ...` 라인을 AC 문장 목록으로 수집한다.

본문은 사용자 시점의 업무 흐름으로 적는다. 화면 라우트(`/todos` 등), HTTP 메서드/상태 코드, DTO 키, CSS selector 같은 구현 어휘는 시나리오 밖에서 다룬다 ([`acceptance-test.md`](../standards/acceptance-test.md) "Given / When / Then 문장 작성 규칙"). 라우팅 자체가 AC인 경우에 한해 예외적으로 시나리오에 포함한다.

### 요건 Skeleton 승인 전 체크리스트

Skeleton 승인을 요청하기 전에 다음을 한 줄씩 확인한다.

- 요건 카드의 모든 수용 기준이 하나 이상의 `.feature` 시나리오 `Covers:`에 포함되어 있는가
- 사용자는 누구인가? (역할/소유 관계가 분명한가)
- 로그인/비로그인/권한 상태가 명확한가? `로그인한 사용자` 같은 상태 표현이 누락되지 않았는가
- 사용자가 어떤 업무 화면 또는 기능에 진입하는가? 어떤 업무 행위를 시작하는가
- 그 진입을 URL이나 엔드포인트가 아니라 업무 진입점(`할 일 목록을 연다`, `정렬 기준을 바꾼다`)으로 표현했는가
- 라우팅 자체가 AC인지, 아니면 단순 구현 상세인지 구분되어 있는가
- 기대 결과(Then)가 사용자가 관찰 가능한 형태인가 (JSON 키나 상태 코드 그대로 노출 금지)
- 이 행위가 정상 UI 흐름인가? 정상 흐름이 아니라면 북마크, 딥링크, 브라우저 뒤로가기/새로고침, 다중 기기에서 데이터가 줄어든 상태, 외부 통합 URL처럼 사용자가 실제로 마주칠 수 있는 경로를 `Given`에 명시했는가? 그런 경로를 설명할 수 없는 행위는 BDD 시나리오로 두지 말고 API 방어 계약으로 분류한다. ([`../standards/acceptance-test.md`](../standards/acceptance-test.md) "발생 경로가 설명되지 않는 행위는 시나리오로 두지 않는다")
- Given/When/Then 본문이 일반 관계자가 읽는 사용자 관찰 언어로만 쓰여 있는가? `null`, `응답`, `필드`, DTO/JSON 키(`title`, `dueDate`, `categoryId`, `content`, `totalElements` 등), 오류 코드(`VALIDATION_FAILED`, `INVALID_CATEGORY` 등), HTTP 메서드/상태 코드 같은 기술 어휘는 `Covers:` 또는 Acceptance Test에서만 쓴다 ([`../standards/acceptance-test.md`](../standards/acceptance-test.md) "`Covers:`는 추적 메타, Given/When/Then은 관계자 언어").
- 실행 환경 경계가 있다면 코드 Skeleton, 설정 Skeleton, 테스트 전략에서 그 차이를 재현할 수 있는가?
- 생성, 발급, 저장, 시작되는 상태가 있다면 삭제, 만료, 해제, 정리의 scope가 같은가?
- 외부 계약이 있다면 카드 AC와 Skeleton 코드 양쪽에 공개/보호 범위와 호환성 정책이 반영됐는가?
- 사용자가 입력한 값으로 이동, 조회, 처리 대상이 바뀐다면 허용 범위와 fallback이 명확한가?
- 실패 유형이 검증 가능한 단위로 분리되어 있는가? 같은 결과로 숨기는 경우에도 그 의도가 의사결정 로그에 남았는가?
- 새 결정이 기존 의사결정 로그와 충돌하지 않는가? 정책을 바꿨다면 이전 결정을 수정하거나 `대체됨`으로 명시했는가?
- Controller mapping, DTO, Entity, Repository, Service 공개 메서드가 같은 업무 단어와 같은 입출력 방향을 사용하는가
- Service 공개 메서드가 Skeleton 단계에서도 `transaction.md`의 메서드 레벨 `@Transactional` 정책을 따르는가?
- Service 내부 코멘트에 정상 흐름, 예외 흐름, 상태 변화, 알림/부수효과, 트랜잭션 경계 설계가 요약되어 있는가
- 설정 Skeleton이 있다면 프로젝트 소유 `app.*` 키가 typed `@ConfigurationProperties`에 바인딩되고, profile override 정책이 명확한가?
- `(UI)` 또는 `(E2E)` AC가 있으면 화면 이름, route 초안, 접근 권한, 주요 표시 정보, 사용자가 관찰할 상태(initial / fieldErrors / submitting / serverRejection / success 등)가 요약되어 있는가
- `(UI)` 또는 `(E2E)` AC가 있으면 화면 레이아웃 단위(보호 화면 / 비인증 단일 카드 등)와 카드 구성(제목·입력·버튼·링크·안내 영역)이 `범위`에 narrative로, `수용 기준`에 검증 가능한 한 줄로 모두 반영되어 있는가
- `(UI)` 또는 `(E2E)` AC가 있으면 새 화면 컴포넌트가 routes.tsx swap 없이 별도 파일로 작성되어 있고 인터랙션 mockup(폼 입력 반응, 클라이언트 검증 안내, 상태 전환)이 실제로 동작하는가
- `(UI)` 또는 `(E2E)` AC가 있으면 외부 API 호출과 navigate 이동이 컴포넌트 props/콜백으로 mock되어 있고, 화면이 직접 `apiClient.*`을 호출하지 않는가 (실제 결합은 구현 단계)
- `(UI)` 또는 `(E2E)` AC가 있으면 route 기준 page mock story 1개와 사용자가 관찰할 주요 상태별 story 묶음(initial / fieldErrors / submitting / serverRejection / success 등)이 작성되어 있고, `parameters.harness.requirements`로 본 카드에 연결되어 있는가
- `(UI)` 또는 `(E2E)` AC가 있으면 Storybook으로 검토할 상태와 구현 단계의 Playwright FE BDD 테스트가 검증할 사용자 흐름이 구분되어 있는가
- `(UI)` 또는 `(E2E)` AC가 있으면 다른 카드(예: REQ-011)의 placeholder 정리, routes.tsx swap, FE BDD 테스트, visual snapshot baseline이 구현 단계 작업 목록으로 분리되어 있는가
- FE 공통 UI primitive나 주요 화면 조각을 새로 만들거나 바꾸는 요건이면 본 카드 Skeleton에서 함께 작성한 Storybook story 위치가 명시되어 있는가
- `@Covers`가 붙은 JUnit Acceptance Test나 FE BDD `Covers` 메타데이터가 아직 저장소의 추적 대상 경로에 생성되지 않았는가?
- Skeleton 코드에 실제 업무 로직이나 임시 성공 응답이 들어가지 않았는가

### Skeleton 단계 산출물 범위

Skeleton 승인 전까지는 "인터페이스와 계약"까지만 만든다.

백엔드는 인터페이스와 계약까지만 만든다. 프런트엔드 화면은 사용자가 Storybook에서 사용자 흐름을 검토할 수 있도록 인터랙션 mockup 수준까지 작성한다. 단, 외부 API client 결합과 routes.tsx swap, 다른 카드 placeholder 정리는 구현 단계로 분리해 Skeleton 검토가 placeholder 변동에 흔들리지 않도록 한다.

허용:

- 검증 설계: `app/docs/scenarios/REQ-XXX-*.feature` 또는 `harness/docs/scenarios/REQ-XXX-*.feature` 시나리오 문서 (요건 전체의 Feature/Scenario/`Covers:`/Given/When/Then)
- Controller mapping, 요청/응답 DTO, Bean Validation, OpenAPI 애너테이션
- `@Entity`, 컬럼, 관계, `nullable`/`unique`/`length`, 클래스 및 필드 레벨 `@Requirement`
- 빈 `JpaRepository` extends 선언
- Service 인터페이스 또는 클래스의 공개 메서드 시그니처
- Service/Controller 내부 코멘트: 정상 흐름, 예외 흐름, 상태 변화, 부수효과, 호출해야 할 협력 객체를 구현 없이 설계
- `previewSchema` 산출물
- 화면/라우팅 Skeleton: 화면 이름, 업무 진입점, 예상 route 초안, 접근 권한, 주요 표시 정보, 사용자가 관찰할 상태(initial / fieldErrors / submitting / serverRejection / success 등). 카드의 `BDD 테스트 리뷰 > 요건 Skeleton 승인 이력`에 작성 위치와 함께 남긴다.
- FE 화면 인터랙션 mockup: 새 화면 컴포넌트를 별도 파일로 작성한다. 실제 DOM과 Tailwind 스타일을 사용해 화면이 실제처럼 보이게 하고, 폼 입력 반응, 클라이언트 측 검증 안내, submitting/error/success 등 사용자가 관찰할 상태 전환이 실제로 동작하게 한다. 외부 API 호출과 라우팅 이동은 컴포넌트의 props/콜백(또는 React Router 의존성 주입)으로 받아 Storybook control이 결과를 강제할 수 있게 한다.
- Storybook story: 화면이 있는 카드는 route 기준 page mock story 1개와 사용자가 관찰할 상태별 story 묶음(initial / fieldErrors / submitting / serverRejection / success 등)을 작성한다. story 파일에 `parameters.harness.requirements`로 본 카드를 연결한다.

금지:

- `@Covers`가 붙은 테스트 메서드. Skeleton 승인 요청 시 JUnit `@Covers` 또는 FE BDD `Covers` 메타데이터가 존재하면 승인 불가다.
- 빈 PASS 테스트 (assertion 없는 `@Test` 메서드는 JUnit 기준 PASS로 잡혀 허위 GREEN을 만든다)
- Service 업무 로직 구현
- Entity나 DTO에 임시 필드를 넣어 이후 결정을 미루는 것
- Controller의 실제 성공 응답 구현
- Repository 쿼리 메서드 선언 (`findBy...` 등 메서드 시그니처는 본문이 없어도 Spring Data가 조회 계약을 만든다. 단, Entity 연결 확인용 빈 `JpaRepository` extends 선언은 필요 시 허용한다)
- FE 화면에서 외부 API client 직접 호출 (`apiClient.GET/POST` 등). API 호출은 props/콜백으로 mock하고, 실제 결합은 구현 단계에서 한다.
- routes.tsx 의 새 화면 swap. 새 화면은 별도 파일로 두고, 기존 placeholder route는 그대로 유지한다.
- 다른 카드의 placeholder 수용 기준/시나리오/FE BDD 테스트/page mock story 정리. 다른 카드(예: REQ-011)의 placeholder 정리도 구현 단계에서 함께 처리한다.
- `Covers`가 붙은 FE BDD 테스트 (Playwright)
- visual snapshot baseline
- 라우팅이 AC가 아닌데 시나리오에 구체 URL을 고정하는 것

컴파일이 필요한 경우 다음 정도로 둔다.

- Controller: `@RequestMapping`/`@Operation`/시그니처는 작성하되 본문은 `throw new UnsupportedOperationException(...)` 또는 미구현 상태로 둔다.
- Service: 인터페이스나 클래스 시그니처만 작성한다. 클래스 본문이 필요하면 내부 코멘트로 흐름을 적고 `throw new UnsupportedOperationException(...)`으로 닫는다. 이때 공개 서비스 메서드는 Skeleton 단계라도 `@Transactional` 또는 `@Transactional(readOnly = true)`를 메서드 레벨에 명시한다.
- Entity: `previewSchema`를 돌리기 위해 필요한 만큼 완전한 형태로 작성한다.
- FE: 새 화면 컴포넌트는 별도 파일로 두고 인터랙션 mockup까지 작성한다. 외부 API 호출과 navigate 이동은 props/콜백으로 받아 호출 자체는 구현 단계에서 결합한다. routes.tsx swap, 다른 카드 placeholder 정리, `@Covers` FE BDD 테스트, visual snapshot baseline은 구현 단계로 미룬다.

### 승인 게이트

검증 설계 + 요건 Skeleton을 묶어 한 번에 사용자에게 승인을 요청한다. 승인되면 같은 요건의 실행 테스트와 구현 단계로 진행한다.

승인 이력은 요건 카드의 `BDD 테스트 리뷰 > 요건 Skeleton 승인 이력` 서브섹션에 요건 단위로 남긴다. `.feature` 파일 자체에는 승인 이력을 넣지 않는다. 표준 Gherkin 도구와의 호환을 유지하기 위해서다.

### Skeleton 검증 명령

Skeleton 단계의 카드는 아직 `@Covers` 테스트가 없으므로 RED로 잡힌다. 이는 정상이다. 이 시점에는 strict 게이트인 `app:validate`/`harness:validate`를 돌리지 않는다. 다음 명령으로 컴파일, 소스 인덱스, 스키마, 추적 현황만 확인한다.

```bash
cd app/back-end
./gradlew compileJava                                # Skeleton 코드 컴파일 확인
./gradlew previewSchema                              # Entity 변경이 있으면 DDL 미리보기
cd ..
cd ..
npm run app:source-index                             # Java source index 생성
npm run app:front-end-source-index                   # FE source index 생성
npm run app:trace -- --requirement REQ-XXX           # 앱 단일 카드 현황
```

하네스 대상 요건이면 다음을 사용한다.

```bash
npm run harness:self-test-index
npm run harness:trace -- --requirement REQ-XXX
```

FE 대상 요건이면 다음도 함께 확인한다.

```bash
cd app/front-end
npm run typecheck
npm run lint
npm run source-index
npm run build-storybook    # 인터랙션 mockup 컴포넌트와 page mock / 상태별 story가 정상 빌드되는지 확인
```

리뷰어가 Storybook에서 사용자 흐름을 직접 확인하려면 `npm run storybook` 으로 띄우고 본 카드의 `parameters.harness.requirements` 가 본 요건 ID로 연결된 story 묶음(page mock + 상태별)을 본다.

승인 후 BDD 테스트와 구현이 들어가면 scope에 맞게 `npm run app:validate` 또는 `npm run harness:validate`로 RED를 해소한다. Skeleton 단계의 RED는 여전히 정상이며, `@Covers` FE BDD 테스트, visual snapshot baseline, routes.tsx swap, 다른 카드 placeholder 정리는 모두 구현 단계에서 진행한다.

## BDD 테스트 코드 작성

시나리오는 사용자 행위 단위이고 테스트는 AC 검증 단위다. 한 시나리오에 여러 테스트가 귀속될 수 있고, 같은 AC를 입력 변형/경계값마다 별도 테스트로 나누는 것이 권장된다.

승인된 검증 설계의 `.feature` 시나리오 `Covers:`에 포함된 AC를 검증하는 테스트 메서드를 작성한다. 백엔드는 JUnit Acceptance Test, 프런트엔드는 Playwright FE BDD 테스트가 담당한다. Vitest/Testing Library 테스트는 TDD/보조 테스트로 두며 AC 커버리지에는 포함하지 않는다.

- `@Covers`: 요건 카드의 수용 기준 문장을 그대로 사용한다. 한 메서드가 여러 AC를 동시에 검증하면 배열로 적는다.
- `@DisplayName`: JUnit 표시용 자유 작성 레이블이다. 시나리오 제목과 같아도, 다른 케이스 단위 설명을 적어도 무방하다.
- 테스트 본문: 시나리오의 Given/When/Then을 실행 가능한 준비/행위/검증으로 옮긴다. 한 시나리오에 묶인 여러 테스트는 각자 다른 입력 변형/경계값을 다룬다.

시나리오와 테스트의 연결은 `Scenario.Covers ∩ Test.@Covers`로 판단한다. 별도 시나리오 ID나 `@DisplayName` 매칭 규칙은 두지 않는다. 시나리오 제목은 추적 ID가 아니므로 검토 과정에서 자유롭게 다듬을 수 있다.

```java
@Test
@Covers("본인의 할 일 목록은 page와 size 쿼리 파라미터로 페이지 단위로 조회된다")
@DisplayName("page=1, size=2 두 번째 페이지에 두 항목만 반환된다")
void pageAndSizeQueryParametersSliceContent() {
    // 시나리오의 Given/When/Then을 실행 가능한 테스트로 옮긴다.
}

@Test
@Covers("응답에는 content, page, size, totalElements, totalPages가 포함된다")
@DisplayName("PageResponse 메타데이터 5개 필드가 모두 채워진다")
void pageResponseShapeContainsAllFields() {
    // 같은 시나리오에 묶인 또 다른 검증.
}
```

위 두 테스트의 `@Covers`가 한 시나리오의 `Covers:` 안에 모두 있으면, 하네스는 두 테스트를 같은 시나리오 아래로 보고한다. `@DisplayName`은 자유.

시나리오 문서와 Acceptance Test 연결 규칙의 세부는 [`acceptance-test.md`](../standards/acceptance-test.md)에 둔다.

FE 테스트 계층은 [`front-end-testing.md`](../../app/docs/standards/front-end-testing.md)를 따른다. FE BDD 테스트는 Playwright `test.info().annotations.push(...)`에 `Requirement`/`Covers` literal 메타데이터를 남긴다. 하네스는 `npm run app:front-end-source-index`로 이 값을 읽고, 전체 Playwright JSON 결과(`app/front-end/test-results/e2e-results.json`)와 병합해 RED/GREEN/BLUE를 판정한다. 부분 Playwright 실행 결과(`app/front-end/test-results/e2e-results.partial.json`)는 디버깅용이며 하네스 입력이 아니다.

FE 구현에서 route/page를 추가하거나 변경하면 같은 구현 단위에서 route 기준 page mock story를 작성하거나 갱신한다. page mock story는 실제 page 컴포넌트를 `MemoryRouter`, mock auth provider, mock API provider처럼 필요한 최소 provider로 감싸 route 진입 화면을 Storybook에서 확인할 수 있게 만든다. 공통 UI primitive(`app/front-end/src/components/ui`) 또는 주요 화면 조각을 추가하거나 변경할 때도 Storybook story를 작성하거나 갱신한다. Storybook은 완료 판정의 직접 근거가 아니라 상태 카탈로그와 visual regression 기준 화면이므로, story에는 `parameters.harness.requirements`로 관련 요건을 연결하고 normal/disabled/loading/error/open/empty 같은 사용자가 관찰할 상태를 고정한다. Skeleton 단계에서는 story 목록만 승인받고 실제 `*.stories.tsx` 구현은 승인 후 작성한다.

## 테스트 리뷰 체크리스트

- 요건 카드의 모든 수용 기준이 `@Covers`로 연결되어 있는가?
- `@Covers` 문장이 수용 기준과 정확히 일치하는가?
- 모든 BDD 테스트의 `@Covers` AC가 같은 요건의 어떤 `.feature` 시나리오 `Covers:`에 포함되어 있는가? (`TEST_COVERS_NO_SCENARIO_COVERS` WARNING 없음)
- 시나리오 문서의 제목과 Given/When/Then이 업무 언어로 작성되었고 AC 문장을 그대로 복사하지 않았는가?
- 시나리오가 사용자 행위 단위로 잘 잘렸는지 (입력 변형/경계값마다 별도 시나리오로 폭증하지 않았는지)?
- 테스트 본문이 시나리오 문서의 전제·핵심 행위·기대 결과를 빠짐없이 실행하는가?
- 한 시나리오에 핵심 When이 여러 개로 묶여 흐름이 과도하게 커지지 않았는가?
- 정상, 예외, 경계 조건이 모두 시나리오로 반영되었는가?
- 목록 조회 API가 있으면 페이징 AC와 시나리오가 포함되어 있고, `content` 슬라이스와 `page`/`size`/`totalElements`/`totalPages`를 검증하는가?
- API 상태 코드, 응답 본문, 저장 상태가 필요한 만큼 검증되는가?
- API Acceptance Test가 `@ApiAcceptanceTest`를 사용하고, 인증이 검증 대상이 아닌 경우 `ApiRequestSupport`로 로그인 상태를 구성하는가?
- Given 데이터가 케이스 의도를 드러내며, UUID/토큰/JSON 반복이 테스트 본문을 가리지 않도록 fixture/helper로 정리되어 있는가?
- 테스트가 구현 세부사항이 아니라 사용자 결과와 API 계약을 검증하는가?
- FE 대상 요건이면 Playwright 테스트가 실제 사용자 행위, 주요 화면 표시, 권한/라우팅, 데스크톱 화면 또는 접근성 요구를 필요한 만큼 검증하는가?
- FE TDD 테스트가 class/style 세부값보다 상태별 UI 결과를 검증하는가?
- Storybook story가 공통 컴포넌트와 주요 화면 조각의 상태를 충분히 담는가?

리뷰 결과는 요건 카드의 `BDD 테스트 리뷰` 섹션에 요건 단위로 남긴다. 테스트 목록은 수기로 관리하지 않고 하네스 리포트에서 확인한다.

## 승인 기준

요건 카드는 다음 조건을 만족해야 `승인` 상태로 바꿀 수 있다.

- 열린 질문이 없다.
- 범위와 제외 범위가 명확하다.
- 수용 기준이 테스트 가능한 문장이다.
- 모든 수용 기준을 커버하는 BDD 시나리오 문서가 사용자 승인을 받았다.
- 승인된 시나리오 전체에 대해 BDD 테스트 코드 리뷰가 완료되었다.
- scope에 맞는 validate 명령에서 RED가 없다.
- FE 대상 요건이면 `cd app/front-end && npm run validate:full`이 성공한다.

초안 단계에서는 `BDD 테스트 리뷰` 결과를 `미완료`로 둔다. 시나리오 문서 승인과 Acceptance Test 작성·리뷰가 끝나기 전까지 요건 카드 상태는 `초안` 또는 `검토중`으로 유지한다.
