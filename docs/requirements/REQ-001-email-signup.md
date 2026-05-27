# 요건 카드

요건 ID: REQ-001
제목: 이메일 회원 가입
우선순위: 높음
상태: 승인

## 사용자/목적

신규 사용자는 이메일과 비밀번호로 계정을 생성할 수 있어야 한다.

## 범위

- 이름, 이메일, 비밀번호를 입력해 계정을 생성한다.
- 이미 등록된 이메일은 다시 사용할 수 없다.
- 비밀번호는 최소 8자 이상이어야 한다.

## 표준 용어

- account.signup
- account.duplicateEmail
- user.account
- user.id
- user.name
- user.email
- user.password
- user.passwordHash

## 제외 범위

- 소셜 로그인
- 이메일 인증
- 비밀번호 복잡도 정책

## 수용 기준

- 유효한 정보이면 계정이 생성된다
- 중복 이메일이면 가입이 거절된다
- 비밀번호가 8자 미만이면 가입이 거절된다

## 의사결정 로그

- 결정일: 2026-05-20
  결정: 이번 범위에서는 이메일 인증을 제외한다.
  이유: 예제 하네스에서는 가입 API와 BDD 테스트 연결 구조를 설명하는 것이 목적이다.
  결정자: Product Owner, Tech Lead
  영향: 가입 성공 시 계정은 즉시 생성된 것으로 본다.

- 결정일: 2026-05-20
  결정: 비밀번호 정책은 최소 8자 검증만 적용한다.
  이유: 예제 하네스에서는 수용 기준과 Acceptance Test 연결을 단순하게 보여주는 것이 목적이다.
  결정자: Product Owner, Tech Lead
  영향: 특수문자, 숫자, 대소문자 조합은 검증하지 않는다.

- 결정일: 2026-05-27
  결정: 비밀번호는 8자 이상 72자 이하 ASCII 출력 가능 문자(U+0020 ~ U+007E)만 허용한다. 한글/이모지 등 멀티바이트 문자는 가입 시 거절한다.
  이유: BCrypt 해시 알고리즘은 72바이트까지만 의미 있게 사용한다. `@Size(max=72)` 만으로는 자바 글자 수 기준이라 한글 24자(=72바이트) 이상에서 BCrypt 가 보이지 않게 잘라먹는 위험이 남는다. 입력 자체를 ASCII printable 로 좁히면 글자 수와 바이트 수가 일치해 BCrypt 한계와 검증 한계가 정확히 같아지고, 다국어 비밀번호의 "보이지 않는 잘림" 위험이 사라진다.
  결정자: REDSTONE
  영향: `SignupRequest.password` 에 `@Pattern("^[\\x20-\\x7E]+$")` 를 추가한다. 위반은 400 `INVALID_REQUEST` + `details[].field=password`, `code=INVALID_FORMAT`. 로그인 화면/`LoginRequest` 에는 같은 제약을 두지 않는다 (이 결정 이전에 가입된 legacy 계정의 비밀번호 입력을 막지 않기 위함, BCrypt 가 비교 시점에 동일하게 72바이트로 잘라 비교한다).

## BDD 테스트 리뷰

- 시나리오 문서: docs/scenarios/REQ-001-email-signup.feature

- 리뷰일: 2026-05-20
  리뷰자: Product Owner, Tech Lead
  확인: 수용 기준 3개가 각각 `@Covers`와 `.feature` Covers: 블록으로 표현되었고, BDD 테스트의 `@Covers` AC가 모두 시나리오의 `Covers:`에 포함된다 (`TEST_COVERS_NO_SCENARIO_COVERS` 0건). 정상/중복/짧은 비밀번호 조건과 검증 실패 필드를 확인한다.
  결과: 승인

## 열린 질문

- 없음
