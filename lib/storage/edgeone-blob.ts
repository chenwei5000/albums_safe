import type { StorageBackend, StoredImage } from '../edge-storage';

// EdgeOne Pages Blob 后端：https://www.npmjs.com/package/@edgeone/pages-blob
// 元数据键：data/<collection>.json（整个分类/相册数组存为一个 JSON）
// 图片键：images/<日期>/<uuid>.<ext>
// 读取统一使用 strong 一致性，保证上传/删除后首页与详情页立刻读到最新数据。
// Functions（Edge/Cloud）内仅凭 Store 名称自动鉴权，无需 projectId/token。

type BlobValue = string | ArrayBuffer | Blob;
type Consistency = 'eventual' | 'strong';

interface BlobStore {
  get(
    key: string,
    options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'blob' | 'stream'; consistency?: Consistency },
  ): Promise<unknown>;
  set(key: string, value: BlobValue): Promise<void>;
  setJSON(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

interface BlobSdk {
  // EdgeOne Functions（Edge/Cloud）内只传 name 即可自动鉴权；
  // projectId + token 仅用于本地脚本或外部服务访问。
  getStore(options: {
    name: string;
    consistency?: Consistency;
    projectId?: string;
    token?: string;
  }): BlobStore;
}

const STORE_NAME = process.env.EDGEOINE_BLOB_STORE ?? 'albums-safe';
const STRONG = { consistency: 'strong' as const };

export function createEdgeOneBlobStorage(options?: {
  projectId?: string;
  token?: string;
}): StorageBackend {
  let storePromise: Promise<BlobStore> | null = null;

  async function store(): Promise<BlobStore> {
    storePromise ??= (async () => {
      const sdk = (await import('@edgeone/pages-blob')) as unknown as BlobSdk;
      return sdk.getStore({
        name: STORE_NAME,
        consistency: 'strong',
        ...(options?.projectId && options?.token
          ? { projectId: options.projectId, token: options.token }
          : {}),
      });
    })();
    return storePromise;
  }

  // 元数据整组存为单个 JSON：data/<collection>.json（个人相册规模，读-改-写即可）
  const dataKey = (collection: string) => `data/${collection}.json`;
  const imageKey = (key: string) => `images/${key}`;

  async function readCollection<T>(s: BlobStore, collection: string): Promise<T[]> {
    return ((await s.get(dataKey(collection), { type: 'json', ...STRONG })) as T[] | null) ?? [];
  }

  return {
    async listJson<T>(collection: string): Promise<T[]> {
      const s = await store();
      return readCollection<T>(s, collection);
    },

    async getJson<T>(collection: string, id: string): Promise<T | null> {
      const s = await store();
      const items = await readCollection<T>(s, collection);
      return items.find((item) => (item as { id: string }).id === id) ?? null;
    },

    async putJson<T>(collection: string, id: string, value: T): Promise<void> {
      const s = await store();
      const items = await readCollection<T>(s, collection);
      const next = [...items.filter((item) => (item as { id: string }).id !== id), value];
      await s.setJSON(dataKey(collection), next);
    },

    async deleteJson(collection: string, id: string): Promise<void> {
      const s = await store();
      const items = await readCollection<{ id: string }>(s, collection);
      const next = items.filter((item) => item.id !== id);
      await s.setJSON(dataKey(collection), next);
    },

    async getImage(key: string): Promise<StoredImage | null> {
      const s = await store();
      const body = (await s.get(imageKey(key), {
        type: 'blob',
        ...STRONG,
      })) as Blob | null;
      return body ? { body } : null;
    },

    async putImage(key: string, body: Blob): Promise<void> {
      const s = await store();
      // Blob 作为 PUT body 可携带 Content-Length，兼容云函数网关；勿传 ReadableStream
      await s.set(imageKey(key), body);
    },

    async deleteImage(key: string): Promise<void> {
      const s = await store();
      await s.delete(imageKey(key));
    },
  };
}