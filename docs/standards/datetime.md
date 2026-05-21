# 날짜 / 시간 표준

모든 시각 값은 UTC `Instant`로 저장하고, 표시 시점 변환은 클라이언트의 책임으로 한다. 서버는 타임존을 직접 다루지 않는다.

## 표준

- Java 타입: `java.time.Instant`
- DB 저장: UTC `TIMESTAMP` (밀리/마이크로초 정밀도는 DB 기본값을 따른다).
- API 직렬화: ISO-8601 (`2024-05-21T03:00:00Z`). Jackson 기본 설정이 그대로 만든다.
- API 입력: ISO-8601 with `Z` 또는 offset (`2024-05-21T12:00:00+09:00`). 양쪽 모두 즉시 `Instant`로 정규화된다.

`LocalDateTime`은 사용하지 않는다. `OffsetDateTime`/`ZonedDateTime`은 표시 직전 변환 외에는 도메인/Entity/DTO에 노출하지 않는다.

## Entity

```java
@Entity
@Table(name = "user_account")
public class UserAccount {

    // ...

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;
}
```

- 시각 필드는 `Instant` 타입만 쓴다.
- 모든 엔티티는 `created_at`, `updated_at` 컬럼을 갖는다. (`NOT NULL`)
- 도메인 의미상 시각이 한 번만 기록되는 필드(`deleted_at`, `published_at` 등)는 nullable로 둘 수 있다.

## 감사(audit) 컬럼

`created_at` / `updated_at`은 Spring Data JPA Auditing으로 자동 채운다.

```java
@EntityListeners(AuditingEntityListener.class)
public class UserAccount {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

- 애플리케이션 부트 클래스에 `@EnableJpaAuditing`을 추가한다.
- 수동으로 `Instant.now()`를 박지 않는다. 테스트가 시각 검증을 해야 하면 `Clock`을 빈으로 주입받아 교체한다.

## DTO

- Request/Response DTO에서도 `Instant`를 그대로 쓴다.
- Bean Validation은 `@PastOrPresent`, `@Future` 등 `Instant`를 인식하는 검증을 사용한다.
- 스웨거 노출은 `@Schema(format = "date-time")`을 명시한다.

## 시간 비교와 테스트

- 도메인 코드에서 `Instant.now()`를 직접 호출하지 않는다. `Clock` 빈을 주입받아 `Clock.instant()`를 호출한다.
- 테스트는 `Clock.fixed(Instant.parse("..."), ZoneOffset.UTC)`를 빈으로 교체해 결정적으로 만든다.
- 동등 비교는 `Instant`의 epoch 밀리/나노 정밀도 차이에 주의한다. 필요 시 `truncatedTo(ChronoUnit.MILLIS)`로 정규화한다.

## 표시(클라이언트 측)

- 서버는 KST 등 지역 시간을 응답에 포함하지 않는다.
- 클라이언트가 `Instant` 문자열을 받아 사용자 로컬 타임존으로 변환한다.

## 날짜 전용 도메인 값 예외

업무 의미가 "특정 일자"이고 시각/타임존이 의미를 갖지 않는 값은 `LocalDate`를 사용한다. 예: 마감일, 생일, 청구일.

- 타입: `java.time.LocalDate`
- DB 저장: `DATE` 컬럼
- API 직렬화: ISO `YYYY-MM-DD` (`2024-05-21`)
- Bean Validation: `@PastOrPresent`, `@FutureOrPresent` 등 `LocalDate` 호환 검증 사용
- 스웨거: `@Schema(format = "date", example = "2024-05-21")`
- 같은 도메인 안에서 동일 의미의 필드는 모두 `LocalDate`로 통일한다. 같은 의미인데 어떤 곳은 `Instant`, 어떤 곳은 `LocalDate`로 섞지 않는다.

`LocalDate`를 새로 도입할 때는 해당 요건 카드의 `의사결정 로그`에 "시간/타임존이 의미 없음 → LocalDate 채택" 근거를 남긴다. 모호하면 `Instant`로 두고 표시 단에서 날짜만 사용한다.

`LocalTime`은 사용하지 않는다. 시각만이 필요한 도메인은 거의 없고, 있으면 별도 의사결정으로 승격한다.

## 금지 사항

- `LocalDateTime`을 Entity/DTO에 사용하지 않는다. (지역 시간대 가정이 숨어 있어 추론을 흐린다.)
- `LocalDate`는 위 "날짜 전용 도메인 값 예외" 조건을 만족할 때만 사용한다. 시각/타임존이 조금이라도 의미 있으면 `Instant`를 쓴다.
- `Date`, `Calendar`, `Timestamp` 등 legacy 타입 사용 금지.
- `Instant.now()`/`LocalDate.now()` 직접 호출 금지. `Clock` 주입 후 `Clock.instant()` 또는 `LocalDate.now(clock)`을 호출한다.
- DB 컬럼을 `TIMESTAMP WITH TIME ZONE` 외의 지역 시간대 타임스탬프로 저장하지 않는다.

## 자동 검증 항목

- `previewSchema`: 시각 컬럼 타입이 `TIMESTAMP` 계열인지, 날짜 전용은 `DATE`인지 확인.
- (예정) `validateDateTimePolicy`: Entity/DTO 필드가 `Instant` 또는 carve-out `LocalDate`인지 검사 (`LocalDateTime` 발견 시 fail).

## 수동 리뷰 항목

- 새 시각 필드를 추가할 때 audit 컬럼 표준과 충돌하지 않는가
- 테스트가 `Clock` 빈 주입 없이 `Instant.now()`/`LocalDate.now()`에 의존하지 않는가
- API 응답 예시(`@Schema(example = ...)`)가 ISO-8601 Z 또는 `YYYY-MM-DD` 형식인가
- `LocalDate` 채택 시 요건 카드 의사결정 로그에 근거가 남았는가
