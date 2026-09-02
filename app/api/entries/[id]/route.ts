import { deleteImage, deleteJson, getJson, jsonError, putJson, type Category, type Entry } from '@/lib/edge-storage';

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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await context.params;
  const existing = await getJson<Entry>('entries', params.id);
  if (!existing) return jsonError('数据不存在', 404);
  const payload = (await request.json().catch(() => null)) as { title?: string; productDesc?: string; productIntro?: string; otherNotes?: string; tags?: string[]; categoryId?: string; imageUrl?: string; imageName?: string } | null;
  const title = payload?.title?.trim();
  if (!title || title.length > 80) return jsonError('主标题须为 1–80 个字符');
  const productDesc = typeof payload?.productDesc === 'string' ? payload.productDesc : '';
  const productIntro = typeof payload?.productIntro === 'string' ? payload.productIntro : '';
  const stripTags = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!stripTags(productIntro)) return jsonError('产品介绍不能为空');
  const otherNotes = payload?.otherNotes?.trim().slice(0, 500) ?? '';
  const tags = Array.isArray(payload?.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [];
  if (!payload?.categoryId) return jsonError('分类不能为空');
  const category = await getJson<Category>('categories', payload.categoryId);
  if (!category) return jsonError('所选分类不存在', 404);
  // 图片可选：未传新图则保留原图；传了合法新图则替换
  let imageUrl = existing.imageUrl;
  let imageName = existing.imageName;
  if (payload.imageUrl) {
    if (!payload.imageUrl.startsWith('/api/images/') || !payload.imageName) return jsonError('图片不合法');
    imageUrl = payload.imageUrl;
    imageName = payload.imageName;
  }
  const updated: Entry = { ...existing, title, productDesc, productIntro, otherNotes, tags, categoryId: category.id, categoryName: category.name, imageUrl, imageName };
  try {
    await putJson('entries', params.id, updated);
  } catch (error) {
    console.error('[api/entries PUT] 写入 Blob 失败：', error);
    return jsonError('内容保存失败，请稍后重试', 500);
  }
  // 更换了图片则异步清理旧图片文件，失败不影响保存结果
  if (payload.imageUrl && existing.imageUrl !== imageUrl) {
    const oldKey = existing.imageUrl.startsWith('/api/images/') ? decodeURIComponent(existing.imageUrl.slice('/api/images/'.length)) : '';
    if (oldKey) await deleteImage(oldKey).catch((error) => console.warn('[api/entries PUT] 删除旧图片失败：', error));
  }
  return Response.json(updated);
}
