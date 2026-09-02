import { jsonError, putImage } from '@/lib/edge-storage';

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('无法读取上传内容，请重新选择图片');
  }
  const file = form.get('file');
  if (!(file instanceof File)) return jsonError('请选择图片');
  if (!allowedTypes.has(file.type)) return jsonError('仅支持 PNG、JPG、WebP 或 GIF');
  if (file.size > 8 * 1024 * 1024) return jsonError('图片不能超过 8MB');
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  // key 保持扁平（不含 /）：URL 中不能出现 %2F，否则线上网关解码后无法匹配 /api/images/[key]
  const key = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}.${extension}`;
  try {
    // File 本身就是 Blob：缓冲后整体上传，避免流式请求体在云函数网关上 PUT 失败
    await putImage(key, file);
  } catch (error) {
    console.error('[api/upload] 写入 Blob 失败：', error);
    return jsonError('图片上传失败，请稍后重试', 500);
  }
  return Response.json({ key, name: file.name, url: `/api/images/${encodeURIComponent(key)}` }, { status: 201 });
}
