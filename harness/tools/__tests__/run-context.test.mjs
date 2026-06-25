import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {
    generateRunId,
    parsePortEnv,
    portFromUrlEnv,
    findFreePort,
    isPortAvailable,
    createPortContext,
    portOwnerCommand,
    formatPortOwner
} from '../run-context.mjs';

function listen(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen({ host: '127.0.0.1', port }, () => resolve(server));
    });
}

function close(server) {
    return new Promise((resolve) => server.close(() => resolve()));
}

describe('run-context — generateRunId', () => {
    it('formats as <yyyyMMddHHmmss>-<pid>-<hex6>', () => {
        const id = generateRunId(new Date(2026, 5, 20, 15, 1, 2), 12345);
        assert.match(id, /^20260620150102-12345-[0-9a-f]{6}$/);
    });

    it('varies the random suffix across calls with the same stamp/pid', () => {
        const a = generateRunId(new Date(2026, 5, 20, 15, 1, 2), 1);
        const b = generateRunId(new Date(2026, 5, 20, 15, 1, 2), 1);
        assert.notEqual(a, b);
    });
});

describe('run-context — parsePortEnv', () => {
    it('returns null when unset or empty', () => {
        assert.equal(parsePortEnv('P', {}), null);
        assert.equal(parsePortEnv('P', { P: '' }), null);
    });

    it('parses a valid TCP port', () => {
        assert.equal(parsePortEnv('P', { P: '8080' }), 8080);
    });

    it('throws on non-numeric or out-of-range values', () => {
        assert.throws(() => parsePortEnv('P', { P: 'abc' }), /must be a TCP port/);
        assert.throws(() => parsePortEnv('P', { P: '0' }), /must be a TCP port/);
        assert.throws(() => parsePortEnv('P', { P: '70000' }), /must be a TCP port/);
    });
});

describe('run-context — portFromUrlEnv', () => {
    it('returns null when unset or when the URL has no explicit port', () => {
        assert.equal(portFromUrlEnv('U', {}), null);
        assert.equal(portFromUrlEnv('U', { U: 'http://127.0.0.1' }), null);
    });

    it('extracts an explicit port from the URL', () => {
        assert.equal(portFromUrlEnv('U', { U: 'http://127.0.0.1:5173' }), 5173);
    });

    it('throws on an invalid URL', () => {
        assert.throws(() => portFromUrlEnv('U', { U: 'not a url' }), /must be a valid URL/);
    });
});

describe('run-context — findFreePort', () => {
    it('returns an available port and respects the excluded set', async () => {
        const first = await findFreePort();
        assert.equal(Number.isInteger(first), true);
        const second = await findFreePort(new Set([first]));
        assert.notEqual(second, first);
        assert.equal(await isPortAvailable(second), true);
    });
});

describe('run-context — portOwnerCommand', () => {
    it('uses lsof on POSIX scoped to the listening port', () => {
        assert.deepEqual(portOwnerCommand(5173, 'linux'), {
            command: 'lsof',
            args: ['-nP', '-iTCP:5173', '-sTCP:LISTEN']
        });
    });

    it('falls back to netstat on Windows where lsof is absent', () => {
        assert.deepEqual(portOwnerCommand(5173, 'win32'), {
            command: 'netstat',
            args: ['-a', '-n', '-o', '-p', 'tcp']
        });
    });
});

describe('run-context — formatPortOwner', () => {
    it('returns null for empty output', () => {
        assert.equal(formatPortOwner('', 5173), null);
        assert.equal(formatPortOwner('   \n  ', 5173), null);
        assert.equal(formatPortOwner(undefined, 5173), null);
    });

    it('keeps lsof output as-is on POSIX (capped at 4 lines)', () => {
        const out = 'COMMAND PID\nnode 1\nnode 2\nnode 3\nnode 4\nnode 5';
        assert.equal(formatPortOwner(out, 5173, 'linux'), 'COMMAND PID\nnode 1\nnode 2\nnode 3');
    });

    it('filters netstat output to the matching port on Windows', () => {
        const netstat = [
            '  Proto  Local Address      Foreign Address    State        PID',
            '  TCP    0.0.0.0:5173       0.0.0.0:0          LISTENING    1234',
            '  TCP    0.0.0.0:51730      0.0.0.0:0          LISTENING    9999',
            '  TCP    127.0.0.1:8080     0.0.0.0:0          LISTENING    4321'
        ].join('\r\n');
        const result = formatPortOwner(netstat, 5173, 'win32');
        assert.equal(result, '  TCP    0.0.0.0:5173       0.0.0.0:0          LISTENING    1234');
    });
});

describe('run-context — createPortContext', () => {
    it('allocates distinct free ports and derives origins when no env is set', async () => {
        const ctx = await createPortContext({});
        assert.notEqual(ctx.frontendPort, ctx.backendPort);
        assert.equal(ctx.baseUrl, `http://127.0.0.1:${ctx.frontendPort}`);
        assert.equal(ctx.backendOrigin, `http://127.0.0.1:${ctx.backendPort}`);
    });

    it('honors explicit env ports and preserves provided origins', async () => {
        const front = await findFreePort();
        const back = await findFreePort(new Set([front]));
        const ctx = await createPortContext({
            E2E_FRONTEND_PORT: String(front),
            E2E_BACKEND_PORT: String(back),
            E2E_BASE_URL: `http://localhost:${front}`,
            VITE_BACKEND_ORIGIN: `http://localhost:${back}`
        });
        assert.equal(ctx.frontendPort, front);
        assert.equal(ctx.backendPort, back);
        assert.equal(ctx.baseUrl, `http://localhost:${front}`);
        assert.equal(ctx.backendOrigin, `http://localhost:${back}`);
    });

    it('fail-fast when an explicitly requested port is already in use', async () => {
        const port = await findFreePort();
        const server = await listen(port);
        try {
            await assert.rejects(
                createPortContext({ E2E_FRONTEND_PORT: String(port) }),
                /already in use/
            );
        } finally {
            await close(server);
        }
    });

    it('rejects when the front-end and back-end ports resolve to the same value', async () => {
        const port = await findFreePort();
        await assert.rejects(
            createPortContext({ E2E_FRONTEND_PORT: String(port), E2E_BACKEND_PORT: String(port) }),
            /must be different/
        );
    });
});
