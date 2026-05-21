# API 계약 표준

API 명세는 Spring Boot 컨트롤러와 DTO 애너테이션에 둔다. 별도 OpenAPI yaml이나 API 카탈로그 문서는 사람이 직접 유지하지 않는다.

컨트롤러와 DTO의 패키지 위치는 [`package-structure.md`](./package-structure.md)를 따른다. 식별자/시각 타입 표준은 [`id-policy.md`](./id-policy.md)와 [`datetime.md`](./datetime.md)에 둔다.

## 컨트롤러

컨트롤러 메서드는 관련 요건을 명시한다.

```java
@Requirement("REQ-001")
@PostMapping("/signup")
public ResponseEntity<SignupResponse> signup(...) {
    ...
}
```

OpenAPI 설명은 컨트롤러와 DTO에 둔다.

- 컨트롤러: `@Operation`, `@ApiResponse`
- DTO: `@Schema`, Bean Validation

메서드 레벨 `@RequestMapping`을 사용할 때는 `method = RequestMethod.GET`처럼 HTTP method를 반드시 지정한다. 가능하면 `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`을 우선 사용한다.

## DTO

도메인 DTO(`SignupRequest`, `SignupResponse` 등)는 `{domain}/dto/` 패키지에 두고 클래스 레벨에 `@Requirement`를 명시한다. Entity 규칙과 동일하게 명시적으로 부여하며, `validateTerminology`가 카드별 finding을 정확히 attribute하기 위해 필요하다.

`ApiError`처럼 도메인 무관한 공통 응답 DTO는 `@Requirement`를 비워두고 `common/` 패키지에 둔다.

식별자 필드는 `UUID` 타입을 그대로 노출하고 `@Schema(format = "uuid")`로 표시한다. 시각 필드는 `Instant` 타입을 그대로 노출하고 `@Schema(format = "date-time", example = "2024-05-21T03:00:00Z")`로 표시한다.

## 오류 응답

전역 API 오류 응답과 검증 예외 처리는 `common` 패키지에 둔다.

- `common/ApiError.java`: API 오류 응답 DTO
- `common/ApiExceptionHandler.java`: Bean Validation 같은 전역 예외 응답 매핑

도메인 전용 예외를 별도 정책으로 매핑해야 할 때만 해당 도메인 `exception/` 패키지에 전용 handler를 둔다 ([`package-structure.md`](./package-structure.md)).

### ApiError 본문

오류 응답 JSON은 다음 필드를 가진다.

```json
{
  "code": "DUPLICATE_EMAIL",
  "message": "이미 가입된 이메일입니다.",
  "status": 409,
  "timestamp": "2024-05-21T03:00:00Z",
  "path": "/users/signup",
  "details": [
    { "field": "email", "code": "DUPLICATE", "message": "..." }
  ]
}
```

- `code`: 도메인 의미를 가진 머신 친화 식별자. 대문자 `SCREAMING_SNAKE_CASE`. (`DUPLICATE_EMAIL`, `CATEGORY_NOT_FOUND`)
- `message`: 사람이 읽는 메시지. i18n 도입 전까지 한국어 단일.
- `status`: HTTP 상태 코드 정수.
- `timestamp`: `Instant`, ISO-8601 Z.
- `path`: 요청 경로.
- `details[]`: 필드 단위 검증 실패 등 세부 사유. 단일 사유면 비워둘 수 있다.

`code`는 도메인 안에서 고유해야 하며, 같은 도메인의 동일 의미 오류는 같은 `code`를 재사용한다.

### 오류 코드 명명

- 형식: `{도메인}_{사유}` 또는 `{사유}` 두 형태를 허용한다 (`DUPLICATE_EMAIL`, `CATEGORY_NOT_FOUND`, `INVALID_REQUEST`).
- Bean Validation 실패의 `details[].code`는 어노테이션 이름을 그대로 노출하지 않고 표준 사유명으로 정규화한다.
- 도메인 예외 클래스명과 `code`는 1:1 매핑을 유지한다 (`DuplicateEmailException` ↔ `DUPLICATE_EMAIL`).

#### `details[].code` 매핑표

