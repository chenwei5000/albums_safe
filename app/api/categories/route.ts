import { jsonError, listJson, putJson, type Category } from '@/lib/edge-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await listJson<Category>('categories');
  return Response.json(categories.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { name?: string; color?: string } | null;
  const name = payload?.name?.trim();
  if (!name || name.length > 30) return jsonError('分类名称须为 1–30 个字符');
  const existing = await listJson<Category>('categories');
  if (existing.some((category) => category.name.toLowerCase() === name.toLowerCase())) return jsonError('分类名称已存在', 409);
  const category: Category = { id: crypto.randomUUID(), name, color: /^#[0-9a-f]{6}$/i.test(payload?.color ?? '') ? payload!.color! : '#4f46e5', createdAt: new Date().toISOString() };
  await putJson('categories', category.id, category);
  return Response.json(category, { status: 201 });
}
