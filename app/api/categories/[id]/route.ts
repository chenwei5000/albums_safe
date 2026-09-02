import { deleteImage, deleteJson, getJson, jsonError, listJson, putJson, type Category, type Entry } from '@/lib/edge-storage';

export const dynamic = 'force-dynamic';

// 从图片 URL（/api/images/<key>）解析存储 key
function imageKeyOf(entry: Entry): string {
  return entry.imageUrl.startsWith('/api/images/') ? decodeURIComponent(entry.imageUrl.slice('/api/images/'.length)) : '';
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await context.params;
  const category = await getJson<Category>('categories', id);
  if (!category) return jsonError('分类不存在', 404);

  const payload = (await request.json().catch(() => null)) as { name?: string; color?: string; panelColor?: string; accentColor?: string } | null;
  const name = payload?.name?.trim();
  if (!name || name.length > 30) return jsonError('分类名称须为 1–30 个字符');

  const all = await listJson<Category>('categories');
  if (all.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) return jsonError('分类名称已存在', 409);

  const hex = (value: string | undefined, fallback: string) => (value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback);
  const color = hex(payload?.color, category.color || '#4f46e5');
  const panelColor = hex(payload?.panelColor, category.panelColor || '#1b1d2e');
  const accentColor = hex(payload?.accentColor, category.accentColor || '#c9a24a');
  const updated: Category = { ...category, name, color, panelColor, accentColor };
  await putJson('categories', id, updated);

  // categoryName 冗余在 entries 上，重命名后逐条同步（串行写，避免整组读-改-写相互覆盖）
  const entries = await listJson<Entry>('entries');
  for (const entry of entries) {
    if (entry.categoryId === id) await putJson('entries', entry.id, { ...entry, categoryName: name });
  }
  return Response.json(updated);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await context.params;
  const category = await getJson<Category>('categories', id);
  if (!category) return jsonError('分类不存在', 404);

  // 级联删除：该分类下的全部数据及其图片都会被清空
  const entries = await listJson<Entry>('entries');
  const inCategory = entries.filter((entry) => entry.categoryId === id);
  for (const entry of inCategory) {
    await deleteJson('entries', entry.id);
  }
  await Promise.all(inCategory.map((entry) => {
    const key = imageKeyOf(entry);
    return key ? deleteImage(key) : Promise.resolve();
  }));
  await deleteJson('categories', id);
  return new Response(null, { status: 204 });
}