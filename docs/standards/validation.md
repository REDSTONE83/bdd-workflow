# 입력 검증 / 정규화 표준

검증은 두 계층으로 나눈다.

- **DTO 레이어 (Bean Validation)**: 구문/타입 규칙. 입력만 봐서 판정 가능한 모든 것. **정규화도 이 단계에서 끝낸다.**
- **서비스 레이어 (도메인 명세)**: 중복/존재/소유권/상태/비즈니스 규칙. 도메인 상태를 조회해야 판정 가능한 것.

두 계층은 책임이 겹치지 않게 한다.

- Bean Validation을 통과한 입력만 서비스에 도달하므로, **서비스는 입력 형식을 다시 검증하지 않는다.**
- 서비스는 입력을 다시 trim/lowercase 하지도 않는다. 정규화 결과만 받는다.

## DTO 레이어

### 어노테이션 표준

- `@NotNull` — 필수 객체 필드.
- `@NotBlank` — 공백 아닌 문자열. trim 의미 포함.
- `@Size(min, max)` — 길이/사이즈 범위.
- `@Pattern(regexp = ...)` — 형식. 이메일은 `@Email`.
- `@Email`, `@Positive`, `@PositiveOrZero`, `@Min`, `@Max`, `@PastOrPresent`, `@FutureOrPresent` 등 표준 어노테이션 우선.
- 도메인 enum은 DTO 필드 타입을 enum 자체로 받는다. Jackson이 알 수 없는 값을 400으로 거절한다.

### 적용 위치

```java
public record CreateCategoryRequest(
    @NotBlank @Size(max = 50)
    @Schema(description = "카테고리 이름", example = "업무")
    String name,

    @Size(max = 200)
    @Schema(description = "설명")
    String description
) {}
```

- 컨트롤러는 `@Valid` 또는 `@Validated`로 활성화한다.
- 검증 실패는 `MethodArgumentNotValidException` → 전역 핸들러에서 `400 INVALID_REQUEST` + `details[]`로 변환한다.

### `JsonNullable<T>` 필드의 검증

PATCH DTO에서 `JsonNullable<T>` 안의 값에도 Bean Validation을 적용할 수 있다. PATCH DTO는 **class + 필드 초기화**로 작성한다 (record 금지). 이유와 예시는 [`api-contract.md`](./api-contract.md) `JsonNullable<T>` 표준을 참조한다.

```java
@Setter
public class UpdateCategoryRequest {
    private JsonNullable<@NotBlank @Size(max = 50) String> name = JsonNullable.undefined();
    private JsonNullable<@Size(max = 200) String> description = JsonNullable.undefined();
    // getters ...
}
```

- `JsonNullable.undefined()` 상태는 검증을 건너뛴다 (변경 없음).
- `JsonNullable.of(null)` 상태에서 내부 어노테이션이 `@NotNull`을 요구하면 검증 실패로 400을 반환한다. 도메인이 null 할당을 허용하지 않으면 `@NotBlank` 등을 박는다.
- `JsonNullable.of(value)` 상태에서는 일반 Bean Validation이 그대로 적용된다.

## 서비스 레이어

서비스가 책임지는 검증과 응답 매핑:

| 항목 | 위치 | 응답 |
| --- | --- | --- |
| **path target의 부재/타인 소유** (예: `GET /categories/{id}`의 `{id}`) | 서비스 단건 조회 (`findByIdAndOwnerId`) 실패 | `404 <DOMAIN>_NOT_FOUND` |
| **본문/쿼리 참조 ID의 부재/타인 소유** (예: 요청 본문의 `categoryId`) | 서비스가 참조 확인 후 실패 | `400 INVALID_<FIELD>` + `details[].field` |
| **유일성 제약 위반** (중복) | 서비스가 검사 또는 DB unique 제약 충돌 | `409 DUPLICATE_<X>` |
| **도메인 상태 머신 위반** | 서비스가 상태 검사 | `409 <STATE>_CONFLICT` 또는 도메인 코드 |
| **자기 자원 내 역할/스코프 부족** | 서비스가 권한 검사 | `403 FORBIDDEN` (단일 소유 모델에서는 거의 없음) |

핵심: 서비스가 던지는 예외는 path 타깃인지 본문 참조인지에 따라 **다른 예외 타입**으로 분리한다. 핸들러가 `<DOMAIN>NotFoundException` → 404, `Invalid<FIELD>Exception` → 400으로 매핑한다.

근거와 상세는 [`api-contract.md`](./api-contract.md) "직접 접근(404)과 본문 참조(400)는 다르다" 절.

