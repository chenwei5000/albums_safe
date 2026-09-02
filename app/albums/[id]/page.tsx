import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Folder } from 'lucide-react';
import { ImagePreview } from '@/components/image-preview';
import { DeleteEntryButton } from '@/components/delete-entry-button';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getJson, type Entry } from '@/lib/edge-storage';

async function getEntry(id: string) { return getJson<Entry>('entries', id); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) return { title: '影集不存在 · Album Safe' };
  return { title: `${entry.title} · Album Safe`, description: `${entry.categoryName}分类中的图片：${entry.title}`, openGraph: { title: entry.title, description: `${entry.categoryName} · Album Safe` }, twitter: { title: entry.title, description: `${entry.categoryName} · Album Safe`, images: [] } };
}

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();
  return (
    <main className="min-h-screen bg-background text-foreground"><SiteHeader /><div className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8"><Button variant="ghost" className="mb-5 -ml-2" render={<Link href="/" prefetch={false} />}><ArrowLeft />返回影集</Button><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><ImagePreview src={entry.imageUrl} alt={entry.title} /><aside className="h-fit lg:sticky lg:top-24"><Badge variant="secondary" className="mb-4"><Folder />{entry.categoryName}</Badge><h1 className="font-heading text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">{entry.title}</h1><div className="mt-7 space-y-4 border-t pt-5 text-sm text-muted-foreground"><p className="flex items-center gap-3"><CalendarDays className="size-4 text-primary" /><span>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(entry.createdAt))}</span></p><p className="truncate">文件：{entry.imageName}</p></div><div className="mt-8 rounded-2xl border bg-card p-4 text-sm leading-6 text-muted-foreground">点击左侧图片即可进入窗口级大图预览，再次关闭即可返回详情。</div><DeleteEntryButton id={entry.id} title={entry.title} /></aside></div></div></main>
  );
}
