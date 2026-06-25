import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    isBatchFile,
    quoteWindowsArg,
    resolveSpawn,
    splitJvmOpts,
    javaExecutable,
    resolveGradleInvocation,
    npmCommand
} from '../spawn-command.mjs';

describe('spawn-command — isBatchFile', () => {
    it('detects .bat and .cmd regardless of case', () => {
        assert.equal(isBatchFile('gradlew.bat'), true);
        assert.equal(isBatchFile('C:\\proj\\app\\back-end\\gradlew.BAT'), true);
        assert.equal(isBatchFile('foo.cmd'), true);
    });

    it('rejects shell scripts, executables, and extensionless commands', () => {
        assert.equal(isBatchFile('gradlew'), false);
        assert.equal(isBatchFile('java.exe'), false);
        assert.equal(isBatchFile('npm'), false);
        assert.equal(isBatchFile('/usr/bin/node'), false);
    });

    it('returns false for non-string input', () => {
        assert.equal(isBatchFile(undefined), false);
        assert.equal(isBatchFile(null), false);
    });
});

describe('spawn-command — quoteWindowsArg', () => {
    it('leaves tokens without whitespace or metacharacters untouched', () => {
        assert.equal(quoteWindowsArg('test'), 'test');
        assert.equal(quoteWindowsArg('C:\\proj\\app\\back-end'), 'C:\\proj\\app\\back-end');
    });

    it('wraps tokens that contain spaces so they stay a single argument', () => {
        assert.equal(quoteWindowsArg('C:\\my proj\\app'), '"C:\\my proj\\app"');
    });

    it('quotes empty strings and escapes embedded double quotes', () => {
        assert.equal(quoteWindowsArg(''), '""');
        assert.equal(quoteWindowsArg('a"b'), '"a""b"');
    });
});

describe('spawn-command — resolveSpawn', () => {
    it('enables shell and quotes spaced tokens for a batch file on Windows', () => {
        const result = resolveSpawn('C:\\my app\\foo.bat', ['-p', 'C:\\my proj\\app', 'go'], 'win32');
        assert.equal(result.shell, true);
        assert.equal(result.command, '"C:\\my app\\foo.bat"');
        assert.deepEqual(result.args, ['-p', '"C:\\my proj\\app"', 'go']);
    });

    it('leaves a non-batch command unchanged with shell disabled on Windows', () => {
        const result = resolveSpawn('java.exe', ['-jar', 'C:\\a\\gradle-wrapper.jar'], 'win32');
        assert.equal(result.shell, false);
        assert.equal(result.command, 'java.exe');
        assert.deepEqual(result.args, ['-jar', 'C:\\a\\gradle-wrapper.jar']);
    });

    it('leaves a POSIX invocation unchanged with shell disabled', () => {
        const args = ['-p', '/home/me/app/back-end', 'test'];
        const result = resolveSpawn('/home/me/app/back-end/gradlew', args, 'linux');
        assert.equal(result.shell, false);
        assert.deepEqual(result.args, args);
    });
});

describe('spawn-command — npmCommand', () => {
    it('resolves to npm.cmd on Windows so resolveSpawn runs it via shell', () => {
        const cmd = npmCommand('win32');
        assert.equal(cmd, 'npm.cmd');
        assert.equal(isBatchFile(cmd), true);
        assert.equal(resolveSpawn(cmd, ['run', 'build'], 'win32').shell, true);
    });

    it('stays npm on POSIX with shell disabled', () => {
        assert.equal(npmCommand('linux'), 'npm');
        assert.equal(npmCommand('darwin'), 'npm');
        assert.equal(resolveSpawn('npm', ['run', 'build'], 'linux').shell, false);
    });
});

describe('spawn-command — splitJvmOpts (backslash-safe)', () => {
    it('returns an empty array for missing or blank input', () => {
        assert.deepEqual(splitJvmOpts(undefined), []);
        assert.deepEqual(splitJvmOpts(null), []);
        assert.deepEqual(splitJvmOpts(''), []);
        assert.deepEqual(splitJvmOpts('   '), []);
    });

    it('splits plain options on whitespace', () => {
        assert.deepEqual(
            splitJvmOpts('-Xmx512m -Dfile.encoding=UTF-8'),
            ['-Xmx512m', '-Dfile.encoding=UTF-8']
        );
        assert.deepEqual(splitJvmOpts('  -Da=1   -Db=2  '), ['-Da=1', '-Db=2']);
    });

    it('preserves backslashes in Windows paths verbatim', () => {
        assert.deepEqual(
            splitJvmOpts('-Dgradle.user.home=C:\\Users\\me\\.gradle'),
            ['-Dgradle.user.home=C:\\Users\\me\\.gradle']
        );
        assert.deepEqual(
            splitJvmOpts('-Da=C:\\a\\b -Dc=D:\\e\\f'),
            ['-Da=C:\\a\\b', '-Dc=D:\\e\\f']
        );
    });

    it('keeps a quoted Windows path with spaces as one token, backslashes intact', () => {
        assert.deepEqual(
            splitJvmOpts('-Djava.io.tmpdir="C:\\Program Files\\Temp Dir"'),
            ['-Djava.io.tmpdir=C:\\Program Files\\Temp Dir']
        );
    });

    it('preserves an explicitly empty quoted value but drops a standalone empty token', () => {
        assert.deepEqual(splitJvmOpts('-Dfoo=""'), ['-Dfoo=']);
        assert.deepEqual(splitJvmOpts('""'), []);
    });
});

