import { deleteImage, deleteJson, getJson, type Entry } from '@/lib/edge-storage';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await context.params;
  const entry = await getJson<Entry>('entries', params.id);
  if (!entry) return Response.json({ error: '数据不存在' }, { status: 404 });
  return Response.json(entry);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await context.params;
  const entry = await getJson<Entry>('entries', params.id);
  if (!entry) return Response.json({ error: '数据不存在' }, { status: 404 });
  const imageKey = entry.imageUrl.startsWith('/api/images/') ? decodeURIComponent(entry.imageUrl.slice('/api/images/'.length)) : '';
  await Promise.all([deleteJson('entries', params.id), imageKey ? deleteImage(imageKey) : Promise.resolve()]);
  return new Response(null, { status: 204 });
}
