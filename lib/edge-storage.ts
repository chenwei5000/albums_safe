// 存储抽象层：本地 `next dev` 使用文件系统后端（.data 目录）；
// EdgeOne 部署使用 Pages Blob 后端（@edgeone/pages-blob）。
// 配置环境变量 EDGEOINE_PROJECT_ID + EDGEOINE_BLOB_TOKEN 后自动切换到 Blob。

export type Category = { id: string; name: string; color: string; createdAt: string };
export type Entry = { id: string; title: string; categoryId: string; categoryName: string; imageUrl: string; imageName: string; createdAt: string };

// body 统一为 Blob：Node 与 Edge 运行时都原生支持，且可直接作为 Response 的 BodyInit。
export type StoredImage = { body: Blob };

export interface StorageBackend {
  listJson<T>(collection: string): Promise<T[]>;
  getJson<T>(collection: string, id: string): Promise<T | null>;
  putJson<T>(collection: string, id: string, value: T): Promise<void>;
  deleteJson(collection: string, id: string): Promise<void>;
  getImage(key: string): Promise<StoredImage | null>;
  putImage(key: string, body: ReadableStream<Uint8Array>, contentType: string): Promise<void>;
  deleteImage(key: string): Promise<void>;
}

let backendPromise: Promise<StorageBackend> | null = null;

function storage(): Promise<StorageBackend> {
  backendPromise ??= createBackend();
  return backendPromise;
}

async function createBackend(): Promise<StorageBackend> {
  const projectId = process.env.EDGEOINE_PROJECT_ID;
  const token = process.env.EDGEOINE_BLOB_TOKEN;
  if (projectId && token) {
    const { createEdgeOneBlobStorage } = await import('./storage/edgeone-blob');
    return createEdgeOneBlobStorage({ projectId, token });
  }
  const { createLocalFileStorage } = await import('./storage/local-fs');
  return createLocalFileStorage();
}

export async function listJson<T>(collection: string): Promise<T[]> {
  return (await storage()).listJson<T>(collection);
}

export async function getJson<T>(collection: string, id: string): Promise<T | null> {
  return (await storage()).getJson<T>(collection, id);
}

export async function putJson<T>(collection: string, id: string, value: T): Promise<void> {
  await (await storage()).putJson(collection, id, value);
}

export async function deleteJson(collection: string, id: string): Promise<void> {
  await (await storage()).deleteJson(collection, id);
}

export async function getImage(key: string): Promise<StoredImage | null> {
  return (await storage()).getImage(key);
}

export async function putImage(key: string, body: ReadableStream<Uint8Array>, contentType: string): Promise<void> {
  await (await storage()).putImage(key, body, contentType);
}

export async function deleteImage(key: string): Promise<void> {
  await (await storage()).deleteImage(key);
}

const extensionMime: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export function imageContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return extensionMime[ext] ?? 'application/octet-stream';
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