| Bean Validation / 상황 | `details[].code` |
| --- | --- |
| `@NotBlank`, `@NotEmpty` | `NOT_BLANK` |
| `@NotNull` | `NOT_NULL` |
| `@Size`, `@Length` | `OUT_OF_LENGTH` |
| `@Min`, `@Max`, `@Positive`, `@PositiveOrZero`, `@DecimalMin`, `@DecimalMax` | `OUT_OF_RANGE` |
| `@Pattern`, `@Email` | `INVALID_FORMAT` |
| `@Past`, `@PastOrPresent`, `@Future`, `@FutureOrPresent` | `OUT_OF_RANGE` |
| 알 수 없는 enum 값 / Jackson 파싱 실패 | `INVALID_FORMAT` |
| Jackson unknown field | `UNKNOWN_FIELD` |
| 허용 sort key 외 | `INVALID_FORMAT` |
| 본문 참조 ID가 부재·타인 자원 (예: `categoryId`) | 도메인 코드 (`INVALID_<FIELD>`) — `details[].code`가 아닌 최상위 `code`로 직접 |

매핑은 `common/ApiExceptionHandler`에 한 곳으로 모은다. 새 어노테이션 추가 시 위 표를 갱신한다.

### HTTP 상태 매핑

| 상황 | HTTP | code 예시 |
| --- | --- | --- |
| 입력 형식 위반 / Bean Validation 실패 / 잘못된 enum / **본문 참조 ID가 부재·타인 자원** | 400 | `INVALID_REQUEST`, `INVALID_<FIELD>` |
| 인증 누락/실패 | 401 | `UNAUTHORIZED` |
| 자기 자원 내에서 역할/스코프 권한 부족 | 403 | `FORBIDDEN` |
| **path variable 타깃 리소스가 부재 또는 타인 자원** | 404 | `<DOMAIN>_NOT_FOUND` |
| 유일성/상태 충돌 (중복, 동시 수정) | 409 | `DUPLICATE_<X>`, `<STATE>_CONFLICT` |
| 서버 내부 오류 (잡지 못한 예외) | 500 | `INTERNAL_ERROR` |

#### 직접 접근(404)과 본문 참조(400)는 다르다

권한과 존재를 판단하는 위치에 따라 응답이 갈린다.

- **Path variable로 지목한 타깃 리소스**가 부재이거나 다른 사용자 소유면 `404 <DOMAIN>_NOT_FOUND`. enumeration 방지를 위해 부재와 타인 자원을 구분하지 않는다.
- **요청 본문(또는 쿼리)에서 참조한 다른 도메인 리소스**가 부재이거나 다른 사용자 소유면 `400`이며 코드는 도메인 의미를 담는다 (`INVALID_<FIELD>`, 예: `INVALID_CATEGORY`). `details[].field`에 해당 본문 필드명을 채운다.
- 본문 참조에서 400을 쓰는 이유: 클라이언트가 잘못 만든 요청이라는 메시지가 더 자연스럽고, path variable과 달리 본문 참조는 enumeration이 비용 효율적이지 않다. (참고: REQ-002 `INVALID_CATEGORY` 결정.)

403은 단일 소유 모델에서는 거의 등장하지 않는다. 역할/스코프 기반 권한이 도입되는 경우에만 사용한다.

도메인이 이 정책을 벗어나려면 해당 요건 카드의 의사결정 로그에 근거를 남긴다.

### PATCH null 의미론

부분 갱신은 다음 규칙을 따른다.

- `PATCH /resources/{id}`만 부분 갱신에 사용한다. `PUT`은 전체 교체 의미로만 쓴다.
- 누락된 필드는 "변경 없음"이다.
- 명시적 `null`은 "해당 필드를 비운다"이다. 도메인이 비우기를 허용하지 않으면 400으로 거절한다.
- 패치 DTO 필드는 **`JsonNullable<T>`** (`org.openapitools.jackson.nullable.JsonNullable`) 로 누락과 명시적 `null`을 구분한다.

#### `JsonNullable<T>` 표준

의존성: `org.openapitools:jackson-databind-nullable` 의 **최신 안정 버전**을 사용한다. 구체 버전은 빌드 도구(Gradle version catalog 등) 한 곳에서 관리하며, 표준 문서에는 박지 않는다.

