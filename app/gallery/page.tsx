'use client';
/* oxlint-disable react/react-compiler -- API hydration updates client state after mount */

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Settings, Trash2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Category, Entry } from '@/lib/edge-storage';

const hasContent = (html?: string) => !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

export default function GalleryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [entryResponse, categoryResponse] = await Promise.all([fetch('/api/entries'), fetch('/api/categories')]);
      const entryData = entryResponse.ok ? ((await entryResponse.json()) as Entry[]) : [];
      const categoryData = categoryResponse.ok ? ((await categoryResponse.json()) as Category[]) : [];
      setEntries(entryData);
      setCategories(categoryData);
      // activeId 为 '' 表示“全部分类”；若原选中分类已被删除则回退到全部
      setActiveId((current) => (current && categoryData.some((category) => category.id === current) ? current : ''));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  // activeId 为 '' 时表示“全部分类”，右侧展示全部作品
  const list = useMemo(() => (activeId ? entries.filter((entry) => entry.categoryId === activeId) : entries), [entries, activeId]);
  const selected = list.find((entry) => entry.id === selectedId) ?? null;
  const selectedIndex = selected ? list.findIndex((entry) => entry.id === selected.id) : -1;
  const selectedCategory = selected ? (categories.find((category) => category.id === selected.categoryId) ?? null) : null;

  const selectCategory = (id: string) => { setActiveId(id); setSelectedId(null); };
  const goPrev = () => { if (selectedIndex > 0) setSelectedId(list[selectedIndex - 1].id); };
  const goNext = () => { if (selectedIndex < list.length - 1) setSelectedId(list[selectedIndex + 1].id); };

  const editSelected = () => { if (selected) router.push(`/albums/${selected.id}/edit`); };
  const removeSelected = async () => {
    if (!selected) return;
    setDeleting(true); setDeleteError('');
    try {
      const response = await fetch(`/api/entries/${selected.id}`, { method: 'DELETE' });
      if (response.ok) {
        setConfirmDelete(false);
        setSelectedId(null);
        await refresh();
        return;
      }
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setDeleteError(result?.error ?? '删除失败，请稍后重试');
    } catch {
      setDeleteError('网络异常，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const panel = selectedCategory?.panelColor || '#1b1d2e';
  const accent = selectedCategory?.accentColor || '#c9a24a';

  return (
    <main className="relative min-h-screen bg-transparent text-foreground">
      <SiteHeader />
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* 左右布局：左侧分类菜单（首项为“全部分类”，其下为细分分类），右侧为缩略图内容区 */}
        <div className="flex gap-4 sm:gap-8">
          <aside className="w-24 shrink-0 sm:w-36 lg:w-40">
            <nav className="sticky top-24 flex flex-col gap-0.5 sm:gap-1">
              <button type="button" onClick={() => selectCategory('')}
                className="block w-full truncate py-1.5 text-left text-sm font-normal tracking-wide transition hover:opacity-75 sm:text-base"
                style={{ color: activeId === '' ? '#c9a24a' : '#ffffff', fontFamily: '"NSimSun","SimSun","新宋体",serif' }}>
                全部分类
              </button>
              {categories.map((category) => {
                const active = category.id === activeId;
                return (
                  <button key={category.id} type="button" onClick={() => selectCategory(category.id)}
                    className="block w-full truncate py-1.5 text-left text-sm font-normal tracking-wide transition hover:opacity-75 sm:text-base"
                    style={{ color: active ? (category.accentColor || '#c9a24a') : '#ffffff', fontFamily: '"NSimSun","SimSun","新宋体",serif' }}>
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : selected && selectedCategory ? (
          /* ————— 原地大卡片 ————— */
          <article className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl" style={{ backgroundColor: panel }}>
            <div className="h-1 w-full" style={{ backgroundColor: accent }} />
            <div className="absolute right-4 top-4 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger aria-label="图片设置" className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/30 text-white/85 backdrop-blur transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                  <Settings className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="min-w-36">
                  <DropdownMenuItem onClick={editSelected}><Pencil />编辑图片</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 />删除图片</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="p-5 sm:p-8">
              {/* 面包屑 */}
              <nav className="mb-6 flex flex-wrap items-center gap-2 pr-12 text-xs text-white/55">
                <button type="button" onClick={() => setSelectedId(null)} className="transition hover:text-white">画廊</button>
                <span>/</span>
                <button type="button" onClick={() => setSelectedId(null)} className="transition hover:text-white">{selectedCategory.name}</button>
                <span>/</span>
                <span className="max-w-[40vw] truncate text-white/90">{selected.title}</span>
              </nav>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                {/* 左侧图片，点击大图预览 */}
                <button type="button" onClick={() => setPreview(true)} className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-lg border border-white/10 bg-black/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60">
                  <Image src={selected.imageUrl} alt={selected.title} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" />
                </button>

                {/* 右侧信息 */}
                <div className="text-white">
                  <h2 className="text-2xl font-normal leading-tight sm:text-3xl" style={{ color: selected.titleColor || '#d4af37', fontFamily: '"NSimSun","SimSun","新宋体",serif' }}>{selected.title}</h2>
                  <div className="mt-3 flex items-center gap-2" aria-hidden>
                    <span className="h-0.5 w-10 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="size-1.5 rotate-45" style={{ backgroundColor: accent }} />
                    <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${accent}66, transparent)` }} />
                  </div>
                  {hasContent(selected.productDesc) && <div className="rich-text rich-text-colored mt-4 text-[0.95rem] leading-7" style={{ color: selected.productDescColor || '#ffffff' }} dangerouslySetInnerHTML={{ __html: selected.productDesc }} />}
                  {hasContent(selected.productIntro) && <div className="rich-text rich-text-colored mt-3 text-[0.95rem] leading-7" style={{ color: selected.productIntroColor || '#ffffff' }} dangerouslySetInnerHTML={{ __html: selected.productIntro }} />}
                  {(selected.otherNotes?.trim() || (selected.tags ?? []).length > 0) && <hr className="my-5 border-white/15" />}
                  {selected.otherNotes?.trim() && <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: selected.otherNotesColor || '#ffffff' }}>{selected.otherNotes}</p>}
                  {(selected.tags ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.tags.map((tag) => <span key={tag} className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs" style={{ color: selected.tagsColor || '#ffffff' }}>{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>

              {/* 右下角：上一张/下一张 + 排序/总数 */}
              <div className="mt-7 flex items-center justify-end gap-4">
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label="上一张" disabled={selectedIndex <= 0} onClick={goPrev} className="grid size-8 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="size-4" /></button>
                  <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-white/65">{selectedIndex + 1} / {list.length}</span>
                  <button type="button" aria-label="下一张" disabled={selectedIndex >= list.length - 1} onClick={goNext} className="grid size-8 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 disabled:opacity-30"><ChevronRight className="size-4" /></button>
                </div>
              </div>
            </div>

            <Dialog open={preview} onOpenChange={setPreview}>
              <DialogContent className="h-[92vh] max-w-[96vw] border-white/10 bg-black/90 p-2 text-white sm:max-w-[96vw]" showCloseButton>
                <DialogHeader className="sr-only"><DialogTitle>{selected.title}</DialogTitle><DialogDescription>图片大图预览</DialogDescription></DialogHeader>
                <div className="relative h-full w-full"><Image src={selected.imageUrl} alt={selected.title} fill unoptimized sizes="96vw" className="object-contain" /></div>
              </DialogContent>
            </Dialog>

            <AlertDialog open={confirmDelete} onOpenChange={(open) => { setConfirmDelete(open); if (!open) setDeleteError(''); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除“{selected.title}”？</AlertDialogTitle>
                  <AlertDialogDescription>这会永久删除该条数据及其图片文件，操作无法撤销。</AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void removeSelected()}>{deleting ? '正在删除…' : '确认删除'}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </article>
        ) : list.length ? (
          /* ————— 缩略图网格 ————— */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {list.map((entry) => (
              <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)}
                className="group relative block w-full overflow-hidden rounded-md border border-white/10 bg-muted shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={entry.imageUrl} alt={entry.title} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <h3 className="truncate text-left text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">{entry.title}</h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
            <div>
              <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/10 text-white/80"><ImagePlus className="size-5" /></span>
              <h2 className="font-heading text-xl font-semibold">{activeId ? '该分类下还没有作品' : '还没有任何作品'}</h2>
              <p className="mb-5 mt-2 text-sm text-muted-foreground">切换其他分类，或前往上传页面添加作品。</p>
              <Button render={<Link href="/upload" prefetch={false} />}>去上传作品</Button>
            </div>
          </div>
        )}
          </div>
        </div>
      </section>
    </main>
  );
}