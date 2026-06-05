# Java 코드 스타일 / Lombok 허용 범위

이 표준은 Java 코드 작성에서 **반복 제거 도구**(Lombok)의 허용/금지 범위를 정한다. 하네스는 API 계약·DB 스키마·표준 용어를 클래스/필드 애너테이션과 명시적 코드에서 읽기 때문에, 코드 생성 도구가 계약 의미를 가리면 정적 검사·추적성·리뷰 가능성이 떨어진다. 따라서 Lombok은 "코드 생성 표준"이 아니라 **반복 제거 도구**로만 제한적으로 허용한다.

다른 코드 생성 도구(AutoValue, Immutables 등)도 같은 원칙을 따른다. 이 문서가 명시적으로 허용하지 않은 코드 생성기는 사용하지 않는다.

## 한눈에 보는 표

| 대상 | 허용 | 금지 |
| --- | --- | --- |
| Spring Bean stereotype 보유 (`@Service`/`@RestController`/`@Controller`/`@Configuration`/`@Component`/`@Repository`/`@RestControllerAdvice`/`@ControllerAdvice`) | `@RequiredArgsConstructor`, `@Slf4j` | 그 외 Lombok 전부 |
| 비-PATCH DTO | `record` 우선, Lombok 사용 금지 | 모든 Lombok |
| PATCH DTO (class) | 명시적 setter/getter, Lombok 사용 금지 | 모든 Lombok |
| JPA Entity | 명시적 코드, Lombok 사용 금지 | 모든 Lombok |
| 그 외 모든 위치 (공통/유틸/예외 포함) | `@Slf4j` | `@RequiredArgsConstructor`, `@SneakyThrows`, `@Accessors`, `@UtilityClass`, `@Data`, `@Value`, `@Builder`, `@SuperBuilder`, `@AllArgsConstructor`, `@NoArgsConstructor` |
| 테스트 코드 (`src/test/java`) | 사용 금지 | 모든 Lombok |

## 의존성

Lombok은 컴파일 타임 도구로만 둔다. 런타임 의존성으로 넣지 않는다. **테스트 코드에서는 Lombok을 사용하지 않으므로 `testCompileOnly`/`testAnnotationProcessor`는 선언하지 않는다.**

```groovy
dependencies {
    compileOnly       'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

버전은 Spring Boot dependency management가 제공하는 값을 그대로 쓴다. 직접 버전을 박지 않는다.

테스트에서도 Lombok이 필요한 상황이 생기면 이 문서를 먼저 갱신하고 그때 test 의존성을 추가한다. 표준이 갱신되기 전 임시 도입은 허용하지 않는다.

## 규칙 상세

### Spring Bean stereotype 클래스

다음 stereotype 중 하나를 보유한 클래스에서만 `@RequiredArgsConstructor`를 허용한다.

- `@Service`, `@RestController`, `@Controller`, `@Configuration`, `@Component`, `@Repository`, `@RestControllerAdvice`, `@ControllerAdvice`

- `@RequiredArgsConstructor` 허용. `final` 의존성을 받는 생성자 boilerplate 제거 용도.
- `@Slf4j` 허용. `SLF4J Logger` 선언 boilerplate 제거 용도.
- 그 외 Lombok 애너테이션은 금지한다.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categories;
    // ...
}
```

stereotype을 갖지 않는 일반 클래스(공통 유틸, 예외, 헬퍼, argument resolver 등)는 `@RequiredArgsConstructor`도 금지다. 생성자를 직접 작성해 의존성/필드 초기화 의도를 명시한다.

### 비-PATCH DTO

- `record`를 우선 사용한다. Lombok이 필요한 경우는 없다.
- DTO 정규화/`@Schema`/Bean Validation은 record canonical constructor에 둔다 ([`api-contract.md`](./api-contract.md), [`validation.md`](./validation.md)).

### PATCH DTO

- `class`로 작성하되 Lombok을 사용하지 않는다 ([`api-contract.md`](./api-contract.md) PATCH 표준).
- 이유: `jackson-databind-nullable`는 setter 기반 역직렬화에 의존하고, 필드/setter에 `@JsonSetter`/Bean Validation/`@Schema`를 직접 명시해야 동작이 안정적이다. Lombok의 `@Setter`는 필드 레벨 Jackson 애너테이션을 setter로 옮겨주지 않는다.
- getter는 record-like `name()` 시그니처로 직접 작성한다. Lombok `@Getter`가 만드는 `getName()`은 사용하지 않는다.

