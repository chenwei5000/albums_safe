'use client';
/* oxlint-disable react/react-compiler -- API hydration updates client state after mount */

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ImagePlus, Search } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Category, Entry } from '@/lib/edge-storage';

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [entryResponse, categoryResponse] = await Promise.all([fetch('/api/entries'), fetch('/api/categories')]);
      if (entryResponse.ok) setEntries((await entryResponse.json()) as Entry[]);
      if (categoryResponse.ok) setCategories((await categoryResponse.json()) as Category[]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => entries.filter((entry) => (categoryId === 'all' || entry.categoryId === categoryId) && `${entry.title}${entry.categoryName}`.toLowerCase().includes(query.toLowerCase())), [categoryId, entries, query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your visual archive</p><h1 className="font-heading text-3xl font-bold tracking-[-0.035em] sm:text-5xl">收藏每一个值得记住的瞬间</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">以瀑布流浏览全部影集，点击任意卡片查看高清图片与完整信息。</p></div>
          <div className="relative w-full shrink-0 sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 rounded-xl bg-card pl-9 shadow-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或分类" /></div>
        </div>

        <div className="mb-7 -mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="按分类筛选">
          <div className="flex w-max items-center gap-2">
            <Button variant={categoryId === 'all' ? 'default' : 'outline'} className="rounded-full" onClick={() => setCategoryId('all')}>全部 <span className="ml-1 opacity-70">{entries.length}</span></Button>
            {categories.map((category) => { const count = entries.filter((entry) => entry.categoryId === category.id).length; return <Button key={category.id} variant={categoryId === category.id ? 'default' : 'outline'} className="rounded-full" onClick={() => setCategoryId(category.id)}><span className="size-2 rounded-full" style={{ backgroundColor: categoryId === category.id ? 'currentColor' : category.color }} />{category.name}<span className="ml-1 opacity-70">{count}</span></Button>; })}
          </div>
        </div>

        {loading ? <div className="columns-1 gap-5 sm:columns-2 lg:columns-3"><div className="mb-5 h-80 break-inside-avoid animate-pulse rounded-2xl bg-muted" /><div className="mb-5 h-64 break-inside-avoid animate-pulse rounded-2xl bg-muted" /><div className="mb-5 h-96 break-inside-avoid animate-pulse rounded-2xl bg-muted" /></div> : filtered.length ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {filtered.map((entry, index) => (
              <Link key={entry.id} href={`/albums/${entry.id}`} className="group mb-5 block break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <div className={`relative overflow-hidden bg-muted ${index % 5 === 0 ? 'aspect-[4/5]' : index % 3 === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                  <Image src={entry.imageUrl} alt={entry.title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute right-3 top-3 grid size-9 translate-y-1 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="size-4" /></span>
                </div>
                <div className="p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><Badge variant="secondary">{entry.categoryName}</Badge><time className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(entry.createdAt))}</time></div><h2 className="font-heading text-lg font-semibold leading-snug tracking-tight">{entry.title}</h2></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed bg-card/50 p-8 text-center"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><ImagePlus className="size-5" /></span><h2 className="font-heading text-xl font-semibold">{query || categoryId !== 'all' ? '当前筛选下没有影集' : '从第一张图片开始'}</h2><p className="mb-5 mt-2 text-sm text-muted-foreground">{query || categoryId !== 'all' ? '切换分类或换个关键词试试。' : '上传图片并添加标题，内容会出现在这里。'}</p>{!query && categoryId === 'all' && <Button render={<Link href="/upload" />}><ImagePlus />上传第一张图片</Button>}</div></div>
        )}
      </section>
    </main>
  );
}
