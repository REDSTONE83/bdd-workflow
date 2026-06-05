# ID 표준

모든 도메인 엔티티의 식별자는 단일 표준을 따른다. 내부 PK와 외부 노출 식별자를 분리하지 않는다.

## 표준

- 타입: `java.util.UUID`
- 알고리즘: **시간 정렬 UUID** (time-ordered, Hibernate `@UuidGenerator(style = TIME)` 기본).
- 생성기: Hibernate `@UuidGenerator(style = UuidGenerator.Style.TIME)`. 외부 라이브러리 추가 없이 사용한다.
- 생성 시점: 엔티티 영속화 시점에 Hibernate가 부여한다. 애플리케이션 레이어에서 미리 만들지 않는다.
- DB 컬럼: DB 네이티브 UUID 타입 (또는 16바이트 바이너리). 컬럼명은 `id`.
- API 직렬화: 하이픈 포함 소문자 문자열 (`018f4b5e-7c2b-7a3d-9c01-1a2b3c4d5e6f`).

시간 정렬 UUID는 PK가 시간 순으로 단조 증가에 가까워 B-Tree 인덱스 페이지 분할 부담을 줄이고 시간 기반 범위 쿼리에 유리하다. RFC 9562 v7 규격을 엄격히 따르지는 않는다. 표준 명칭은 "시간 정렬 UUID"이며, v7으로 표기하지 않는다. v7 규격이 필요해지면 별도 의사결정 로그와 라이브러리(예: `uuid-creator`) 도입 검토로 승격한다.

## Entity 작성

```java
@Entity
@Table(name = "user_account")
@Requirement({"REQ-001"})
public class UserAccount {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME) // 시간 정렬 UUID
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    // ...
}
```

- `@GeneratedValue(strategy = GenerationType.IDENTITY)`를 사용하지 않는다. ID는 Hibernate `@UuidGenerator`가 부여한다.
- `id` 필드의 `@Requirement`는 엔티티 자체의 요건과 일치하므로 보통 클래스 레벨 `@Requirement`로 폴백한다.

## DTO / API

- Request DTO에 `id`를 받지 않는다. 클라이언트가 ID를 결정하지 않는다.
- Response DTO에는 `UUID id` 필드를 그대로 둔다. Jackson 기본 직렬화가 표준 형식을 만든다.
- 경로 변수는 `/{id}` 형태로 받고 컨트롤러 시그니처는 `UUID id`로 선언한다.

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> get(@PathVariable UUID id) { ... }
```

## 외래 키

외래 키도 동일하게 `UUID`다. 별도 변환 컬럼을 두지 않는다.

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "owner_id", nullable = false)
private UserAccount owner;
```

## 시드 / 테스트 데이터

- 시드 데이터에 ID를 박아두지 않는다. 시작 시점에 생성된 UUID를 그대로 쓴다.
- 테스트에서 ID를 비교해야 하는 경우 `assertThat(response.id()).isNotNull()` 또는 서비스가 반환한 ID를 그대로 비교한다. 고정 UUID 리터럴을 테스트에 박지 않는다.

## 금지 사항

- BIGINT 자동 증가 PK 사용 금지.
- UUIDv4 사용 금지. (예측 불가능성보다 시간 정렬을 우선한다.)
- 표준 명칭에 "UUIDv7"이라고 적지 않는다. Hibernate `Style.TIME`은 v7과 규격이 다르므로 잘못된 약속을 피한다.
- 외부용 ID와 내부 PK를 분리해 두 개 두지 않는다.
- API 응답에서 ID를 정수로 노출하지 않는다.

## 자동 검증 항목

- `previewSchema`: PK 컬럼 타입이 UUID인지 확인 (생성 DDL에서 육안 확인).
- (예정) `validateIdPolicy`: 모든 `@Entity`의 `@Id` 필드가 `UUID`인지 검사.

## 수동 리뷰 항목

- 외래 키 관계가 같은 UUID 타입을 유지하는가
- 테스트가 고정 UUID 리터럴에 의존하지 않는가
- API 응답 스키마(`@Schema`)에 `format = "uuid"`가 명시되었는가
