# 소스 요건 연결 표준

앱 API/DB/UI 설계 표면은 요건 카드의 수작업 섹션이 아니라 소스 코드와 테스트 metadata의 요건 ID 연결에서 생성한다. 새 구현은 이 문서의 위치에 `REQ-XXX`를 붙이고, `npm run app:source-index`, `npm run app:openapi-index`, `npm run app:front-end-source-index` 결과로 trace에서 확인한다.

## 공통 원칙

- 요건 ID는 `REQ-XXX` 형식만 사용한다.
- 하나의 소스 표면이 여러 요건을 직접 구현하면 모든 요건 ID를 함께 적는다.
- 상위 요건 ID는 통합 여정이나 공통 화면 shell처럼 그 상위 성과를 직접 구현하거나 검증할 때만 붙인다. 원자 요건의 화면/테스트가 같은 기능 묶음에 속한다는 이유만으로 상위 ID를 반복하지 않는다.
- `상태: 대체됨` 또는 `폐기` 카드에는 새 소스 연결을 추가하지 않는다. 대체된 구현은 canonical 요건 ID로 옮긴다.
- 수용 기준 문장은 카드 원문, `.feature`의 `Covers:`, 백엔드 `@Covers`, Storybook/live `covers` 값이 정확히 일치해야 한다. AC 마커 `(API)/(UI)/(E2E)/(STATIC)`는 `Covers` 값에 넣지 않는다.

## 백엔드 API 설계

Controller method에는 해당 API operation을 소유하는 요건을 `@Requirement`로 붙인다.

```java
@Requirement("REQ-022")
@PostMapping("/todos")
public ResponseEntity<TodoResponse> create(...) {
    ...
}
```

DTO class에는 요청/응답 schema를 소유하는 요건을 붙인다. DTO field가 특정 요건의 계약값이면 field에도 `@Requirement`를 붙일 수 있다.

```java
@Requirement("REQ-022")
public record CreateTodoRequest(...) {
}
```

OpenAPI 설명은 Controller/DTO 애너테이션에서 생성한다. 사람이 별도 API 목록을 카드에 유지하지 않는다.

## DB 설계

JPA Entity class에는 해당 table을 소유하는 요건을 `@Requirement`로 붙인다. 특정 column이 한 요건의 핵심 계약이면 field에도 `@Requirement`를 붙인다.

```java
@Entity
@Requirement("REQ-022")
public class Todo {
    @Requirement("REQ-027")
    private boolean completed;
}
```

Repository는 요건별 query 정책을 직접 구현할 때만 `@Requirement`를 붙인다. 단순 Spring Data 기본 CRUD 상속에는 요건 ID를 반복하지 않는다.

## 백엔드 수용 테스트

백엔드 Acceptance Test class에는 검증 대상 요건을 `@Requirement`로 붙이고, test method에는 카드 AC 원문을 `@Covers`로 붙인다.

```java
@Requirement("REQ-022")
class TodoCreateApiAcceptanceTest {
    @Test
    @Covers("유효한 정보이면 할 일이 생성된다")
    void createsTodo() {
        ...
    }
}
```

한 test method가 여러 AC를 검증하면 `@Covers({ ... })`를 사용한다. 보조 단위 테스트에는 `@Covers`를 붙이지 않는다.

## 프런트엔드 UI 설계

route/page/component 파일의 선두 주석에 `@Requirement`를 둔다. source index는 literal 주석을 읽어 UI 설계 표면을 만든다.

```tsx
/**
 * @Requirement REQ-023
 */
export function TodosPage() {
  ...
}
```

여러 원자 요건을 한 컴포넌트가 직접 제공하면 쉼표로 나열한다.

```tsx
/**
 * @Requirement REQ-022, REQ-024
 */
```

단순 primitive, layout helper, test utility처럼 특정 요건의 설계 표면이 아닌 파일에는 요건 ID를 붙이지 않는다.

## Storybook UI 검토와 수용 테스트

Storybook story는 UI 설계 검토 표면이자 `(UI)` AC의 실행 테스트가 될 수 있다. AC 커버리지에 포함할 story는 `tags: ["test"]`와 `parameters.harness`를 둔다.

```ts
export const Empty: Story = {
  tags: ["test"],
  parameters: {
    harness: {
      requirements: ["REQ-023"],
      covers: ["할 일이 없으면 빈 상태 안내가 보인다"],
    },
  },
  play: async ({ canvasElement }) => {
    ...
  },
}
```

문서용 상태 story는 `requirements`만 둘 수 있지만, `covers`가 있으면 사용자 관찰 결과를 `play`에서 단언해야 한다.

## live E2E

상위 요건의 `(E2E)` AC는 live Playwright spec metadata로 연결한다. `Requirement`는 상위 요건을 직접 가리키고, `Covers`는 상위 카드의 AC 원문과 일치해야 한다.

```ts
test.info().annotations.push(
  { type: "Requirement", description: "REQ-021" },
  { type: "Covers", description: "사용자는 가입 후 할 일을 생성하고 목록에서 확인할 수 있다" },
)
```

live E2E는 API mock을 사용하지 않고 실 백엔드와 Vite proxy를 통과한다.

## 검증

- `npm run app:source-index`: 백엔드 `@Requirement`, Entity/DTO/Test 연결을 수집한다.
- `npm run app:openapi-index`: OpenAPI operation과 schema를 생성한다.
- `npm run app:front-end-source-index`: FE route/page/story/test metadata를 수집한다.
- `npm run app:trace -- --requirement REQ-XXX`: 단일 요건의 생성 API/DB/UI 설계 표면과 AC 커버리지를 확인한다.
