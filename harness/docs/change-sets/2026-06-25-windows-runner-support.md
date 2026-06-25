# Change Set: 2026-06-25 하네스 Windows 지원

상태: 완료
요청일: 2026-06-25
변경 유형: 하네스 개선, 빌드/실행 환경
영향 요건: 없음
논의 상태: 없음
관련 Change Set: app/docs/change-sets/2026-06-25-windows-build-tooling.md

## 요청 요약

- 하네스 러너(`harness/tools/run.mjs`)가 Windows 환경에서도 동작하도록 보완한다. Node `spawnSync`가 배치 파일을 직접 실행하지 못하는 문제, gradlew/npm 실행 방식, 포트 진단 명령의 OS 차이를 해결한다.

## 작업 범위

- gradle 실행을 플랫폼별로 분리한다. Windows에서는 gradlew.bat을 shell로 우회하지 않고 `java.exe -jar gradle-wrapper.jar`로 직접 실행해 cmd 인용 과정의 역슬래시 손상을 피한다. POSIX는 기존 `gradlew` 스크립트를 유지한다.
- `JAVA_OPTS`/`GRADLE_OPTS`를 보수적으로 분리해 java 인자로 전달한다. 큰따옴표 구간의 공백만 보존하고 역슬래시는 escape로 해석하지 않아 Windows 경로가 보존된다.
- npm 실행을 Windows에서 `npm.cmd`로 해석하고, 배치 파일일 때만 shell을 켜서 실행한다.
- 포트 점유 진단을 Windows(`netstat`)/POSIX(`lsof`)로 분기하고, 명령 부재 시 안전하게 메시지로 대체한다.
- harness/ui storybook 스크립트(`test:storybook`/`storybook`/`build-storybook`)를 cross-env로 전환하고, JUnit 출력 경로를 vitest 설정에서 읽어 POSIX 전용 `${VAR:-default}`를 제거한다.
- 순수 플랫폼 로직(`spawn-command.mjs`, `run-context.mjs`)을 분리해 `harness/tools/__tests__`에서 OS와 무관하게 Windows 분기를 단위 검증한다.
- 실제 Windows 실행 경로를 검증하는 `windows-latest` GitHub Actions 워크플로를 추가한다.

## 제외 범위

- POSIX 실행 동작 변경(기존 경로는 그대로 유지한다).
- 하네스 요건/시나리오/카드 변경(이번 작업은 러너 인프라 변경으로 요건이 없다).

## 완료 조건

- Windows에서 gradle이 `java.exe -jar`로 실행되고, POSIX는 `gradlew`로 실행된다. ✓
- `JAVA_OPTS`의 Windows 경로 역슬래시가 손상되지 않는다. ✓
- Windows에서 npm이 `npm.cmd`로 실행된다. ✓
- 포트 진단이 Windows/POSIX 모두에서 동작한다. ✓
- 플랫폼 분기 단위 테스트가 통과한다. ✓
- POSIX 게이트(`npm run repo:validate`)가 기존과 동일하게 통과한다. ✓

## 검증 명령

- `node --test harness/tools/__tests__/*.test.mjs`
- `npm run app:source-index`
- `npm run harness:validate`
- `npm run repo:validate`
- (CI) `.github/workflows/windows.yml` (windows-latest)

## 검증 결과

- 2026-06-25: `node --test harness/tools/__tests__/*.test.mjs` 통과(38 suites, 120 tests). Windows 분기(java.exe 조립, JAVA_OPTS 역슬래시 분리, npm.cmd, netstat 필터, 배치 인용) 포함.
- 2026-06-25: `npm run app:source-index` 통과. POSIX gradlew 경로로 BUILD SUCCESSFUL.
- 2026-06-25: Windows 조립 형태 점검. 역슬래시 `JAVA_OPTS`/`JAVA_HOME` 공백 경로에서 손상 없이 `java.exe -jar` 인자가 생성됨을 확인.
- 2026-06-25: harness/ui `npm run test:storybook` 통과(10 files, 78 tests). cross-env + vitest JUnit 설정 경로 확인.
- 2026-06-25: `npm run repo:validate` 통과(exit 0). app gate pass, harness gate pass, 요건 34건 모두 BLUE(GREEN 0, RED 0). POSIX 회귀 없음.
- 실제 Windows 실행은 `windows-latest` CI에서만 검증 가능하며, 머지 후 CI 실행으로 확인한다.

## 결정 로그

- 2026-06-25: Windows gradle은 gradlew.bat + shell 대신 `java.exe -jar`로 직접 실행한다. gradlew.bat은 내부적으로 동일하게 `java -jar gradle-wrapper.jar`를 호출하므로 충실한 대체이며, shell을 거치지 않아 cmd 인용에서 역슬래시 경로가 깨지지 않는다(Node가 인자를 그대로 전달).
- 2026-06-25: 러너 인프라는 요건 카드가 아니라 `harness/tools/__tests__` 도구 테스트로 검증한다. 기존 `run-context.mjs` 등의 선례를 따른다.
- 2026-06-25: 실제 Windows 실행은 로컬(macOS)에서 재현 불가하므로 `windows-latest` CI를 검증 수단으로 둔다.

## 열린 논의

- 없음
