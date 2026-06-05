# 패키지 / 레이어 구조 표준

도메인별로 같은 패키지를 두는 원칙은 그대로지만, 한 도메인 안에서는 역할별 하위 패키지로 명시적으로 분리한다.

## 표준 구조

```text
com/example/bddworkflow/{domain}/
  controller/
    {Domain}Controller.java
  dto/
    {Domain}Request.java
    {Domain}Response.java
  service/
    {Domain}Service.java
  domain/
    {DomainEntity}.java
  exception/
    {Domain}Exception.java
  repository/
    {Domain}Repository.java
```

## 패키지별 역할

### `controller/`

HTTP 엔드포인트만 둔다. 컨트롤러는 요청 검증, 서비스 호출, 응답 매핑만 한다. 비즈니스 로직을 두지 않는다.

- `@RestController`, `@RequestMapping`이 붙은 클래스만 들어온다.
- `@Requirement`는 클래스 또는 메서드에 명시한다 (`app/docs/standards/api-contract.md`).

### `dto/`

요청/응답 DTO만 둔다. Bean Validation, `@Schema`, `@Requirement`는 DTO 클래스에 둔다.

- 도메인 객체(`domain/` 패키지의 클래스)를 DTO로 직접 노출하지 않는다. 변환은 service 또는 정적 매퍼에서 한다.
- 도메인 무관한 공통 응답(`ApiError`)은 `common/` 패키지에 둔다.

### `service/`

유스케이스 처리를 둔다. 트랜잭션 경계, 도메인 객체 조립, repository 호출이 여기서 일어난다.

- 도메인 규칙을 표현하기 어려운 경우 `domain/`의 도메인 객체 메서드로 위임한다. 서비스가 거대해지면 도메인이 빈약한 신호다.

### `domain/`

도메인 엔티티와 도메인 값 객체를 둔다. JPA `@Entity`도 여기에 둔다.

- 영속성과 도메인을 분리하지 않는다. 예제 규모에서는 `@Entity` 자체가 도메인 모델이다.
- Entity 작성 규칙은 `app/docs/standards/persistence-schema.md`를 따른다.

### `exception/`

도메인 예외만 둔다.

- `RuntimeException`을 상속하는 도메인 의미 예외(`DuplicateEmailException` 등)만 들어온다.
- 전역 HTTP 매핑은 `common/ApiExceptionHandler.java`에서 처리한다 (`app/docs/standards/api-contract.md`).
- 도메인 전용 매핑이 필요할 때만 같은 `exception/` 패키지에 전용 `*ExceptionHandler.java`를 둔다.

### `repository/`

영속성 포트와 구현을 둔다.

- 인터페이스(`JpaRepository` 상속 또는 도메인 포트)는 `repository/`에 둔다.
- 예제 구현도 기본적으로 H2/JPA 기반 repository를 사용한다. 대체 어댑터가 필요하면 테스트 전용 설정에서 명시적으로 분리한다.

## 공통 패키지

```text
com/example/bddworkflow/
  common/
    ApiError.java
    ApiExceptionHandler.java
  harness/
    Requirement.java
  {domain}/
    ...
```

- `common/`: 전역 API 오류 응답과 검증 예외 매핑.
- `harness/`: 운영 코드가 참조하는 하네스 애너테이션.

## 금지 사항

- 같은 클래스 파일에 controller, service, repository를 동시에 두지 않는다.
- DTO를 `domain/`에 두지 않는다. 도메인 엔티티를 `dto/`에 두지 않는다.
- 도메인 예외를 `domain/` 또는 `service/`에 두지 않는다.
- 새 도메인을 추가할 때 위 6개 하위 패키지 외 임의 패키지명을 만들지 않는다. 필요한 경우 표준 갱신 절차(`app/docs/standards/README.md`)를 거친다.

## 자동 검증 항목

- `npm run app:source-index`: 도메인별 클래스 위치를 source index로 수집한다.
- (예정) `validatePackageLayout`: 클래스가 표준 하위 패키지에 위치하는지 검사. 도입 전에는 수동 리뷰로 본다.

## 수동 리뷰 항목

- 컨트롤러에 비즈니스 로직이 새지 않았는가
- 서비스가 도메인 객체 호출 대신 절차 코드만으로 비대해지지 않았는가
- 예외가 도메인 의미를 표현하는지, 단순 HTTP 매핑용으로만 쓰이는지
