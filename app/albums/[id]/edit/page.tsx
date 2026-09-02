import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { UploadForm } from '@/components/upload-form';
import { Button } from '@/components/ui/button';
import { getJson, type Entry } from '@/lib/edge-storage';

async function getEntry(id: string) {
  return getJson<Entry>('entries', id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) return { title: '编辑图片 · Album Safe' };
  return { title: `编辑：${entry.title} · Album Safe` };
}

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-5 -ml-2" render={<Link href="/gallery" prefetch={false} />}>
          <ArrowLeft />返回画廊
        </Button>
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">编辑图片</h1>
          <p className="mt-2 text-sm text-muted-foreground">修改标题、说明或更换图片，保存后即刻生效。</p>
        </div>
        <UploadForm initialEntry={entry} />
      </div>
    </main>
  );
}