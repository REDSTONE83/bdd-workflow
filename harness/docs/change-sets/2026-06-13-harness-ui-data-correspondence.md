# Change Set: 2026-06-13 하네스 UI fixture와 실데이터 대응 보강

상태: 진행중
요청일: 2026-06-13
변경 유형: 하네스 개선, 표준 개정
영향 요건: REQ-031, REQ-032, REQ-033, REQ-037
논의 상태: 없음

## 요청 요약

- 하네스 UI fixture가 보여주는 데이터가 실제 하네스 생성 산출물(`trace.state.json`, `requirements.index.json`, `terminology.index.json`, `change-sets.index.json`)에서 매핑 가능한지 검토한 결과, 네 가지가 어떤 산출물에서도 만들 수 없음을 확인했다.
- 산출물 쪽을 보강해 UI가 발명한 필드 없이 실데이터로 대응 가능하게 만든다.
- 짝 애플리케이션 작업(요건 카드에 `상위 요건` 헤더 기입)은 [2026-06-13 요건 상위 관계 명시](../../../app/docs/change-sets/2026-06-13-requirement-parent-link.md)에서 추적한다.

## 작업 범위

- 요건 카드 표준에 `상위 요건` 헤더 필드를 추가한다. 계층(parent/child)을 `관련 요건`+`명세 역할` 휴리스틱으로 파생하지 않고 자식 카드가 부모를 명시 선언하게 한다.
- `index-requirements.mjs`가 `상위 요건`을 `parentRequirementIds`로 파싱하고, 수용 기준 항목에 카드 본문 줄 번호(`line`)를 부여한다.
- `validate-requirement-cards.mjs`가 `상위 요건` 참조의 존재 여부, 단일 부모 제약, 비활성 카드의 부모 금지, 순환 여부, 부모의 명세 역할(`상위 요건`)을 검증한다(`CARD-PARENT-REQ-UNKNOWN`, `CARD-PARENT-REQ-NOT-PARENT`, `CARD-PARENT-SELF`, `CARD-PARENT-MULTIPLE`, `CARD-PARENT-INACTIVE-FORBIDDEN`, `CARD-PARENT-CYCLE`).
- `evaluate-trace-state.mjs`가 `parentRequirementIds`를 전파하고 `childRequirementIds`를 역산하며, RED 카드에도 `blueBlockedBy`를 채우고, 수용 기준 `line`을 coverage row에 전파한다.
- `evaluate-trace-state.mjs`/`render-trace-report.mjs`의 `trace.state.json` `requirements[].file`을 절대 경로가 아니라 repo-relative 경로로 출력한다.
- `gate.mjs`가 데이터 계약의 게이트 요약 리포트(`build/{scope}/reports/gate-report.json`)를 생성한다.
- `data-contracts.md`에 `parentRequirementIds`/AC `line`/`childRequirementIds`/`blueBlockedBy`/상대경로/gate-report 생성 시점을 반영한다.

## 제외 범위

- 하네스 scope API/데이터 표면(`apiSurfaces`/`dataShapes`) 수집기 신설. 하네스 UI 서버 코드를 인덱싱하는 collector는 본 Change Set 범위 밖이며, 해당 탭은 비어 있는 상태를 정상으로 본다.
- 하네스 UI 서버의 명령 실행 라우트 구현. `/api/commands/run`은 계속 골격 상태(405)다.
- 시나리오/UI surface의 `status` 표시값 같은 표현 전용 파생값의 신규 산출물화.

## 완료 조건

- `상위 요건: REQ-XXX`를 가진 카드의 추적 상태에 `parentRequirementIds`가 들어가고, 부모 카드 추적 상태에 `childRequirementIds`가 역산되어 들어간다.
- 존재하지 않거나 `상위 요건`이 아닌 부모를 가리키면 카드 검사가 오류를 보고한다.
- 한 카드가 둘 이상의 `상위 요건`을 적거나, 대체됨/폐기 카드가 `상위 요건`을 가지거나, `상위 요건` 관계에 순환이 있으면 카드 검사가 오류를 보고한다.
- RED 카드의 추적 상태가 `blueBlockedBy`를 가진다.
- 수용 기준 항목과 coverage row가 카드 본문 줄 번호(`line`)를 가진다.
- `trace.state.json`의 `requirements[].file`이 repo-relative다.
- `build/app/reports/gate-report.json`과 `build/harness/reports/gate-report.json`이 게이트 실행마다 생성된다.
- `npm run harness:validate`와 `npm run app:validate`가 통과한다.

## 검증 명령

- `npm run harness:self-test`
- `npm run harness:validate`
- `npm run app:validate`
- `cd harness/ui && npm run test`

## 결정 로그

- 2026-06-13: 요건 계층은 `상위 요건` 명시 헤더로 추적한다. `관련 요건`+`명세 역할`+`제품 영역` 휴리스틱으로는 자식 여부를 파생할 수 없음을 REQ-026(카테고리 삭제 시 할 일 연결 해제) 반례로 확인했다. REQ-026은 제품 영역(todo)·명세 역할(원자)이 다른 할 일 자식과 같고 REQ-021과 상호 `관련 요건`이지만, 할 일 관리 기능의 생명주기 동작이 아니라 카테고리 삭제 정책의 부수효과라 REQ-021의 하위가 아니다.
- 2026-06-13: 계층의 단일 소스는 자식의 `상위 요건` 선언이다. 부모 카드는 자식을 나열하지 않고, `childRequirementIds`는 추적 판정기가 역산한다. 부모가 자식을 중복 나열하면 두 목록이 어긋날 수 있기 때문이다.
- 2026-06-13: `관련 요건`은 일반 상호 참조로 유지하고 계층 전용 의미를 부여하지 않는다. 기존 카드가 부모를 `관련 요건`에도 둔 상태를 강제로 제거하지 않는다.
- 2026-06-13: `blueBlockedBy`는 RED 카드에도 채운다. UI 요건 상세가 "왜 BLUE가 아닌가"를 RED 단계에서도 표시할 수 있어야 하기 때문이다. RED 자체는 `state` 값으로 드러나고, `blueBlockedBy`는 승인/열린 질문 같은 비-RED 차단 사유만 담는다.
- 2026-06-13: `trace.state.json`의 파일 경로는 데이터 계약의 "repo-relative" 규약을 따른다. 절대 경로 누출은 추적 산출물 이식성과 UI 링크 생성을 깨뜨린다.
- 2026-06-13: 게이트 요약 리포트는 `gate.mjs`가 게이트 실행마다 생성한다. UI는 이 파일을 읽기만 하고 카테고리 분류나 차단 여부를 자체 계산하지 않는다. REQ-010 단일 게이트 원칙을 유지한다.
- 2026-06-17: `상위 요건`은 단일 부모만 허용한다. 다중 부모는 UI 트리와 추적 판정의 대표 부모를 모호하게 하므로 `CARD-PARENT-MULTIPLE`로 차단한다.
- 2026-06-17: `상태: 대체됨` 또는 `상태: 폐기` 카드는 계층에서 제외한다. 완료 판정 대상이 아닌 카드가 부모/자식 트리에 남으면 현재 명세 구조가 왜곡되므로 `CARD-PARENT-INACTIVE-FORBIDDEN`으로 차단한다.
- 2026-06-17: `상위 요건` 관계는 순환할 수 없다. 추적 판정기가 부모에서 자식을 역산하고 UI가 계층으로 표시하므로 순환은 `CARD-PARENT-CYCLE`로 차단한다.

## 열린 논의

- 없음
