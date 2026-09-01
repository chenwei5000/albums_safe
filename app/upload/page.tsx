import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { UploadForm } from '@/components/upload-form';
import { Button } from '@/components/ui/button';

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background text-foreground"><SiteHeader /><div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"><Button variant="ghost" className="mb-5 -ml-2" render={<Link href="/" />}><ArrowLeft />返回影集</Button><div className="mb-8"><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">添加一张新图片</h1><p className="mt-2 text-sm text-muted-foreground">图片选择后自动上传，最后确认信息并添加。</p></div><UploadForm /></div></main>
  );
}
