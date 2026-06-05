import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const workspaceRoot = path.resolve(__dirname, '..', '..');

function envPath(name, fallback) {
    return process.env[name] ? path.resolve(process.env[name]) : fallback;
}

export function currentScope(defaultScope = 'application') {
    const scope = process.env.HARNESS_SCOPE || defaultScope;
    if (scope !== 'application' && scope !== 'harness') {
        throw new Error(`Unsupported HARNESS_SCOPE: ${scope}`);
    }
    return scope;
}

export const appRoot = envPath('APP_ROOT', path.join(workspaceRoot, 'app'));
export const backendRoot = envPath('BACKEND_ROOT', path.join(appRoot, 'back-end'));
export const frontEndRoot = envPath('FRONTEND_ROOT', path.join(appRoot, 'front-end'));

export function outputRootFor(scope = currentScope()) {
    return envPath('HARNESS_OUTPUT_ROOT', path.join(workspaceRoot, 'build', scope === 'harness' ? 'harness' : 'app'));
}

export function docsRootFor(scope = currentScope()) {
    return envPath('HARNESS_DOCS_ROOT', path.join(workspaceRoot, scope === 'harness' ? 'harness' : 'app', 'docs'));
}

export function requirementsDirFor(scope = currentScope()) {
    return envPath('HARNESS_REQUIREMENTS_DIR', path.join(docsRootFor(scope), 'requirements'));
}

export function scenariosDirFor(scope = currentScope()) {
    return envPath('HARNESS_SCENARIOS_DIR', path.join(docsRootFor(scope), 'scenarios'));
}

export function changeSetsDirFor(scope = currentScope()) {
    return envPath('HARNESS_CHANGE_SETS_DIR', path.join(docsRootFor(scope), 'change-sets'));
}

export function terminologyDirFor() {
    return envPath('HARNESS_TERMINOLOGY_DIR', path.join(workspaceRoot, 'harness', 'docs', 'terminology'));
}

export function repoRelative(filePath) {
    return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}
