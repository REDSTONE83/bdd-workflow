# 런타임 설정 표준

런타임 설정은 Spring Boot 기본 설정과 프로젝트 소유 설정을 분리해 관리한다. 설정 키는 코드 계약의 일부이므로, 새 키를 추가할 때는 어느 컴포넌트가 읽고 어떤 환경에서 달라지는지 함께 정한다.

## 설정 prefix 소유권

- `app.*`는 이 저장소가 소유한 custom 설정 prefix다.
- `spring.*`, `server.*`, `management.*`, `logging.*`, `springdoc.*` 등 Spring Boot 또는 라이브러리가 소유한 prefix는 프로젝트 `@ConfigurationProperties` 타입에 바인딩하지 않는다.
- 새 프로젝트 소유 설정은 `app.<domain>.<purpose>` 형태로 둔다. Spring Boot나 라이브러리 prefix 아래에 프로젝트 전용 의미를 가진 키를 끼워 넣지 않는다.
- 라이브러리가 명시적으로 요구하는 설정 키는 해당 라이브러리 prefix를 그대로 사용한다.

## 프로젝트 소유 설정 바인딩

`app.*` 아래 설정 키는 원칙적으로 typed `@ConfigurationProperties` 클래스 또는 record에 바인딩한다.

- `application.yml`과 profile override 파일(`application-local.yml`, `application-test.yml`, `application-prod.yml`)의 `app.*` 키는 같은 properties 타입의 필드와 대응되어야 한다.
- profile 파일은 base 설정의 값을 환경별로 override한다. profile 파일에만 존재하는 새 `app.*` 키도 동일하게 typed properties 필드가 필요하다.
- 신규 코드에서 프로젝트 소유 설정을 읽을 때는 흩어진 `@Value("${app...}")` 대신 `@ConfigurationProperties`를 사용한다.
- 민감 값은 로컬/테스트 기본값만 저장소에 두고, 운영 값은 외부 설정으로 override한다.
- 프로젝트 소유 properties 타입을 새로 만들거나 수정할 때는 가능하면 `@ConfigurationProperties(ignoreUnknownFields = false)`를 사용한다. 기존 운영 설정과 충돌할 수 있으면 Change Set에서 전환 작업을 관리하고, 요건 카드는 전환 후 최종 설정 정책만 소유한다.

## 의도적 미바인딩 예외

`app.*` 아래 키를 애플리케이션 코드가 직접 읽지 않고 외부 런타임 또는 배포 계층이 소비해야 한다면 예외로 둘 수 있다. 이 경우 표준 문서 또는 요건 카드 의사결정 로그에 다음을 남긴다.

- 키 이름 또는 prefix
- 소비 주체
- 애플리케이션 코드에 바인딩하지 않는 이유
- local/test/prod 환경별 기본값 또는 override 방식

## Profile 설정

- 환경에 따라 동작이 달라지는 값은 코드 분기보다 profile 설정으로 표현한다.
- profile별 설정은 base `application.yml`에 공통 기본값을 두고, 필요한 값만 profile 파일에서 override한다.
- 보안 플래그, 외부 endpoint, secret, ttl처럼 환경 경계가 있는 값은 요건 카드의 범위 또는 의사결정 로그에 local/test/prod 정책을 남긴다.

## 자동 검증 항목

현재 하네스는 프로젝트 소유 설정 바인딩을 자동 검증하지 않는다. 향후 `validateStandards`에 `app.*` 키와 `@ConfigurationProperties(prefix = "app...")` 필드의 대응 여부를 검사하는 BE-* rule을 추가할 수 있다.

## 수동 리뷰 항목

- 새 설정 키가 프로젝트 소유 prefix(`app.*`)인지, Spring/라이브러리 prefix인지 구분되어 있는가
- `app.*` 키가 typed `@ConfigurationProperties`에 바인딩되어 있는가
- profile override 키가 base properties 타입의 필드와 대응되는가
- 운영 secret이나 운영 전용 값이 저장소에 고정되어 있지 않은가
- 의도적 미바인딩 키라면 소비 주체와 이유가 문서화되어 있는가
