// 存储抽象层：本地 `next dev` 使用文件系统后端（.data 目录）；
// EdgeOne 部署（NODE_ENV=production）使用 Pages Blob 后端（@edgeone/pages-blob），
// Functions（Edge/Cloud）内仅凭 Store 名称自动鉴权，无需凭证。
// 本地脚本/外部服务可用 EDGEOINE_PROJECT_ID + EDGEOINE_BLOB_TOKEN 显式带凭证访问 Blob。

export type Category = { id: string; name: string; color: string; panelColor: string; accentColor: string; createdAt: string };
export type Entry = { id: string; title: string; subtitle: string; productDesc: string; productIntro: string; otherNotes: string; tags: string[]; categoryId: string; categoryName: string; imageUrl: string; imageName: string; createdAt: string };

// body 统一为 Blob：Node 与 Edge 运行时都原生支持，且可直接作为 Response 的 BodyInit。
export type StoredImage = { body: Blob };

export interface StorageBackend {
  listJson<T>(collection: string): Promise<T[]>;
  getJson<T>(collection: string, id: string): Promise<T | null>;
  putJson<T>(collection: string, id: string, value: T): Promise<void>;
  deleteJson(collection: string, id: string): Promise<void>;
  getImage(key: string): Promise<StoredImage | null>;
  // body 统一为 Blob：调用方先缓冲文件内容，避免云函数 fetch 不支持流式请求体
  putImage(key: string, body: Blob): Promise<void>;
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
  const { createEdgeOneBlobStorage } = await import('./storage/edgeone-blob');
  // 显式配置凭证（本地脚本/外部服务）时带凭证访问；
  // 线上 EdgeOne Functions（production）不传凭证，由运行时按 Store 名称自动鉴权。
  // 显式配置凭证（本地脚本/外部服务/Node 生产部署）时带凭证访问 Blob。
  if (projectId && token) return createEdgeOneBlobStorage({ projectId, token });
  // 以运行时能力而非 NODE_ENV 判别：Node 运行时（next dev / next start / Node 容器）
  // 能加载 node:fs，使用文件系统后端（.data 目录）；Edge Runtime（EdgeOne Pages
  // Functions / miniflare）没有 node:fs，import 会抛错，此时回退 Blob 后端，
  // 由 Functions 运行时按 Store 名称自动鉴权。
  try {
    const { createLocalFileStorage } = await import('./storage/local-fs');
    return createLocalFileStorage();
  } catch (error) {
    console.warn('[storage] 当前运行时不支持文件系统后端，回退到 Blob 存储：', error);
    return createEdgeOneBlobStorage();
  }
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

export async function putImage(key: string, body: Blob): Promise<void> {
  await (await storage()).putImage(key, body);
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
