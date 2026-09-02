import { getImage, imageContentType } from '@/lib/edge-storage';

export async function GET(_request: Request, context: { params: Promise<{ key: string }> | { key: string } }) {
  const params = await context.params;
  const key = decodeURIComponent(params.key);
  const image = await getImage(key);
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(image.body, {
    headers: {
      'content-type': imageContentType(key),
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
