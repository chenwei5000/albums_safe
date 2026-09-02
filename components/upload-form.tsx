'use client';
/* oxlint-disable react/react-compiler -- API hydration updates client form state after mount */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ImageUp, LoaderCircle, Plus, UploadCloud, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import type { Category, Entry } from '@/lib/edge-storage';

type UploadedImage = { url: string; name: string; key: string };
const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777'];

// 文案颜色预设：大卡片为深色面板，提供适合深底的文字色
const TEXT_COLOR_PRESETS = ['#ffffff', '#f3d98b', '#d4af37', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#22d3ee', '#10b981'];

function TextColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">文字颜色</span>
      <div className="flex items-center gap-1">
        {TEXT_COLOR_PRESETS.map((color) => (
          <button key={color} type="button" title={color} aria-label={`文字颜色 ${color}`} onClick={() => onChange(color)}
            className={`size-4 rounded-full border transition hover:scale-125 ${value.toLowerCase() === color.toLowerCase() ? 'border-transparent ring-2 ring-primary ring-offset-1 ring-offset-card' : 'border-black/10'}`}
            style={{ backgroundColor: color }} />
        ))}
        <label className="relative size-4 cursor-pointer overflow-hidden rounded-full border border-dashed border-muted-foreground/60" title="自定义颜色" style={{ backgroundColor: value }}>
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  );
}

