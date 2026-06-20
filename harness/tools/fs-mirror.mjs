// run output 격리 publish 헬퍼: run root 산출물을 canonical 위치로 파일 단위 atomic
// 복제한다. 디렉터리 단위 원자성은 보장하지 않고 last-writer-wins로 둔다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function atomicCopyFile(source, destination) {
    if (!fs.existsSync(source)) return false;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (fs.existsSync(destination) && fs.statSync(destination).isDirectory()) {
        fs.rmSync(destination, { recursive: true, force: true });
    }
    const temp = `${destination}.tmp-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
    fs.copyFileSync(source, temp);
    fs.renameSync(temp, destination);
    return true;
}

export function mirrorDirectory(source, destination, options = {}) {
    if (!fs.existsSync(source)) return false;
    fs.mkdirSync(destination, { recursive: true });
    const sourceEntries = new Map(fs.readdirSync(source, { withFileTypes: true }).map((entry) => [entry.name, entry]));
    for (const [name, entry] of sourceEntries) {
        const sourcePath = path.join(source, name);
        const destinationPath = path.join(destination, name);
        if (entry.isDirectory()) {
            if (fs.existsSync(destinationPath) && !fs.statSync(destinationPath).isDirectory()) {
                fs.rmSync(destinationPath, { force: true });
            }
            mirrorDirectory(sourcePath, destinationPath, options);
        } else if (entry.isFile()) {
            atomicCopyFile(sourcePath, destinationPath);
        }
    }
    if (options.deleteExtraneous) {
        for (const entry of fs.readdirSync(destination, { withFileTypes: true })) {
            if (!sourceEntries.has(entry.name)) {
                fs.rmSync(path.join(destination, entry.name), { recursive: true, force: true });
            }
        }
    }
    return true;
}