> 의존성 선언 방식은 Gradle 구성(version catalog, convention plugin, BOM 등)에 따라 달라지므로 `validate-standards`의 strict 규칙으로 직접 검증하지 않는다. 실제 누락은 `JsonNullable<T>` / `JsonNullableModule` 사용 코드의 컴파일과 테스트 실패로 확인한다.

`JsonNullableModule` 등록은 Jackson 구성 절을 참조한다.

OpenAPI/Swagger 표현 규칙은 다음과 같다.

- `@Schema(nullable = true)` — 명시적 `null`을 허용해 값을 비우는 의미일 때만 표기.
- `@Schema(requiredMode = NOT_REQUIRED)` 또는 표기 생략 — `JsonNullable.undefined()`(필드 누락)가 허용됨을 의미.
- `@Schema(example = ...)` — 일반 값 예시. `null`이 의미를 가질 때는 description에 명시한다.
- `default`는 표기하지 않는다. PATCH 미전송 시 기본값을 부여하지 않는다.

DTO는 **class로 작성하고 필드를 `JsonNullable.undefined()`로 초기화**한다. record 사용을 금지한다.

이유: `jackson-databind-nullable`는 setter/필드 주입 기반의 빈 역직렬화를 가정한다. constructor 파라미터(record canonical constructor 포함)로 받으면 미전송 필드가 `undefined`가 아니라 `null`로 들어와 "변경 없음"과 "비우기"를 구분할 수 없다. PATCH DTO 한정 제약이며, 비-PATCH DTO는 record를 그대로 쓴다.

PATCH DTO는 Lombok을 사용하지 않는다. setter와 getter를 직접 작성한다 ([`java-code-style.md`](./java-code-style.md) PATCH DTO 절). 필드 레벨 `@Schema`/Bean Validation을 Lombok이 setter로 옮겨주지 않기 때문이다.

```java
public class UpdateCategoryRequest {

    @Schema(description = "카테고리 이름", example = "업무")
    private JsonNullable<@NotBlank @Size(max = 50) String> name = JsonNullable.undefined();

    @Schema(description = "설명. null 전송 시 값 제거", example = "주중 업무 카테고리")
    private JsonNullable<@Size(max = 200) String> description = JsonNullable.undefined();

    public JsonNullable<String> name() { return name; }
    public JsonNullable<String> description() { return description; }

    public void setName(JsonNullable<String> name) { this.name = name; }
    public void setDescription(JsonNullable<String> description) { this.description = description; }
}
```

세 상태를 다음과 같이 구분한다.

| 클라이언트 전송 | `JsonNullable` 상태 | 의미 |
| --- | --- | --- |
| 필드 자체를 보내지 않음 | `JsonNullable.undefined()` | 변경 없음 |
| `"field": null` | `JsonNullable.of(null)` | 해당 필드를 비운다 |
| `"field": "값"` | `JsonNullable.of("값")` | 값으로 갱신 |

PATCH DTO를 새로 만들 때는 세 상태 모두를 검증하는 역직렬화 테스트를 함께 둔다. 라이브러리 동작이 환경에 따라 달라질 수 있어 회귀를 가드한다.

서비스에서의 분기:

```java
if (req.name().isPresent()) {
    String value = req.name().get();
    if (value == null) { /* 도메인이 null을 허용하지 않으면 400 */ }
    category.rename(value);
}
```

수동 ObjectNode/JsonNode 분기는 신규 코드에서 사용하지 않는다. 이미 작성된 코드는 마이그레이션 REQ로 정리한다.

### Jackson / ObjectMapper 구성

Jackson 구성은 **Spring Boot의 `Jackson2ObjectMapperBuilderCustomizer` Bean**으로 한 곳에서 관리한다. Boot가 자동 등록하는 모듈/설정을 유지한 채 위에 우리 규칙을 얹는다. `application.yml`의 `spring.jackson.*` 키와 raw `ObjectMapper` Bean 직접 생성은 사용하지 않는다.

```java
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder
            .modulesToInstall(new JsonNullableModule())                       // PATCH null 의미론
            .featuresToEnable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES) // 알 수 없는 필드 거절
            .serializationInclusion(JsonInclude.Include.NON_ABSENT);
    }
}
```