export function UploadForm({ initialEntry }: { initialEntry?: Entry } = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initialEntry);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initialEntry?.title ?? '');
  const [productDesc, setProductDesc] = useState(initialEntry?.productDesc ?? '');
  const [productIntro, setProductIntro] = useState(initialEntry?.productIntro ?? '');
  const [otherNotes, setOtherNotes] = useState(initialEntry?.otherNotes ?? '');
  const [tagsInput, setTagsInput] = useState((initialEntry?.tags ?? []).join(', '));
  const [titleColor, setTitleColor] = useState(initialEntry?.titleColor || '#d4af37');
  const [productDescColor, setProductDescColor] = useState(initialEntry?.productDescColor || '#ffffff');
  const [productIntroColor, setProductIntroColor] = useState(initialEntry?.productIntroColor || '#ffffff');
  const [otherNotesColor, setOtherNotesColor] = useState(initialEntry?.otherNotesColor || '#ffffff');
  const [tagsColor, setTagsColor] = useState(initialEntry?.tagsColor || '#ffffff');
  const [categoryName, setCategoryName] = useState(initialEntry?.categoryName ?? '');
  const [categoryId, setCategoryId] = useState(initialEntry?.categoryId ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedImage | null>(
    initialEntry ? { url: initialEntry.imageUrl, name: initialEntry.imageName, key: '' } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    const response = await fetch('/api/categories');
    if (!response.ok) return;
    const data = (await response.json()) as Category[];
    setCategories(data);
    setCategoryId((current) => current || data[0]?.id || '');
    setCategoryName((current) => current || data[0]?.name || '');
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

  // 组合框下拉状态：按输入过滤；输入名与已有分类不匹配时，提交阶段先创建分类
  const categoryQuery = categoryName.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(categoryQuery));
  const exactMatch = categories.some((category) => category.name.toLowerCase() === categoryQuery);
  const willCreateCategory = categoryName.trim().length > 0 && !exactMatch;

  const introFilled = productIntro.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

  const submit = async () => {
    const name = categoryName.trim();
    if (!title.trim() || !name || !uploaded || !introFilled) return;
    const tags = tagsInput.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
    setSubmitting(true); setError('');
    try {
      let resolvedId = categoryId;
      const selected = categories.find((category) => category.id === categoryId);
      if (!selected || selected.name.toLowerCase() !== name.toLowerCase()) {
        const existing = categories.find((category) => category.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          resolvedId = existing.id;
        } else {
          const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color: colors[categories.length % colors.length] }) });
          const result = (await response.json()) as Category & { error?: string };
          if (!response.ok) { setError(result.error ?? '分类创建失败'); setSubmitting(false); return; }
          resolvedId = result.id;
        }
      }
      const payload = { title: title.trim(), titleColor, productDesc, productDescColor, productIntro, productIntroColor, otherNotes: otherNotes.trim(), otherNotesColor, tags, tagsColor, categoryId: resolvedId, imageUrl: uploaded.url, imageName: uploaded.name };
      const response = isEdit && initialEntry
        ? await fetch(`/api/entries/${initialEntry.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = (await response.json()) as { error?: string };
      if (response.ok) { router.push('/gallery'); router.refresh(); return; }
      setError(result.error ?? (isEdit ? '保存失败' : '数据添加失败'));
    } catch {
      setError('网络异常，请稍后重试');
    }
    setSubmitting(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <section>
        <Label htmlFor="image-file" className="mb-3 block text-sm font-semibold">图片 <span className="text-destructive">*</span></Label>
        {uploaded ? (
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border bg-muted shadow-sm sm:min-h-[560px]"><Image src={uploaded.url} alt="已上传图片预览" fill unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white"><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-emerald-300" />{isEdit ? '当前图片' : '上传完成'}</p><p className="mt-1 truncate text-xs text-white/70">{uploaded.name}</p></div><Button variant="outline" size="sm" className="border-white/20 bg-black/20 text-white hover:bg-black/40" onClick={() => { setUploaded(null); if (inputRef.current) inputRef.current.value = ''; }}><X />{isEdit ? '更换图片' : '重新选择'}</Button></div></div>
        ) : (
          <label htmlFor="image-file" className="group flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-card p-8 text-center shadow-sm transition hover:border-primary/60 hover:bg-primary/[0.025] sm:min-h-[560px]">
            <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition group-hover:scale-105"><UploadCloud className="size-7" /></span><h2 className="font-heading text-xl font-semibold">{uploading ? '图片上传中…' : '点击选择图片'}</h2><p className="mt-2 text-sm text-muted-foreground">选择后将自动上传到 Blob</p><Badge variant="outline" className="mt-5">PNG、JPG、WebP、GIF · 最大 8MB</Badge>{uploading && <LoaderCircle className="mt-5 size-5 animate-spin text-primary" />}
          </label>
        )}
        <input ref={inputRef} id="image-file" type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={(event) => void uploadFile(event.target.files?.[0])} />
      </section>

      <section className="h-fit rounded-3xl border bg-card p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
        <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Image details</p><h2 className="mt-2 font-heading text-2xl font-bold tracking-tight">{isEdit ? '编辑影集信息' : '完善影集信息'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{isEdit ? '修改标题、分类或更换图片，确认后保存。' : '填写标题、选择或输入分类，确认图片后即可添加。'}</p></div>
        <div className="space-y-6">
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="title">主标题 <span className="text-destructive">*</span></Label><TextColorPicker value={titleColor} onChange={setTitleColor} /></div><Input id="title" className="h-11" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="为作品起个标题" /><p className="text-right text-xs text-muted-foreground">{title.length}/80</p></div>
          <div className="space-y-2">
            <Label htmlFor="category">分类 <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input id="category" className="h-11 pr-9" autoComplete="off" maxLength={30} value={categoryName} placeholder="选择或输入新分类" onChange={(event) => { setCategoryName(event.target.value); setCategoryId(''); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)} onBlur={() => setTimeout(() => setPickerOpen(false), 120)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); if (event.key === 'Escape') setPickerOpen(false); }} />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              {pickerOpen && (filteredCategories.length > 0 || willCreateCategory) && (
                <div className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg" onMouseDown={(event) => event.preventDefault()}>
                  {filteredCategories.map((category) => (
                    <button key={category.id} type="button" onClick={() => { setCategoryId(category.id); setCategoryName(category.name); setPickerOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="truncate">{category.name}</span>
                      {category.id === categoryId && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                  {willCreateCategory && (
                    <button type="button" onClick={() => { setCategoryId(''); setPickerOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-primary transition hover:bg-accent">
                      <Plus className="size-4 shrink-0" /><span className="truncate">创建新分类「{categoryName.trim()}」</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{willCreateCategory ? <>添加时将自动创建新分类「{categoryName.trim()}」</> : '可直接选择已有分类，或输入名称创建新分类'}</p>
          </div>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label>产品说明</Label><TextColorPicker value={productDescColor} onChange={setProductDescColor} /></div><RichTextEditor value={productDesc} onChange={setProductDesc} placeholder="简要说明产品（选填，支持排版与插图）" /></div>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label>产品介绍 <span className="text-destructive">*</span></Label><TextColorPicker value={productIntroColor} onChange={setProductIntroColor} /></div><RichTextEditor value={productIntro} onChange={setProductIntro} placeholder="详细介绍产品，支持排版与插图（必填）" />{!introFilled && <p className="text-xs text-destructive">产品介绍为必填项</p>}</div>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="notes">其他说明</Label><TextColorPicker value={otherNotesColor} onChange={setOtherNotesColor} /></div><Textarea id="notes" className="min-h-20" maxLength={500} value={otherNotes} onChange={(event) => setOtherNotes(event.target.value)} placeholder="其他需要补充的说明（选填）" /></div>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="tags">品牌标签</Label><TextColorPicker value={tagsColor} onChange={setTagsColor} /></div><Input id="tags" className="h-11" value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="多个标签用逗号分隔，如：高端, 限量" /></div>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <Button size="lg" className="h-12 w-full text-base" onClick={() => void submit()} disabled={!title.trim() || !categoryName.trim() || !introFilled || !uploaded || uploading || submitting}>{submitting ? <LoaderCircle className="animate-spin" /> : <ImageUp />}{submitting ? (isEdit ? '正在保存…' : '正在添加…') : isEdit ? '保存修改' : '添加到影集'}</Button>
          <p className="text-center text-xs text-muted-foreground">{isEdit ? '保存成功后自动返回画廊' : '添加成功后将自动返回画廊'}</p>
        </div>
      </section>
    </div>
  );
}
