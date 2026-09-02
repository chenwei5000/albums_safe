import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryManager } from '@/components/category-manager';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: '分类管理 · Album Safe' };

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-5 -ml-2" render={<Link href="/" prefetch={false} />}><ArrowLeft />返回影集</Button>
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">分类管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">在这里添加、重命名或删除分类。删除分类会同时清空该分类下的全部影集数据，请谨慎操作。</p>
        </div>
        <CategoryManager />
      </div>
    </main>
  );
}