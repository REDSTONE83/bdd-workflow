# 영속성 / DB 스키마 표준

DB 스키마는 JPA `@Entity` 클래스로 정의한다. 별도 ERD, DDL, 마이그레이션 스크립트를 사람이 직접 유지하지 않는다. 런타임 DDL은 `spring.jpa.hibernate.ddl-auto`가 Entity로부터 생성한다. Flyway/Liquibase 같은 외부 마이그레이션 도구는 별도 표준으로 도입되기 전까지 사용하지 않는다.

Entity 클래스는 `{domain}/domain/` 패키지에 둔다 ([`package-structure.md`](./package-structure.md)). 식별자는 [`id-policy.md`](./id-policy.md), 시각 컬럼은 [`datetime.md`](./datetime.md)를 따른다.

요건 단위 Skeleton 승인 전에 어디까지 작성할 수 있는지(`@Entity` 필드/컬럼/관계 + `previewSchema`까지 허용, Repository 쿼리 메서드 선언과 Service 업무 로직은 금지)는 [`../harness/requirement-authoring.md`](../harness/requirement-authoring.md)의 Skeleton 단계 산출물 범위를 따른다.

## Entity

```java
@Entity
@Table(name = "user_account")
@EntityListeners(AuditingEntityListener.class)
@Requirement({"REQ-001"})
public class UserAccount {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME) // 시간 정렬 UUID
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Requirement("REQ-001")
    @Column(nullable = false, length = 100)
    private String name;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Requirement("REQ-005") // 나중에 추가된 컬럼은 해당 요건만 표기
    @Column(name = "last_login_at")
    private Instant lastLoginAt;
}
```

작성 규칙:

- 클래스 레벨 `@Requirement`는 이 Entity에 손댄 모든 요건 ID를 합집합으로 적는다.
- 필드 레벨 `@Requirement`가 있으면 컬럼 단위 추적에 사용된다. 없으면 클래스 레벨 값으로 폴백한다.
- `@Column`의 `name`, `nullable`, `unique`, `length`는 schema preview가 그대로 읽는다. 정확하게 적는다.
- 모든 엔티티는 `created_at`, `updated_at` 컬럼(`Instant`, `NOT NULL`)을 가진다. 채우기는 Spring Data JPA Auditing이 담당한다 ([`datetime.md`](./datetime.md)).
- PK는 시간 정렬 UUID ([`id-policy.md`](./id-policy.md)). `GenerationType.IDENTITY`를 쓰지 않는다.
- Entity에는 Lombok을 사용하지 않는다 ([`java-code-style.md`](./java-code-style.md) Entity 절). 식별자 equality, no-arg constructor, 도메인 상태 변화는 명시 코드로 표현한다.

## 표준 스키마 속성

`@Column`의 단일 컬럼 속성 외에도 다음 속성은 표준으로 명시한다. 일부는 현재 `previewSchema`가 DDL에 반영하지 못하므로 수동 리뷰 항목으로 운영한다.

### 테이블 레벨 제약

- 복합 유니크는 `@Table(uniqueConstraints = { @UniqueConstraint(name = "uk_xxx", columnNames = {"a", "b"}) })`로 명시한다.
- 단일 컬럼 유니크는 `@Column(unique = true)`로 충분하지만, 이름이 필요하면 동일하게 `@Table(uniqueConstraints = ...)`로 옮긴다.
- 제약 이름은 `uk_<table>_<columns>`, `idx_<table>_<columns>`, `fk_<from>_<to>` 형식을 따른다.

### 인덱스

- 조회/정렬 패턴이 정해진 컬럼은 `@Table(indexes = { @Index(name = "idx_xxx", columnList = "a, b") })`로 명시한다.
- 정렬 컬럼이 합쳐 사용되는 경우 multi-column index를 같은 순서로 적는다.

### 외래 키 / 연관관계

- 모든 연관관계 컬럼은 `@JoinColumn(name = "...", nullable = ...)`을 명시한다.
- `nullable`은 도메인 의미에 맞게 적고, optional 관계가 아니라면 `false`를 명시한다.
- 기본 `fetch`는 `LAZY`. `EAGER`로 바꾸려면 의사결정 로그에 근거를 남긴다.
- FK 제약 이름은 `fk_<table>_<target>`. Hibernate 자동 생성 이름에 의존하지 않는다.

### 열거 / 코드

- `@Enumerated(EnumType.STRING)`을 표준으로 한다. `ORDINAL`은 금지.
- DB 컬럼 길이는 `@Column(length = ...)`로 가장 긴 enum 이름보다 여유 있게 잡는다.

### 수치 / 통화

- 통화/정밀 수치는 `BigDecimal`을 사용하고 `@Column(precision = ..., scale = ...)`을 명시한다.
- 카운터/식별 정수는 `long` 또는 `int`를 도메인 의미에 맞게 선택한다. 임의로 `Integer`/`Long` 래퍼와 primitive를 섞지 않는다.

### 텍스트 길이

