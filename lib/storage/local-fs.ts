import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageBackend, StoredImage } from '../edge-storage';

// 仅用于本地 `next dev` / `next start`：元数据与图片落盘到项目根目录 .data/。
// EdgeOne 上配置 EDGEOINE_PROJECT_ID + EDGEOINE_BLOB_TOKEN 后不会走此后端。
const dataRoot = path.join(process.cwd(), '.data');

function collectionDir(collection: string) {
  return path.join(dataRoot, collection);
}

function jsonPath(collection: string, id: string) {
  // id 为 crypto.randomUUID()，这里再做一次字符防御，避免路径穿越
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '');
  return path.join(collectionDir(collection), `${safeId}.json`);
}

function imagePath(key: string) {
  // key 形如 2026-09-02/uuid.png，限定在 .data/images 目录内
  const safeKey = key.replace(/[^a-zA-Z0-9/.-]/g, '');
  return path.join(dataRoot, 'images', safeKey);
}

const extensionMime: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

function contentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return extensionMime[ext] ?? 'application/octet-stream';
}

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export function createLocalFileStorage(): StorageBackend {
  return {
    async listJson<T>(collection: string): Promise<T[]> {
      const dir = collectionDir(collection);
      let files: string[];
      try {
        files = await readdir(dir);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
      }
      const values = await Promise.all(
        files
          .filter((file) => file.endsWith('.json'))
          .map((file) => readJsonFile<T>(path.join(dir, file))),
      );
      const result: T[] = [];
      for (const value of values) {
        if (value !== null) result.push(value);
      }
      return result;
    },

    async getJson<T>(collection: string, id: string) {
      return readJsonFile<T>(jsonPath(collection, id));
    },

    async putJson<T>(collection: string, id: string, value: T) {
      await mkdir(collectionDir(collection), { recursive: true });
      await writeFile(jsonPath(collection, id), JSON.stringify(value));
    },

    async deleteJson(collection: string, id: string) {
      await rm(jsonPath(collection, id), { force: true });
    },

    async getImage(key: string): Promise<StoredImage | null> {
      try {
        const buffer = await readFile(imagePath(key));
        return { body: new Blob([buffer], { type: contentTypeFromKey(key) }) };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },

    async putImage(key: string, body: ReadableStream<Uint8Array>, _contentType: string) {
      const file = imagePath(key);
      await mkdir(path.dirname(file), { recursive: true });
      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      await writeFile(file, Buffer.concat(chunks));
    },

    async deleteImage(key: string) {
      await rm(imagePath(key), { force: true });
    },
  };
}