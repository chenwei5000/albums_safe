'use client';
/* oxlint-disable react/react-compiler -- API hydration updates client form state after mount */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FolderPlus, ImageUp, LoaderCircle, Plus, UploadCloud, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { Category } from '@/lib/edge-storage';

type UploadedImage = { url: string; name: string; key: string };
const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777'];

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    const response = await fetch('/api/categories');
    if (!response.ok) return;
    const data = (await response.json()) as Category[];
    setCategories(data);
    setCategoryId((current) => current || data[0]?.id || '');
  }, []);
  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true); setError(''); setUploaded(null);
    try {
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = (await response.json().catch(() => null)) as (UploadedImage & { error?: string }) | null;
      if (response.ok && result) setUploaded(result);
      else setError(result?.error ?? '图片上传失败，请稍后重试');
    } catch {
      setError('图片上传失败，请检查网络后重试');
    } finally {
      setUploading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategory.trim()) return;
    setCreatingCategory(true); setError('');
    const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.trim(), color: colors[categories.length % colors.length] }) });
    const result = (await response.json()) as Category & { error?: string };
    if (response.ok) { setCategories((current) => [...current, result]); setCategoryId(result.id); setNewCategory(''); } else setError(result.error ?? '分类创建失败');
    setCreatingCategory(false);
  };

  const submit = async () => {
    if (!title.trim() || !categoryId || !uploaded) return;
    setSubmitting(true); setError('');
    const response = await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), categoryId, imageUrl: uploaded.url, imageName: uploaded.name }) });
    const result = (await response.json()) as { error?: string };
    if (response.ok) { router.push('/'); router.refresh(); return; }
    setError(result.error ?? '数据添加失败'); setSubmitting(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <section>
        <Label htmlFor="image-file" className="mb-3 block text-sm font-semibold">图片 <span className="text-destructive">*</span></Label>
        {uploaded ? (
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border bg-muted shadow-sm sm:min-h-[560px]"><Image src={uploaded.url} alt="已上传图片预览" fill unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white"><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-emerald-300" />上传完成</p><p className="mt-1 truncate text-xs text-white/70">{uploaded.name}</p></div><Button variant="outline" size="sm" className="border-white/20 bg-black/20 text-white hover:bg-black/40" onClick={() => { setUploaded(null); if (inputRef.current) inputRef.current.value = ''; }}><X />重新选择</Button></div></div>
        ) : (
          <label htmlFor="image-file" className="group flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-card p-8 text-center shadow-sm transition hover:border-primary/60 hover:bg-primary/[0.025] sm:min-h-[560px]">
            <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition group-hover:scale-105"><UploadCloud className="size-7" /></span><h2 className="font-heading text-xl font-semibold">{uploading ? '图片上传中…' : '点击选择图片'}</h2><p className="mt-2 text-sm text-muted-foreground">选择后将自动上传到 Blob</p><Badge variant="outline" className="mt-5">PNG、JPG、WebP、GIF · 最大 8MB</Badge>{uploading && <LoaderCircle className="mt-5 size-5 animate-spin text-primary" />}
          </label>
        )}
        <input ref={inputRef} id="image-file" type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={(event) => void uploadFile(event.target.files?.[0])} />
      </section>

      <section className="h-fit rounded-3xl border bg-card p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
        <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Image details</p><h2 className="mt-2 font-heading text-2xl font-bold tracking-tight">完善影集信息</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">填写标题、选择分类，确认图片后即可添加。</p></div>
        <div className="space-y-6">
          <div className="space-y-2"><Label htmlFor="title">标题 <span className="text-destructive">*</span></Label><Input id="title" className="h-11" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="为这张图片起个标题" /><p className="text-right text-xs text-muted-foreground">{title.length}/80</p></div>
          <div className="space-y-2"><Label htmlFor="category">分类 <span className="text-destructive">*</span></Label><NativeSelect id="category" className="w-full" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><NativeSelectOption value="">请选择分类</NativeSelectOption>{categories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}</NativeSelect></div>
          <div className="rounded-2xl border bg-muted/35 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><FolderPlus className="size-4 text-primary" />自定义创建分类</div><div className="flex gap-2"><Input value={newCategory} maxLength={30} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void createCategory(); } }} placeholder="输入新分类名称" /><Button variant="secondary" onClick={() => void createCategory()} disabled={!newCategory.trim() || creatingCategory}>{creatingCategory ? <LoaderCircle className="animate-spin" /> : <Plus />}创建</Button></div></div>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button size="lg" className="h-12 w-full text-base" onClick={() => void submit()} disabled={!title.trim() || !categoryId || !uploaded || uploading || submitting}>{submitting ? <LoaderCircle className="animate-spin" /> : <ImageUp />}{submitting ? '正在添加…' : '添加到影集'}</Button>
          <p className="text-center text-xs text-muted-foreground">添加成功后将自动返回首页列表</p>
        </div>
      </section>
    </div>
  );
}