## 정규화 (normalize)

정규화는 **DTO record의 canonical constructor**(또는 Jackson custom deserializer) **한 곳에서**, Bean Validation 실행 전에 수행한다. 컨트롤러/서비스/도메인 로직 어디서도 다시 정규화하지 않는다. (`@Size` 같은 어노테이션은 정규화된 값에 적용되어야 의미가 일치한다.)

```java
public record CreateCategoryRequest(
    @NotBlank @Size(max = 50) String name,
    @Size(max = 200) String description
) {
    public CreateCategoryRequest {
        name = trimToNull(name);                       // canonical constructor
        description = trimToNull(description);
    }
}
```

- record canonical constructor에서 정규화한 뒤 Bean Validation이 그 결과에 적용된다. (`@Valid`는 정규화 이후의 record 인스턴스를 검증한다.)
- 정규화 유틸은 `common/Strings.java` 한 곳에 둔다.

```java
public static String trimToNull(String s) {
    if (s == null) return null;
    String t = s.trim();
    return t.isEmpty() ? null : t;
}
```

### 문자열 정규화 규칙

- **trim**: 모든 문자열 필드는 양 끝 공백 제거. 결과가 빈 문자열이면 `null`로 통일 (`trimToNull`). 빈 문자열을 도메인에서 의미 있게 다루지 않는다.
- **대소문자**: 이메일은 canonical constructor에서 `toLowerCase(Locale.ROOT)`. 식별자/외부 키처럼 대소문자 의미가 없는 값도 동일.
- **공백**: 양 끝만 trim. 내부 공백/줄바꿈은 보존한다. 다중 공백 압축이 필요하면 도메인 카드 의사결정 로그에 명시 후 같은 위치에서 처리한다.

### 대소문자 무시 비교 (중복/검색)

표시는 원형을 유지하지만 비교는 대소문자 무시로 해야 하는 경우 (예: 카테고리 이름):

- 저장은 원형. 비교는 Repository에서 `LOWER(...)` 또는 정규화 사본 컬럼을 둔다.
- 어느 방식을 쓰는지는 도메인 카드 의사결정 로그에 명시한다.
- 정규화 사본을 컬럼으로 두면 unique 인덱스를 그 컬럼에 건다.

## Bean Validation 실패 응답

전역 핸들러는 다음 형식으로 응답한다 ([`api-contract.md`](./api-contract.md) ApiError 본문).

```json
{
  "code": "INVALID_REQUEST",
  "message": "요청 검증에 실패했습니다.",
  "status": 400,
  "timestamp": "2024-05-21T03:00:00Z",
  "path": "/categories",
  "details": [
    { "field": "name", "code": "NOT_BLANK", "message": "이름은 비어 있을 수 없습니다." }
  ]
}
```

- `details[].code`는 표준화된 사유명: `NOT_BLANK`, `NOT_NULL`, `OUT_OF_RANGE`, `INVALID_FORMAT`, `OUT_OF_LENGTH` 등.
- 매핑 표는 `common/ApiExceptionHandler`에 둔다. Bean Validation 어노테이션 이름을 그대로 노출하지 않는다 (`Size` → `OUT_OF_LENGTH`).

## 자동 검증 항목

- `validateStandards` C4: 모든 컨트롤러 메서드의 RequestBody DTO에 `@Valid` 또는 `@Validated`가 붙어 있는지 검사한다.
- `validateStandards` D7: `*Request` DTO의 `String` 필드/컴포넌트에 Bean Validation 어노테이션이 없으면 warning으로 보고한다. 타입 사용 위치의 `JsonNullable<@Size ... String>`도 declaration line 기준으로 확인한다.
- `validateStandards` S6: 서비스 메서드가 `normalizeX(String)` 또는 `validateX(String)` 형태이면 입력 형식 검증/정규화가 서비스로 밀린 것으로 보고 warning으로 알린다. 도메인 상태 조회가 필요한 검증이면 수동 리뷰로 예외 여부를 판단한다.

## 수동 리뷰 항목

- DTO에 적절한 Bean Validation이 명시되었는가
- 정규화(trim, lowercase 등)가 DTO record canonical constructor 한 곳에서만 수행되는가
- 중복/존재/소유권 검증이 서비스 계층에 있는가
- path 타깃 실패는 404, 본문 참조 실패는 400 `INVALID_<FIELD>`로 분리되어 있는가 (예외 클래스 분리 포함)
- Bean Validation 실패가 `INVALID_REQUEST` + `details[]`로 응답되는가
- `details[].code`가 표준 사유명으로 정규화되어 있는가
