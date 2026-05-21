# 트랜잭션 / 부수효과 표준

쓰기 경계와 부수효과는 **서비스 메서드** 단위로 관리한다. 컨트롤러와 Repository는 트랜잭션을 직접 열지 않는다.

## 경계

- 트랜잭션 어노테이션은 **서비스 메서드**에 단다. 클래스 레벨에 `@Transactional`을 박아 모든 메서드를 휘감지 않는다.
- 읽기 전용 메서드는 `@Transactional(readOnly = true)`.
- 쓰기 메서드는 `@Transactional`. (전파/격리는 기본값을 사용한다.)
- 한 비즈니스 단위 = 한 서비스 메서드 = 한 트랜잭션이 기본이다. 여러 서비스를 묶어야 하는 경우 호출 측 서비스에 트랜잭션을 둔다.

```java
@Service
public class TodoService {

    @Transactional(readOnly = true)
    public ListTodosResponse list(UUID actorId, Pageable pageable) { ... }

    @Transactional
    public CreateTodoResponse create(UUID actorId, CreateTodoRequest req) { ... }
}
```

## 도메인 부수효과

### 회원가입 시 기본 카테고리 시드

회원가입 트랜잭션 안에서 신규 사용자에 대해 기본 카테고리(예: "기본")를 함께 생성한다.

- 시드는 `UserService`의 가입 메서드(서비스 메서드 = 트랜잭션 1개) 안에서 카테고리 도메인 서비스를 호출해 수행한다.
- 시드 실패는 가입 트랜잭션을 함께 롤백시킨다.
- 도메인 간 호출은 같은 트랜잭션을 공유한다 (`Propagation.REQUIRED` 기본).

### 카테고리 삭제 시 Todo 처리: 비-cascade 연결해제

카테고리가 삭제되면 해당 카테고리에 묶인 Todo는 **삭제되지 않고 `categoryId`를 `null`로 변경**한다 (소위 "고아 처리" 또는 "비분류").

- JPA `cascade = CascadeType.REMOVE` 또는 DB `ON DELETE CASCADE`를 사용하지 않는다.
- 카테고리 삭제 서비스 메서드 내부에서 명시적으로 Todo의 `categoryId`를 `null`로 업데이트한 뒤 카테고리를 삭제한다.
- 두 작업은 같은 트랜잭션 안에서 일어난다.
- 일부 실패 시 전체 롤백한다 (Todo 일부만 null로 바뀌고 카테고리는 그대로 남는 상태를 만들지 않는다).

```java
@Transactional
public void delete(UUID actorId, UUID categoryId) {
    Category category = categoryRepository.findByIdAndOwnerId(categoryId, actorId)
        .orElseThrow(() -> new CategoryNotFoundException(categoryId));
    todoRepository.unlinkCategory(category.getId());          // UPDATE todo SET category_id = NULL WHERE ...
    categoryRepository.delete(category);
}
```

이 정책은 REQ-003 의사결정 로그와 일치한다.

## 외부 호출 / 메시징

- 외부 HTTP 호출, 메일 발송, 메시지 큐 publish는 같은 트랜잭션 안에서 직접 수행하지 않는다.
- 트랜잭션 안에서는 이벤트를 발행하고, 트랜잭션 커밋 후에 발송하는 패턴(`ApplicationEventPublisher` + `@TransactionalEventListener(phase = AFTER_COMMIT)`)을 사용한다.
- 본 저장소는 아직 외부 부수효과가 없다. 도입 시 이 절을 확장한다.

## Lazy 로딩 / 트랜잭션 누수

- 컨트롤러는 Entity를 직접 반환하지 않는다. 항상 DTO로 변환해 반환한다 ([`api-contract.md`](./api-contract.md), [`package-structure.md`](./package-structure.md)).
- View 단에서 Lazy proxy를 만지는 일이 없으므로 `OpenEntityManagerInViewFilter`는 비활성화한다.

```yaml
spring:
  jpa:
    open-in-view: false
```

## 예외와 롤백

- `RuntimeException`은 기본적으로 트랜잭션을 롤백한다. 커스텀 예외는 `RuntimeException`을 상속한다.
- 체크 예외는 도메인에서 사용하지 않는다. 도메인 예외는 모두 unchecked.
- `@Transactional(noRollbackFor = ...)`은 도메인 의미가 명확한 경우에만 사용한다. 사용 시 의사결정 로그에 근거를 남긴다.

## 자동 검증 항목

- `validateStandards` S1/S2/S3: 서비스 공개 메서드의 메서드 레벨 `@Transactional`, 클래스 레벨 금지, 읽기 메서드의 `readOnly = true`를 검사한다.
- `validateStandards` S7: `detach`/`unlink`/`clear`/`remove` 계열 일괄 연결해제 메서드가 `findAll` 후 반복 `save` 패턴이면 warning으로 보고한다. 비-cascade 연결해제는 Repository의 `@Modifying @Query` 벌크 업데이트로 구현한다.

## 수동 리뷰 항목

- 쓰기 메서드에 `@Transactional`, 읽기 메서드에 `@Transactional(readOnly = true)`가 명시되었는가
- 도메인 부수효과(시드, 연결해제 등)가 같은 트랜잭션 안에서 수행되는가
- `CascadeType.REMOVE` / DB cascade가 표준이 금지하는 영역에서 쓰이지 않았는가
- 외부 호출이 트랜잭션 안에서 직접 수행되지 않는가
- `OpenEntityManagerInViewFilter`가 비활성화되어 있는가
