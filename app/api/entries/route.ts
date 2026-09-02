import { getJson, jsonError, listJson, putJson, type Category, type Entry } from '@/lib/edge-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await listJson<Entry>('entries');
  return Response.json(entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { title?: string; categoryId?: string; imageUrl?: string; imageName?: string } | null;
  const title = payload?.title?.trim();
  if (!title || title.length > 80) return jsonError('标题须为 1–80 个字符');
  if (!payload?.categoryId || !payload.imageUrl?.startsWith('/api/images/') || !payload.imageName) return jsonError('分类和图片不能为空');
  const category = await getJson<Category>('categories', payload.categoryId);
  if (!category) return jsonError('所选分类不存在', 404);
  const entry: Entry = { id: crypto.randomUUID(), title, categoryId: category.id, categoryName: category.name, imageUrl: payload.imageUrl, imageName: payload.imageName, createdAt: new Date().toISOString() };
  await putJson('entries', entry.id, entry);
  return Response.json(entry, { status: 201 });
}
