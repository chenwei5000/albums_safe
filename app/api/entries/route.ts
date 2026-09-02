import { getJson, jsonError, listJson, putJson, type Category, type Entry } from '@/lib/edge-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await listJson<Entry>('entries');
  return Response.json(entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { title?: string; productDesc?: string; productIntro?: string; otherNotes?: string; tags?: string[]; categoryId?: string; imageUrl?: string; imageName?: string } | null;
  const title = payload?.title?.trim();
  if (!title || title.length > 80) return jsonError('主标题须为 1–80 个字符');
  const productDesc = typeof payload?.productDesc === 'string' ? payload.productDesc : '';
  const productIntro = typeof payload?.productIntro === 'string' ? payload.productIntro : '';
  const stripTags = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!stripTags(productIntro)) return jsonError('产品介绍不能为空');
  const otherNotes = payload?.otherNotes?.trim().slice(0, 500) ?? '';
  const tags = Array.isArray(payload?.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [];
  if (!payload?.categoryId || !payload.imageUrl?.startsWith('/api/images/') || !payload.imageName) return jsonError('分类和图片不能为空');
  const category = await getJson<Category>('categories', payload.categoryId);
  if (!category) return jsonError('所选分类不存在', 404);
  const entry: Entry = { id: crypto.randomUUID(), title, subtitle: '', productDesc, productIntro, otherNotes, tags, categoryId: category.id, categoryName: category.name, imageUrl: payload.imageUrl, imageName: payload.imageName, createdAt: new Date().toISOString() };
  try {
    await putJson('entries', entry.id, entry);
  } catch (error) {
    console.error('[api/entries] 写入 Blob 失败：', error);
    return jsonError('内容保存失败，请稍后重试', 500);
  }
  return Response.json(entry, { status: 201 });
}
