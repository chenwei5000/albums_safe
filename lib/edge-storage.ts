import { env } from 'cloudflare:workers';

export type Category = { id: string; name: string; color: string; createdAt: string };
export type Entry = { id: string; title: string; categoryId: string; categoryName: string; imageUrl: string; imageName: string; createdAt: string };

type Bindings = { ALBUM_KV: KVNamespace; BLOB: R2Bucket };
export const bindings = env as unknown as Bindings;

export async function listJson<T>(prefix: string): Promise<T[]> {
  const listed = await bindings.ALBUM_KV.list({ prefix });
  const values = await Promise.all(listed.keys.map((key) => bindings.ALBUM_KV.get<T>(key.name, 'json')));
  const result: T[] = [];
  for (const value of values) if (value !== null) result.push(value as T);
  return result;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