describe('spawn-command — javaExecutable', () => {
    it('falls back to java.exe on Windows / java on POSIX when JAVA_HOME is unset', () => {
        assert.equal(javaExecutable({}, 'win32'), 'java.exe');
        assert.equal(javaExecutable({}, 'linux'), 'java');
    });

    it('joins JAVA_HOME/bin with the platform java binary', () => {
        assert.equal(javaExecutable({ JAVA_HOME: 'C:\\jdk' }, 'win32'), 'C:\\jdk\\bin\\java.exe');
        assert.equal(javaExecutable({ JAVA_HOME: '/opt/jdk' }, 'linux'), '/opt/jdk/bin/java');
    });

    it('strips surrounding quotes from JAVA_HOME like gradlew.bat does', () => {
        assert.equal(javaExecutable({ JAVA_HOME: '"C:\\jdk"' }, 'win32'), 'C:\\jdk\\bin\\java.exe');
    });
});

describe('spawn-command — resolveGradleInvocation', () => {
    it('runs java.exe -jar against the wrapper jar on Windows, with JAVA_OPTS split in', () => {
        const invocation = resolveGradleInvocation(
            'C:\\ws\\app\\back-end',
            ['-p', 'C:\\ws\\app\\back-end', 'test'],
            { platform: 'win32', env: { JAVA_OPTS: '-Dgradle.user.home=C:\\Users\\me\\.gradle' } }
        );
        assert.equal(invocation.shell, false);
        assert.equal(invocation.command, 'java.exe');
        assert.deepEqual(invocation.args, [
            '-Xmx64m',
            '-Xms64m',
            '-Dgradle.user.home=C:\\Users\\me\\.gradle',
            '-Dorg.gradle.appname=gradlew',
            '-jar',
            'C:\\ws\\app\\back-end\\gradle\\wrapper\\gradle-wrapper.jar',
            '-p',
            'C:\\ws\\app\\back-end',
            'test'
        ]);
    });

    it('honors JAVA_HOME and appends GRADLE_OPTS after JAVA_OPTS on Windows', () => {
        const invocation = resolveGradleInvocation(
            'C:\\ws\\app\\back-end',
            ['help'],
            {
                platform: 'win32',
                env: { JAVA_HOME: 'C:\\jdk', JAVA_OPTS: '-Da=1', GRADLE_OPTS: '-Db=2' }
            }
        );
        assert.equal(invocation.command, 'C:\\jdk\\bin\\java.exe');
        assert.deepEqual(invocation.args, [
            '-Xmx64m',
            '-Xms64m',
            '-Da=1',
            '-Db=2',
            '-Dorg.gradle.appname=gradlew',
            '-jar',
            'C:\\ws\\app\\back-end\\gradle\\wrapper\\gradle-wrapper.jar',
            'help'
        ]);
    });

    it('omits opts cleanly on Windows when no JAVA_OPTS/GRADLE_OPTS are set', () => {
        const invocation = resolveGradleInvocation('C:\\ws\\app\\back-end', ['test'], {
            platform: 'win32',
            env: {}
        });
        assert.deepEqual(invocation.args, [
            '-Xmx64m',
            '-Xms64m',
            '-Dorg.gradle.appname=gradlew',
            '-jar',
            'C:\\ws\\app\\back-end\\gradle\\wrapper\\gradle-wrapper.jar',
            'test'
        ]);
    });

    it('runs the gradlew shell script unchanged on POSIX (JAVA_OPTS handled by the script)', () => {
        const args = ['-p', '/ws/app/back-end', '--project-cache-dir', '/ws/build/cache', 'test'];
        const invocation = resolveGradleInvocation('/ws/app/back-end', args, {
            platform: 'linux',
            env: { JAVA_OPTS: '-Dgradle.user.home=/home/me/.gradle' }
        });
        assert.equal(invocation.shell, false);
        assert.equal(invocation.command, '/ws/app/back-end/gradlew');
        assert.deepEqual(invocation.args, args);
    });
});
