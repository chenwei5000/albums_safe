import type { StorageBackend, StoredImage } from '../edge-storage';

// EdgeOne Pages Blob 后端：https://www.npmjs.com/package/@edgeone/pages-blob
// 元数据键：<collection>/<id>.json（entries/、categories/）
// 图片键：images/<日期>/<uuid>.<ext>
// 读取统一使用 strong 一致性，保证上传/删除后首页与详情页立刻读到最新数据。

type BlobValue = string | ArrayBuffer | Blob | ReadableStream<Uint8Array>;
type Consistency = 'eventual' | 'strong';

interface BlobStore {
  get(
    key: string,
    options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'blob' | 'stream'; consistency?: Consistency },
  ): Promise<unknown>;
  set(key: string, value: BlobValue): Promise<void>;
  setJSON(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; consistency?: Consistency }): Promise<{
    blobs: Array<{ key: string; etag: string }>;
    directories: string[];
  }>;
}

interface BlobSdk {
  getStore(options: {
    name: string;
    projectId: string;
    token: string;
    consistency: Consistency;
  }): BlobStore;
}

const STORE_NAME = process.env.EDGEOINE_BLOB_STORE ?? 'album-safe';
const STRONG = { consistency: 'strong' as const };

export function createEdgeOneBlobStorage(options: {
  projectId: string;
  token: string;
}): StorageBackend {
  let storePromise: Promise<BlobStore> | null = null;

  async function store(): Promise<BlobStore> {
    storePromise ??= (async () => {
      const sdk = (await import('@edgeone/pages-blob')) as unknown as BlobSdk;
      return sdk.getStore({
        name: STORE_NAME,
        projectId: options.projectId,
        token: options.token,
        consistency: 'strong',
      });
    })();
    return storePromise;
  }

  const jsonKey = (collection: string, id: string) => `${collection}/${id}.json`;
  const imageKey = (key: string) => `images/${key}`;

  return {
    async listJson<T>(collection: string): Promise<T[]> {
      const s = await store();
      const { blobs } = await s.list({ prefix: `${collection}/`, ...STRONG });
      return Promise.all(
        blobs
          .filter((blob) => blob.key.endsWith('.json'))
          .map((blob) => s.get(blob.key, { type: 'json', ...STRONG }) as Promise<T>),
      );
    },

    async getJson<T>(collection: string, id: string): Promise<T | null> {
      const s = await store();
      return (await s.get(jsonKey(collection, id), { type: 'json', ...STRONG })) as T | null;
    },

    async putJson<T>(collection: string, id: string, value: T): Promise<void> {
      const s = await store();
      await s.setJSON(jsonKey(collection, id), value);
    },

    async deleteJson(collection: string, id: string): Promise<void> {
      const s = await store();
      await s.delete(jsonKey(collection, id));
    },

    async getImage(key: string): Promise<StoredImage | null> {
      const s = await store();
      const body = (await s.get(imageKey(key), {
        type: 'stream',
        ...STRONG,
      })) as ReadableStream<Uint8Array> | null;
      return body ? { body } : null;
    },

    async putImage(key: string, body: ReadableStream<Uint8Array>): Promise<void> {
      const s = await store();
      await s.set(imageKey(key), body);
    },

    async deleteImage(key: string): Promise<void> {
      const s = await store();
      await s.delete(imageKey(key));
    },
  };
}