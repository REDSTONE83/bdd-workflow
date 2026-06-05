# Spring Boot Application

이 프로젝트는 `app/back-end` 아래의 Spring Boot 애플리케이션이다. 하네스 도구와 self-test는 `harness/`가 소유한다.

## 실행

```bash
./gradlew test
./gradlew generateOpenApiIndex
./gradlew previewSchema
```

루트에서 애플리케이션 검증을 실행한다.

```bash
npm run app:test
npm run app:trace -- --requirement REQ-XXX
npm run app:validate
```

애플리케이션 리포트와 인덱스는 `build/app` 아래에 생성된다. 하네스 자체 검증은 루트에서 `npm run harness:validate`를 사용한다.
