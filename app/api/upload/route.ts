import { bindings, jsonError } from '@/lib/edge-storage';

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return jsonError('请选择图片');
  if (!allowedTypes.has(file.type)) return jsonError('仅支持 PNG、JPG、WebP 或 GIF');
  if (file.size > 8 * 1024 * 1024) return jsonError('图片不能超过 8MB');
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await bindings.BLOB.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name } });
  return Response.json({ key, name: file.name, url: `/api/images/${encodeURIComponent(key)}` }, { status: 201 });
}
