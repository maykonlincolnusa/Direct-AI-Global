import { createHash } from 'node:crypto';
import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';

export async function ensureDirectories(paths: string[]) {
  await Promise.all(paths.map((path) => mkdir(path, { recursive: true })));
}

export async function listFilesRecursively(baseDir: string) {
  const files: string[] = [];
  const queue: string[] = [baseDir];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export async function fileHash(filePath: string) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export function extension(filePath: string) {
  return extname(filePath).toLowerCase();
}

export async function readUtf8(filePath: string) {
  return readFile(filePath, 'utf8');
}

export async function writeUtf8(filePath: string, content: string) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

export async function writeJson(filePath: string, data: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readUtf8(filePath);
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function fileSize(filePath: string) {
  const fileStats = await stat(filePath);
  return fileStats.size;
}

export async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function toHumanBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(2)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
}

export function normalizeSourcePath(sourcePath: string, root: string) {
  return relative(root, sourcePath).replace(/\\/g, '/');
}
