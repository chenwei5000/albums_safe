import { bindings } from '@/lib/edge-storage';

export async function GET(_request: Request, context: { params: Promise<{ key: string }> | { key: string } }) {
  const params = await context.params;
  const object = await bindings.BLOB.get(decodeURIComponent(params.key));
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
