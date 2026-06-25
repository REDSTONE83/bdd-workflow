// run.mjs 실행 컨텍스트 헬퍼: runId 생성과 실행 소유 포트 할당/충돌 진단.
// 순수 로직을 분리해 harness/tools/__tests__에서 단위 검증할 수 있게 한다.
import crypto from 'node:crypto';
import net from 'node:net';
import { spawnSync } from 'node:child_process';

export function generateRunId(now = new Date(), pid = process.pid) {
    const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    return `${stamp}-${pid}-${crypto.randomBytes(3).toString('hex')}`;
}

export function parsePortEnv(name, env = process.env) {
    const value = env[name];
    if (!value) return null;
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${name} must be a TCP port number: ${value}`);
    }
    return port;
}

export function portFromUrlEnv(name, env = process.env) {
    const value = env[name];
    if (!value) return null;
    try {
        const parsed = new URL(value);
        if (!parsed.port) return null;
        const port = Number(parsed.port);
        return Number.isInteger(port) ? port : null;
    } catch {
        throw new Error(`${name} must be a valid URL when provided: ${value}`);
    }
}

export function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.listen({ host: '127.0.0.1', port }, () => {
            server.close(() => resolve(true));
        });
    });
}

export async function findFreePort(excluded = new Set()) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const port = await new Promise((resolve, reject) => {
            const server = net.createServer();
            server.once('error', reject);
            server.listen({ host: '127.0.0.1', port: 0 }, () => {
                const address = server.address();
                const selected = typeof address === 'object' && address ? address.port : null;
                server.close(() => {
                    if (selected) resolve(selected);
                    else reject(new Error('Could not allocate a TCP port'));
                });
            });
        });
        if (!excluded.has(port)) return port;
    }
    throw new Error('Could not allocate a unique TCP port for this run');
}

// 포트 점유 프로세스를 진단하는 명령. Windows에는 lsof가 없어 netstat로 대체한다.
export function portOwnerCommand(port, platform = process.platform) {
    if (platform === 'win32') {
        return { command: 'netstat', args: ['-a', '-n', '-o', '-p', 'tcp'] };
    }
    return { command: 'lsof', args: ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'] };
}

// 진단 명령의 stdout에서 해당 포트와 관련된 줄만 추려 최대 4줄까지 보여 준다.
// netstat는 전체 연결을 출력하므로 Windows에서는 포트 번호로 필터링한다.
export function formatPortOwner(stdout, port, platform = process.platform) {
    if (typeof stdout !== 'string' || !stdout.trim()) return null;
    const lines = stdout.trim().split(/\r?\n/);
    const matched = platform === 'win32'
        ? lines.filter((line) => new RegExp(`:${port}\\b`).test(line))
        : lines;
    const chosen = matched.length > 0 ? matched : lines;
    return chosen.slice(0, 4).join('\n');
}

export function portOwner(port, platform = process.platform) {
    const { command, args } = portOwnerCommand(port, platform);
    const result = spawnSync(command, args, { encoding: 'utf8' });
    if (result.error) return `owner process unavailable (${command} not found)`;
    const formatted = result.status === 0 ? formatPortOwner(result.stdout, port, platform) : null;
    return formatted ?? `owner process unavailable from ${command}`;
}

export async function assertExplicitPortAvailable(name, port) {
    if (await isPortAvailable(port)) return;
    throw new Error(`${name}=${port} is already in use.\n${portOwner(port)}\nChoose a free port or unset ${name} so the runner can allocate one.`);
}

export async function createPortContext(env = process.env) {
    const frontendFromEnv = parsePortEnv('E2E_FRONTEND_PORT', env) ?? portFromUrlEnv('E2E_BASE_URL', env);
    const backendFromEnv = parsePortEnv('E2E_BACKEND_PORT', env) ?? portFromUrlEnv('VITE_BACKEND_ORIGIN', env);
    const frontendPort = frontendFromEnv ?? await findFreePort();
    if (frontendFromEnv) {
        await assertExplicitPortAvailable('E2E_FRONTEND_PORT', frontendPort);
    }
    const backendPort = backendFromEnv ?? await findFreePort(new Set([frontendPort]));
    if (backendFromEnv) {
        await assertExplicitPortAvailable('E2E_BACKEND_PORT', backendPort);
    }
    if (frontendPort === backendPort) {
        throw new Error(`E2E_FRONTEND_PORT and E2E_BACKEND_PORT must be different: ${frontendPort}`);
    }
    return {
        frontendPort,
        backendPort,
        baseUrl: env.E2E_BASE_URL ?? `http://127.0.0.1:${frontendPort}`,
        backendOrigin: env.VITE_BACKEND_ORIGIN ?? `http://127.0.0.1:${backendPort}`
    };
}