- `String` 컬럼은 `@Column(length = N)`을 반드시 명시한다. 기본 길이(255)에 의존하지 않는다.
- 본문/메모처럼 긴 텍스트는 `@Lob` 또는 `@Column(columnDefinition = "TEXT")`로 명시한다.

## Repository 패턴

Repository는 `{domain}/repository/` 패키지에 두고 `JpaRepository`를 상속한다.

### 메서드명과 정렬

- 메서드명에 정렬을 박지 않는다. (`findAllByOwnerIdOrderByCreatedAtDesc` 같은 시그니처를 표준으로 두지 않는다.)
- 정렬은 `Pageable`이 책임진다. 컨트롤러에서 `@PageableDefault(... sort = "createdAt", direction = DESC)`로 도메인 기본을 명시한다 ([`api-contract.md`](./api-contract.md) Pagination).
- Repository 시그니처는 다음 형태가 표준이다.

```java
public interface TodoRepository extends JpaRepository<Todo, UUID> {

    Page<Todo> findAllByOwnerId(UUID ownerId, Pageable pageable);

    Page<Todo> findAllByOwnerIdAndCategoryId(UUID ownerId, UUID categoryId, Pageable pageable);

    Optional<Todo> findByIdAndOwnerId(UUID id, UUID ownerId);
}
```

- 단건 조회는 항상 소유권을 포함해 `findByIdAndOwnerId(...)` 형식이다. 컨트롤러/서비스가 `findById` 후 별도 소유권 비교를 하지 않게 한다 ([`auth.md`](./auth.md), [`validation.md`](./validation.md)).
- 비-cascade 연결해제 같은 일괄 업데이트는 `@Modifying @Query`로 명시한다. 사용 사례는 [`transaction.md`](./transaction.md).

### 인덱스 연결

`Pageable`의 정렬 키와 조회 조건은 `@Table(indexes = ...)`로 인덱스를 명시한다.

| 조회 | 인덱스 |
| --- | --- |
| `findAllByOwnerId(..., sort = createdAt DESC)` | `idx_<table>_owner_id_created_at_desc` (또는 `(owner_id, created_at)`) |
| `findAllByOwnerIdAndCategoryId(...)` | `idx_<table>_owner_id_category_id` |
| `findByIdAndOwnerId(...)` | PK + `owner_id` 단일 인덱스. PK 단독으로 충분하면 추가 인덱스를 두지 않는다. |

인덱스 명명 규칙은 위 [인덱스](#인덱스) 절을 따른다.

### preview 도구의 한계

현재 `app/back-end/tools/preview-schema.mjs`는 위 항목 중 `@Column`의 단일 속성만 DDL에 반영한다. 다음 항목은 preview에 출력되지 않으므로 수동 리뷰가 필요하다.

- `@Table(uniqueConstraints = ...)`
- `@Table(indexes = ...)`
- `@JoinColumn(name = ...)` 및 FK 제약 이름
- `@Enumerated`로 인한 컬럼 길이
- `@Column(precision = ..., scale = ...)`

preview 도구 확장은 별도 항목으로 다룬다. 표준 자체는 위 속성을 모두 명시할 것을 요구한다.

## 구현 전 스키마 검토

구현 전에 schema preview로 생성될 DDL을 검토하고 사용자에게 확인을 받는다.

```bash
cd app/back-end
./gradlew previewSchema
```

결과는 `build/app/schema-preview.sql`에 떨어진다. 컬럼마다 어느 요건에서 도입됐는지 주석으로 남는다. 이 산출물은 Entity가 생성할 스키마의 미리보기이며, 그대로 적용되는 마이그레이션 파일은 아니다. preview를 확인하고 사용자 승인을 받은 뒤 구현으로 넘어간다.

Entity 변경이 수용 기준에 영향을 주면 요건 카드의 `의사결정 로그`에 흔적을 남긴다.

## 자동 검증 항목

- `previewSchema`: Entity로부터 DDL 미리보기 생성.
- `npm run app:source-index`: Entity 클래스/필드의 `@Requirement`를 source index로 수집.
- `npm run app:validate`: Entity의 `@Requirement` ID가 카드에 존재하는지 검사.
- `validateStandards` S7: 비-cascade 연결해제 같은 일괄 업데이트가 서비스 반복 `save`로 구현된 흔적을 warning으로 보고한다.

## 수동 리뷰 항목

- 컬럼 nullability, 길이, 인덱스가 요건 카드의 결정과 일치하는가
- 컬럼 단위 `@Requirement`가 변경 이력을 충분히 반영하는가
- `@Table(uniqueConstraints/indexes)`, `@JoinColumn`, `@Enumerated`, precision/scale 표기가 누락되지 않았는가 (preview에 출력되지 않음)
- 제약/인덱스 이름이 표준 명명 규칙(`uk_`, `idx_`, `fk_`)을 따르는가
- Repository 메서드명에 OrderBy가 박혀 있지 않고 `Pageable`로 정렬을 받는가
- `findById`만 쓰지 않고 `findByIdAndOwnerId` 형태로 소유권을 같이 거는가
