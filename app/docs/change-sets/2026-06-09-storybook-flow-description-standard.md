# Change Set: 2026-06-09 Storybook 사용자 흐름 설명 표준

상태: 완료
요청일: 2026-06-09
변경 유형: 표준 개정
영향 요건: REQ-005, REQ-011, REQ-013, REQ-016, REQ-017, REQ-018, REQ-019, REQ-022, REQ-023, REQ-024, REQ-025, REQ-027
논의 상태: 없음

## 요청 요약

- Storybook Skeleton 검토 시 화면 요소와 상태뿐 아니라 사용자가 확인할 흐름 설명을 Docs에 풍부하게 표시한다.
- 표준과 작성 가이드를 먼저 갱신한 뒤 기존 story 설명을 같은 형식으로 정리한다.

## 작업 범위

- FE UI/테스트 표준에 Storybook Docs 설명 구조를 추가한다.
- Storybook 전역 Docs 개요가 컴포넌트 설명, 대표 story 설명, 상태 설명 텍스트 목록을 본문에 렌더링하되 하위 상태 story canvas를 전부 펼치지 않도록 preview 설정을 갱신한다.
- 열린 대화상자 story가 Docs 본문을 덮지 않도록 필요한 Docs 개요에서는 대표 canvas와 컴포넌트 속성을 생략한다.
- Storybook Docs 전용 스타일로 Markdown 순서 목록과 글머리표를 보존한다.
- 경로/화면, 대화상자/입력 양식, 목록, 앱 셸, 공통 기본 컴포넌트 story의 설명을 사용자 흐름과 관찰 포인트 중심으로 보강한다.
- Storybook 설명 문장의 영어 혼용을 줄이고 한국어 업무 용어를 우선 사용한다.
- Storybook Docs 설명에서는 범위 섹션을 제거하고, 검토 범위는 요건 카드와 Change Set에서 관리한다.
- story의 `parameters.harness.requirements` 연결과 이름 붙은 story 상태는 기존 계약을 유지한다.

## 제외 범위

- 요건 카드 수용 기준 문장 변경.
- FE BDD `Covers` 문장 변경.
- 시각 회귀 기준선 도입.
- 실제 API 연동 또는 route swap 변경.

## 완료 조건

- Storybook 설명 표준이 문서화된다.
- 기존 주요 story가 화면 목적, 주요 요소, 사용자 흐름, 관찰 포인트를 드러내며 범위 섹션을 포함하지 않는다.
- Docs 개요가 하위 상태 story를 모두 캔버스로 나열하지 않고, 상태 설명은 텍스트 목록으로 보여준다.
- 열린 대화상자 Docs 개요가 본문을 덮는 화면 덮개와 컴포넌트 속성 표 없이 읽힌다.
- 사용자 흐름의 순서 번호와 주요 요소의 글머리표가 Storybook Docs에서 보인다.
- 주요 story 설명에서 사용자가 읽는 문장은 한국어 용어 중심으로 표시된다.
- `npm run build-storybook`이 통과한다.

## 검증 명령

- `npm run build-storybook`
- `npm run source-index`
- `npm run typecheck`
- `npm run lint`

## 결정 로그

- 2026-06-09: Skeleton 단계의 Storybook 설명은 한 줄 상태 설명에 머물지 않고, 사용자가 어떤 순서로 조작하고 무엇을 확인해야 하는지까지 포함한다.
- 2026-06-09: Storybook 설명 보강은 AC 의미를 바꾸지 않는 문서/검토 표면 개선으로 취급하며, `Covers`나 요건 상태는 변경하지 않는다.
- 2026-06-09: Storybook 기본 DocsPage에서 설명 블록이 검토 의도대로 보이도록 전역 Docs 개요 순서를 명시한다.
- 2026-06-09: Storybook Docs 본문에서는 범위 섹션을 제거한다. 검토 범위와 승인 조건은 요건 카드와 Change Set에서 관리한다.
- 2026-06-09: 범위 섹션 제거와 Docs 개요 압축 후 `npm run build-storybook`, `npm run typecheck`, `npm run lint` 통과. `npm run source-index` 결과 story 79개, BDD test 70개, issue 0건.
- 2026-06-09: Docs 개요에서 모든 하위 상태 story를 펼치는 것은 중복과 스크롤 비용이 크므로 제거한다. 상태 설명은 텍스트 목록으로 보여주고, 상태별 화면 검토는 좌측 story 목록의 이름 붙은 story로 수행한다. Storybook Docs 본문에서 `STORIES` 섹션이 사라지고 `상태 설명` 목록과 사용자 흐름/관찰 포인트가 유지됨을 확인했다.
- 2026-06-09: 첫 story가 열린 대화상자인 Docs 개요는 `parameters.harness.docs.omitPrimaryCanvas = true`와 `parameters.harness.docs.omitComponentProperties = true`로 대표 canvas와 컴포넌트 속성을 생략한다. 대화상자 화면 자체는 이름 붙은 story에서 유지해 시각 검토 대상을 잃지 않는다.
- 2026-06-09: Tailwind reset이 Storybook Docs Markdown 목록 표시를 지우지 않도록 `.storybook/preview.css`에서 Docs 범위의 `ol`/`ul` 목록 표시를 복구한다.
- 2026-06-09: Storybook 설명에서 영어 혼용 표현을 대화상자, 여는 버튼, 동작, 입력 항목, 양식 전체 경고 안내, 비활성화/처리 중 같은 한국어 업무 용어로 정리한다.
- 2026-06-09: 표준과 작성 가이드도 같은 기준으로 점검해 경로 화면 모의 story, 대화상자, 입력 양식, 상태 설명, 글머리표, 시각 기준선 같은 한국어 중심 표현으로 정리한다.

## 열린 논의

- 없음
