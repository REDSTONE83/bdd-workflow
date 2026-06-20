import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { atomicCopyFile, mirrorDirectory } from '../fs-mirror.mjs';

function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'fs-mirror-'));
}

describe('fs-mirror — atomicCopyFile', () => {
    it('returns false when the source is missing', () => {
        const dir = tempDir();
        assert.equal(atomicCopyFile(path.join(dir, 'nope.txt'), path.join(dir, 'out.txt')), false);
    });

    it('copies content and creates parent directories', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src.txt');
        fs.writeFileSync(src, 'hello');
        const dest = path.join(dir, 'nested', 'out.txt');
        assert.equal(atomicCopyFile(src, dest), true);
        assert.equal(fs.readFileSync(dest, 'utf8'), 'hello');
    });

    it('overwrites an existing destination file', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src.txt');
        const dest = path.join(dir, 'out.txt');
        fs.writeFileSync(src, 'new');
        fs.writeFileSync(dest, 'old');
        atomicCopyFile(src, dest);
        assert.equal(fs.readFileSync(dest, 'utf8'), 'new');
    });

    it('replaces a destination directory with the source file', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src.txt');
        fs.writeFileSync(src, 'file');
        const dest = path.join(dir, 'out');
        fs.mkdirSync(dest);
        fs.writeFileSync(path.join(dest, 'inner.txt'), 'x');
        atomicCopyFile(src, dest);
        assert.equal(fs.statSync(dest).isFile(), true);
        assert.equal(fs.readFileSync(dest, 'utf8'), 'file');
    });
});

describe('fs-mirror — mirrorDirectory', () => {
    it('returns false when the source is missing', () => {
        const dir = tempDir();
        assert.equal(mirrorDirectory(path.join(dir, 'nope'), path.join(dir, 'dest')), false);
    });

    it('copies nested files into the destination', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src');
        fs.mkdirSync(path.join(src, 'a'), { recursive: true });
        fs.writeFileSync(path.join(src, 'root.txt'), 'r');
        fs.writeFileSync(path.join(src, 'a', 'leaf.txt'), 'l');
        const dest = path.join(dir, 'dest');
        mirrorDirectory(src, dest);
        assert.equal(fs.readFileSync(path.join(dest, 'root.txt'), 'utf8'), 'r');
        assert.equal(fs.readFileSync(path.join(dest, 'a', 'leaf.txt'), 'utf8'), 'l');
    });

    it('keeps extraneous destination files by default', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src');
        fs.mkdirSync(src, { recursive: true });
        fs.writeFileSync(path.join(src, 'keep.txt'), 'k');
        const dest = path.join(dir, 'dest');
        fs.mkdirSync(dest, { recursive: true });
        fs.writeFileSync(path.join(dest, 'stale.txt'), 's');
        mirrorDirectory(src, dest);
        assert.equal(fs.existsSync(path.join(dest, 'stale.txt')), true);
    });

    it('removes extraneous destination entries when deleteExtraneous is set', () => {
        const dir = tempDir();
        const src = path.join(dir, 'src');
        fs.mkdirSync(src, { recursive: true });
        fs.writeFileSync(path.join(src, 'keep.txt'), 'k');
        const dest = path.join(dir, 'dest');
        fs.mkdirSync(path.join(dest, 'staledir'), { recursive: true });
        fs.writeFileSync(path.join(dest, 'stale.txt'), 's');
        mirrorDirectory(src, dest, { deleteExtraneous: true });
        assert.equal(fs.existsSync(path.join(dest, 'keep.txt')), true);
        assert.equal(fs.existsSync(path.join(dest, 'stale.txt')), false);
        assert.equal(fs.existsSync(path.join(dest, 'staledir')), false);
    });
});
