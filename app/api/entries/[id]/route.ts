import { bindings, type Entry } from '@/lib/edge-storage';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await context.params;
  const entry = await bindings.ALBUM_KV.get<Entry>(`entry:${params.id}`, 'json');
  if (!entry) return Response.json({ error: '数据不存在' }, { status: 404 });
  return Response.json(entry);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await context.params;
  const storageKey = `entry:${params.id}`;
  const entry = await bindings.ALBUM_KV.get<Entry>(storageKey, 'json');
  if (!entry) return Response.json({ error: '数据不存在' }, { status: 404 });
  const imageKey = entry.imageUrl.startsWith('/api/images/') ? decodeURIComponent(entry.imageUrl.slice('/api/images/'.length)) : '';
  await Promise.all([bindings.ALBUM_KV.delete(storageKey), imageKey ? bindings.BLOB.delete(imageKey) : Promise.resolve()]);
  return new Response(null, { status: 204 });
}
