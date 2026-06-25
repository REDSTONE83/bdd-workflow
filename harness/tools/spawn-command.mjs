import path from 'node:path';

// Windows에서 cmd.exe가 특별 취급하는 토큰을 감싸야 하는지 판정하는 문자 집합.
const WINDOWS_QUOTE_PATTERN = /[\s"&|<>^()]/;

// 배치 파일로 간주하는 확장자. Node의 spawn/spawnSync는 이 파일들을 shell 없이 직접 실행하지 못한다.
const BATCH_EXTENSIONS = new Set(['.bat', '.cmd']);

// gradlew.bat가 부트스트랩 JVM에 항상 넘기는 기본 옵션. (set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m")
const DEFAULT_JVM_OPTS = ['-Xmx64m', '-Xms64m'];

// 대상 플랫폼에 맞는 path 모듈을 고른다. platform 파라미터로 동작이 결정되는 함수가
// 호스트 OS와 무관하게 올바른 구분자(Windows 역슬래시)를 만들도록 보장한다.
function pathForPlatform(platform) {
    return platform === 'win32' ? path.win32 : path.posix;
}

// 커맨드가 Windows 배치 파일인지 확장자로 판정한다.
export function isBatchFile(command) {
    if (typeof command !== 'string') return false;
    return BATCH_EXTENSIONS.has(path.extname(command).toLowerCase());
}

// cmd.exe로 넘길 토큰을 안전하게 감싼다. 공백/메타문자가 없으면 그대로 두고,
// 있으면 큰따옴표로 감싸 하나의 인자로 유지한다. 내부 큰따옴표는 쌍따옴표("")로 이스케이프한다.
// (경로·gradle 인자에는 큰따옴표가 나타나지 않지만 방어적으로 처리한다.)
export function quoteWindowsArg(token) {
    const value = String(token);
    if (value !== '' && !WINDOWS_QUOTE_PATTERN.test(value)) return value;
    return `"${value.replace(/"/g, '""')}"`;
}

// 배치 파일을 spawnSync로 실행하기 위한 커맨드/인자/shell 설정을 만든다.
// Windows에서 배치 파일일 때만 shell을 켜고, shell 실행에서 공백이 든 경로가
// 분해되지 않도록 토큰을 인용한다. 그 외 환경에서는 기존 동작(shell 미사용)을 그대로 유지한다.
export function resolveSpawn(command, args = [], platform = process.platform) {
    if (platform === 'win32' && isBatchFile(command)) {
        return {
            command: quoteWindowsArg(command),
            args: args.map(quoteWindowsArg),
            shell: true
        };
    }
    return { command, args, shell: false };
}

// Windows에서 npm 런처는 npm.cmd(배치 파일)다. spawnSync가 .cmd를 직접 실행하지 못하므로
// .cmd로 해석해 resolveSpawn의 배치 파일 경로(shell + 인용)를 타게 한다. 그 외 환경은 'npm' 그대로.
export function npmCommand(platform = process.platform) {
    return platform === 'win32' ? 'npm.cmd' : 'npm';
}

// JAVA_OPTS / GRADLE_OPTS 같은 JVM 옵션 문자열을 개별 옵션으로 분리한다.
// 보수적으로 동작한다: 큰따옴표로 묶인 구간의 공백만 보존하고, 역슬래시(\)는 절대
// escape 문자로 해석하지 않는다. 따라서 JAVA_OPTS 안의 Windows 경로(C:\Users\me\.gradle,
// "C:\Program Files\Java")가 손상되지 않고 그대로 java.exe 인자로 전달된다.
export function splitJvmOpts(raw) {
    if (typeof raw !== 'string') return [];
    const tokens = [];
    let current = '';
    let inQuotes = false;
    const flush = () => {
        if (current.length > 0) tokens.push(current);
        current = '';
    };
    for (const char of raw) {
        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (!inQuotes && /\s/.test(char)) {
            flush();
            continue;
        }
        current += char;
    }
    flush();
    return tokens;
}

// java 실행 파일 경로를 만든다. JAVA_HOME이 있으면 gradlew.bat과 동일하게 그 아래 bin/java(.exe)를
// 쓰고, 없으면 PATH의 java(.exe)에 의존한다. JAVA_HOME 둘레의 큰따옴표는 gradlew.bat처럼 제거한다.
export function javaExecutable(env = process.env, platform = process.platform) {
    const p = pathForPlatform(platform);
    const exe = platform === 'win32' ? 'java.exe' : 'java';
    const javaHome = typeof env.JAVA_HOME === 'string' ? env.JAVA_HOME.replace(/"/g, '') : '';
    return javaHome ? p.join(javaHome, 'bin', exe) : exe;
}

// Gradle wrapper 실행 방법을 플랫폼별로 결정한다.
// - Windows: gradlew.bat(배치 파일)을 shell로 우회하지 않고 java.exe -jar로 wrapper jar를 직접 실행한다.
//   이렇게 하면 cmd.exe 인용 과정에서 역슬래시 경로가 깨지지 않고, Node가 인자를 그대로 전달한다.
//   gradlew.bat이 하던 것과 동일하게 DEFAULT_JVM_OPTS, JAVA_OPTS, GRADLE_OPTS를 분리해 넘긴다.
// - 그 외(POSIX): 기존처럼 gradlew 셸 스크립트를 직접 실행한다. JAVA_OPTS 분리는 스크립트가 처리한다.
export function resolveGradleInvocation(backendRoot, gradleArgs = [], { platform = process.platform, env = process.env } = {}) {
    const p = pathForPlatform(platform);
    if (platform === 'win32') {
        const wrapperJar = p.join(backendRoot, 'gradle', 'wrapper', 'gradle-wrapper.jar');
        return {
            command: javaExecutable(env, platform),
            args: [
                ...DEFAULT_JVM_OPTS,
                ...splitJvmOpts(env.JAVA_OPTS),
                ...splitJvmOpts(env.GRADLE_OPTS),
                '-Dorg.gradle.appname=gradlew',
                '-jar',
                wrapperJar,
                ...gradleArgs
            ],
            shell: false
        };
    }
    return {
        command: p.join(backendRoot, 'gradlew'),
        args: gradleArgs,
        shell: false
    };
}
