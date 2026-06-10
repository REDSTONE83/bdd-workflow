# Change Set: 2026-06-09 Storybook 사용자 흐름 설명 가이드

상태: 완료
요청일: 2026-06-09
변경 유형: 표준 개정
영향 요건: REQ-005, REQ-011, REQ-012, REQ-013, REQ-016, REQ-017, REQ-018, REQ-019, REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
논의 상태: 없음

## 요청 요약

- Skeleton 단계의 Storybook story가 화면 요소와 상태뿐 아니라 사용자 흐름 설명까지 포함하도록 작성 가이드를 보강한다.
- 애플리케이션 story 설명 정합 작업은 `app/docs/change-sets/2026-06-09-storybook-flow-description-standard.md`에서 추적한다.

## 작업 범위

- `harness/docs/requirement-authoring.md`의 Skeleton 산출물 범위와 FE Storybook 작성 절차에 Docs 설명 기준을 추가한다.
- Storybook Docs 설명에는 범위 섹션을 두지 않고, 검토 범위는 요건 카드의 `UI Skeleton`과 `Storybook 계약`에서 관리하도록 명시한다.
- Docs 개요에는 하위 상태 story를 모두 캔버스로 펼쳐 렌더링하지 않고, 상태 설명은 텍스트 목록에서, 이름 붙은 story 상태 화면은 좌측 story 목록에서 개별 확인하도록 명시한다.
- 열린 대화상자 story가 Docs 본문을 덮는 경우 대표 canvas와 컴포넌트 속성을 생략하고 이름 붙은 story에서 실제 화면을 확인하도록 명시한다.
- Storybook Docs에서 Markdown 순서 목록과 글머리표가 보이도록 기준을 명시한다.
- Storybook Docs 설명은 한국어 업무 용어를 우선 쓰도록 기준을 명시한다.
- `parameters.harness.requirements` 연결, 이름 붙은 story 상태, `build-storybook` 검증 기준은 기존 정책을 유지한다.

## 제외 범위

- 하네스 collector/validator/gate 로직 변경.
- 요건 카드 상태 전환.
- Storybook 설명 필수 구조의 자동 검증 도입.

## 완료 조건

- Skeleton 작성 가이드에서 Storybook Docs 설명에 화면 목적, 주요 요소, 사용자 흐름, 관찰 포인트를 포함하되 범위 섹션은 제외하도록 명시한다.
- Docs 개요에서 하위 상태 컴포넌트가 모두 나열되지 않되 상태 설명은 확인 가능하도록 기준을 명시한다.
- 열린 대화상자 Docs 개요는 화면 덮개와 컴포넌트 속성 표가 본문 검토를 방해하지 않아야 한다.
- 사용자 흐름의 순서 번호와 주요 요소의 글머리표가 Docs에서 보이도록 기준을 명시한다.
- Storybook 설명에서 사용자가 읽는 문장은 영어 혼용을 줄이고 쉬운 한국어 용어를 우선 사용하도록 기준을 명시한다.
- 앱 표준과 하네스 작성 절차가 같은 방향을 가리킨다.

## 검증 명령

- 문서 변경이므로 별도 자동 검증 없음.

## 결정 로그

- 2026-06-09: Storybook 설명 품질은 우선 수동 리뷰 기준으로 둔다. 이름 붙은 story와 requirement metadata 누락 검사는 기존 하네스 검증을 유지한다.
- 2026-06-09: Storybook Docs 본문에는 범위 선언 섹션을 두지 않는다. 사용자가 읽는 Docs는 화면 책임과 흐름에 집중하고, 범위 관리는 요건 카드와 Change Set으로 분리한다.
- 2026-06-09: Docs 개요의 하위 상태 전체 canvas 렌더링은 제거한다. 상태 설명은 텍스트 목록으로, 상태별 화면은 이름 붙은 story로 확인한다. Storybook build와 source-index가 통과했고 Docs 본문에서 상태 설명 목록이 표시됨을 확인했다.
- 2026-06-09: 애플리케이션 Storybook 정합 작업에서 Docs 개요 압축 후 `npm run build-storybook`과 `npm run source-index`가 통과해 작성 가이드와 실제 story 설명 구조가 일치함을 확인했다.
- 2026-06-09: 열린 대화상자가 Docs 본문을 덮는 경우 `parameters.harness.docs.omitPrimaryCanvas = true`와 `parameters.harness.docs.omitComponentProperties = true`로 Docs 개요 대표 canvas와 컴포넌트 속성을 생략하고, 실제 대화상자 화면은 이름 붙은 story에서 확인하도록 기준을 추가했다.
- 2026-06-09: Storybook Docs 설명의 사용자 흐름 번호가 Tailwind reset으로 사라지지 않도록 Markdown 목록 표시 보존 기준을 추가했다.
- 2026-06-09: Storybook Docs 설명은 영어 혼용 대신 대화상자, 여는 버튼, 동작, 입력 항목, 양식 전체 경고 안내 같은 한국어 업무 용어를 우선 쓰도록 기준을 추가했다.
- 2026-06-09: 작성 가이드 본문과 Skeleton 체크리스트의 경로 화면 모의 story, 상태명, 상호작용 모의 구현, 시각 스냅샷 기준선 표현을 같은 한국어 중심 기준으로 정리했다.

## 열린 논의

- 없음
