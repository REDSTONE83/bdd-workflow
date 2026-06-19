# 요건 카드

요건 ID: REQ-013
제목: 이메일 회원 가입 화면
우선순위: 높음
상태: 대체됨
요건 종류: 기능
명세 역할: 구현 슬라이스
대상 시스템: application
제품 영역: auth
품질 속성: none
검증 수준: static
관련 요건: REQ-001
대체 요건: REQ-001

## 사용자/목적

이 카드는 구현 순서 때문에 분리됐던 이메일 회원 가입 화면 명세를 보존한다. 이메일 회원 가입의 canonical 명세 원천은 `REQ-001 이메일 회원 가입`이다.

## 범위

- `/signup` 화면, 화면 검증, 가입 성공 후 `/login` 이동, 인증 사용자 redirect 명세는 `REQ-001`로 병합했다.
- 이 카드는 새 구현이나 새 테스트의 연결 대상이 아니다.

## 표준 용어

- account.signup
- user.email

## 제외 범위

- 신규 화면 동작 정의
- 신규 테스트 또는 FE metadata 연결

## 수용 기준

- (STATIC) 이메일 회원 가입 화면 명세는 REQ-001 이메일 회원 가입으로 대체된다

## 의사결정 로그

- 결정일: 2026-06-02
  결정: 구현 순서 때문에 분리됐던 이메일 회원 가입 화면 카드를 `REQ-001 이메일 회원 가입`으로 병합하고, 본 카드는 `대체됨`으로 닫는다.
  이유: 회원 가입 API와 회원 가입 화면은 같은 사용자 목표를 만족하는 구현 표면이므로 독립 REQ로 유지하지 않는다.
  결정자: Product Owner, Tech Lead
  영향: 본 카드의 상세 AC, Scenario, Test, FE page/story metadata는 `REQ-001`로 이동한다. 본 카드는 `대체 요건: REQ-001`만 유지한다.

## 수용 테스트 리뷰

시나리오 문서: `docs/scenarios/REQ-001-email-signup-screen.feature`

### 요건 Skeleton 승인 이력

- 승인일: 2026-06-02
  검증 설계: 본 카드는 대체 카드이므로 새 검증 설계를 소유하지 않는다.
  API Skeleton: 해당 없음.
  DB Skeleton: 해당 없음.
  화면/라우팅 Skeleton: 해당 없음. 기존 화면 명세는 `REQ-001`로 병합했다.
  검사기 Skeleton: 해당 없음.
  추적 정책: 본 카드는 `INACTIVE` 상태로 남고, 새 테스트나 FE metadata는 연결하지 않는다.
  검증: `REQ-001` 단일 카드 trace에서 병합 결과를 확인한다.
  승인자: Product Owner, Tech Lead
  Skeleton 결과: 승인

### 테스트 리뷰

- 리뷰일: 2026-06-02
  리뷰자: Product Owner, Tech Lead
  확인: 본 카드는 대체 카드이며 새 실행 테스트를 소유하지 않는다.
  결과: 승인

## 열린 질문

- 없음