- `JavaTimeModule`, `WRITE_DATES_AS_TIMESTAMPS=false`는 Spring Boot가 자동 적용하므로 명시하지 않는다.
- 요청 본문에 알 수 없는 필드가 오면 400 `INVALID_REQUEST`로 거절한다.
- API 진화 시 deprecated 필드는 명시적으로 DTO에 유지하고, 제거할 때 한 릴리스 사이클의 deprecation 안내를 둔다.

### Pagination / Sorting 기본

목록 조회는 **예외 없이** 다음을 따른다. lookup, enum 목록, 작은 고정 컬렉션도 동일하게 페이징을 적용한다. (일관된 클라이언트 처리, 향후 데이터 증가 대비.)

- 쿼리 파라미터: `page` (0부터), `size` (기본 20, 최대 100), `sort` (`field,asc` 또는 `field,desc`).
- 컨트롤러 시그니처는 Spring Data `Pageable`을 받는다. (`@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)` 등으로 도메인 기본을 명시.)
- 응답 본문은 공통 DTO `PageResponse<T>`를 쓴다.
- Repository 조회 시그니처는 `Page<T> findAllBy...(... , Pageable pageable)` 형식이다. 메서드명에 OrderBy를 박지 않는다. ([persistence-schema.md](./persistence-schema.md) Repository 패턴.)
- 동률 정렬은 항상 `id` 오름차순으로 끊는다.
- 커서 기반 페이지네이션이 필요해지면 별도 표준으로 승격한다.

#### `PageResponse<T>` 공통 DTO

`common/PageResponse.java`에 정의한다. 모든 목록 API의 응답 타입은 `PageResponse<T>`다.

```java
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}
```

#### Sort key 화이트리스트

클라이언트가 임의 필드로 정렬하지 못하게 한다.

- 컨트롤러 또는 도메인 서비스가 **허용 sort key 집합**을 보유한다.
- 클라이언트가 보낸 `sort` 키가 화이트리스트에 없으면 400 `INVALID_REQUEST` (`details[].field=sort`, `code=INVALID_FORMAT`).
- API에 노출하는 sort key는 Entity 필드명과 동일하지 않아도 된다. 매핑이 필요하면 컨트롤러 레이어에서 변환한다. 예: API `created_at` → Entity `createdAt`.
- 허용 sort key와 도메인 기본 정렬은 요건 카드의 의사결정 로그에 명시한다.

```java
private static final Set<String> ALLOWED_SORT_KEYS = Set.of("createdAt", "name");
```

검증 유틸은 `common/SortKeys.java`처럼 한 곳에 둔다. 컨트롤러마다 흩뿌리지 않는다.

## 관련 표준

- [`auth.md`](./auth.md): 인증/행위자 식별, 401/403/404 운영
- [`validation.md`](./validation.md): DTO Bean Validation과 서비스 명세 검증 분담
- [`transaction.md`](./transaction.md): 컨트롤러→서비스 호출의 트랜잭션 경계와 부수효과
- [`persistence-schema.md`](./persistence-schema.md): Repository / Pageable / 인덱스
- [`java-code-style.md`](./java-code-style.md): Lombok 허용/금지 (Controller `@RequiredArgsConstructor` 허용, DTO 전체 Lombok 금지)

## 자동 검증 항목

- `validateHarness`: 컨트롤러의 `@Requirement` ID가 카드에 존재하는지, 카드의 수용 기준이 테스트로 커버되는지 검사.
- `generateHarnessSourceIndex`: JavaParser로 컨트롤러를 파싱해 source index를 만든다. 결과는 `back-end/build/harness/source-index.json`.

## 수동 리뷰 항목

- HTTP 메서드/상태 코드/오류 코드 정책이 요건 카드의 결정과 일치하는가
- path variable 타깃의 부재/타인 자원은 404, 본문 참조 ID의 부재/타인 자원은 도메인별 400(`INVALID_<FIELD>`)으로 응답되는가
- DTO의 Bean Validation이 수용 기준의 입력 정책을 반영하는가
- OpenAPI 설명이 사용자가 읽기에 충분한가
- PATCH 본문 처리에서 `JsonNullable<T>` 기반으로 누락과 명시적 `null`이 올바로 구분되는가
- 목록 API가 `Pageable`을 받아 `{content,page,size,totalElements,totalPages}` 형식으로 응답하는가
- 목록 정렬 기본값이 요건 카드 의사결정 로그에 명시되었는가