### JPA Entity

- Lombok을 사용하지 않는다 ([`persistence-schema.md`](./persistence-schema.md)).
- 이유:
  - `@EqualsAndHashCode`는 JPA proxy/lazy 필드와 결합해 `LazyInitializationException`이나 N+1 같은 사고를 부른다. 식별자 동등성 규칙은 명시 코드여야 한다.
  - `@Setter`/`@Data`는 도메인 객체의 불변성 의도를 가린다. 상태 변화는 도메인 메서드(`rename`, `archive` 등)로 표현한다.
  - `@NoArgsConstructor`/`@AllArgsConstructor`는 JPA가 요구하는 `protected` no-arg constructor 규약을 가린다. 명시적으로 선언한다.
  - `@Builder`는 컬럼 단위 `@Requirement` 추적과 충돌한다.

### 공통/유틸리티 클래스

- `@SneakyThrows`는 어디서도 사용하지 않는다. 예외 코드 매핑 표준([`api-contract.md`](./api-contract.md) 오류 응답)과 정면 충돌하고, 예외 추적을 어렵게 한다.
- `@Accessors`는 어디서도 사용하지 않는다. `fluent=true`/`chain=true`는 record-like 호출과 섞이면 리뷰 비용이 커지고, 표준 getter/setter 규약과 충돌한다.
- `@UtilityClass`는 사용하지 않는다. 정적 helper는 `public final class` + `private` 생성자로 명시한다.

## 금지 애너테이션 목록

다음은 검증기가 자동으로 차단한다 (위치별 적용 범위 다름).

**전체 금지** (`L1`)

- `@Data`
- `@Value`
- `@Builder`
- `@SuperBuilder`
- `@AllArgsConstructor`
- `@NoArgsConstructor`
- `@SneakyThrows`
- `@Accessors`
- `@UtilityClass`
- `@FieldDefaults`

**Entity에서 추가 금지** (`L2`)

- `@Setter`
- `@Getter`
- `@EqualsAndHashCode`
- `@ToString`
- `@RequiredArgsConstructor`

**DTO에서 추가 금지** (`L3`)

- `@Setter`
- `@Getter`
- `@EqualsAndHashCode`
- `@ToString`
- `@RequiredArgsConstructor`

**Spring Bean stereotype 미보유 클래스에서 추가 금지** (`L4`)

- `@RequiredArgsConstructor`

`@Service`/`@RestController`/`@Controller`/`@Configuration`/`@Component`/`@Repository`/`@RestControllerAdvice`/`@ControllerAdvice` 중 하나도 갖지 않는 일반 클래스에 `@RequiredArgsConstructor`를 붙이면 L4 위반이다. 단, Entity는 L2, DTO는 L3가 더 구체적인 메시지로 먼저 보고한다.

## 새 Lombok 애너테이션 도입

새 Lombok 애너테이션을 도입하려면 다음 절차를 따른다.

1. 어디서 어떤 boilerplate를 줄이는지 명시.
2. 하네스 정적 검사·추적성·리뷰 가능성에 영향이 없음을 검증.
3. 이 문서의 허용 표와 금지 목록을 갱신.
4. 영향이 있는 요건 카드 `의사결정 로그`에 흔적을 남김.

## 자동 검증 항목

- `validateStandards`: BE-L1/BE-L2/BE-L3/BE-L4 룰이 위반된 클래스/필드를 보고한다 (`build/app/reports/back-end-standards-report.md`, finding JSON은 `build/app/findings/back-end-standards.findings.json`).
- `validateStandardsStrict`: 위반 시 빌드를 실패시킨다.

## 수동 리뷰 항목

- Service/Controller의 `@RequiredArgsConstructor` 사용이 필드 주입 패턴과 일관되는가
- PATCH DTO의 setter에 `@Schema`/Bean Validation 애너테이션이 누락되지 않았는가
- Entity의 식별자 equality/`hashCode` 규약이 도메인 의미와 일치하는가
