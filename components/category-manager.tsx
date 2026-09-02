'use client';
/* oxlint-disable react/react-compiler -- API hydration updates client state after mount */

import { useCallback, useEffect, useState } from 'react';
import { Check, LoaderCircle, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Category, Entry } from '@/lib/edge-storage';

const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777'];
const DEFAULT_PANEL = '#1b1d2e';
const DEFAULT_ACCENT = '#c9a24a';

function ColorPick({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5" />
      {label}
    </label>
  );
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(colors[0]);
  const [newPanel, setNewPanel] = useState(DEFAULT_PANEL);
  const [newAccent, setNewAccent] = useState(DEFAULT_ACCENT);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState(colors[0]);
  const [editingPanel, setEditingPanel] = useState(DEFAULT_PANEL);
  const [editingAccent, setEditingAccent] = useState(DEFAULT_ACCENT);
  const [savingId, setSavingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [categoryResponse, entryResponse] = await Promise.all([fetch('/api/categories'), fetch('/api/entries')]);
      if (categoryResponse.ok) setCategories((await categoryResponse.json()) as Category[]);
      if (entryResponse.ok) setEntries((await entryResponse.json()) as Entry[]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const countOf = (id: string) => entries.filter((entry) => entry.categoryId === id).length;

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true); setError('');
    const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color: newColor, panelColor: newPanel, accentColor: newAccent }) });
    const result = (await response.json()) as Category & { error?: string };
    if (response.ok) { setCategories((current) => [...current, result]); setNewName(''); } else setError(result.error ?? '分类创建失败');
    setAdding(false);
  };

  const startEdit = (category: Category) => { setEditingId(category.id); setEditingName(category.name); setEditingColor(category.color || colors[0]); setEditingPanel(category.panelColor || DEFAULT_PANEL); setEditingAccent(category.accentColor || DEFAULT_ACCENT); };
  const cancelEdit = () => { setEditingId(''); setEditingName(''); };

  const saveEdit = async (category: Category) => {
    const name = editingName.trim();
    if (!name) { cancelEdit(); return; }
    setSavingId(category.id); setError('');
    const response = await fetch(`/api/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color: editingColor, panelColor: editingPanel, accentColor: editingAccent }) });
    const result = (await response.json()) as Category & { error?: string };
    if (response.ok) {
      setCategories((current) => current.map((item) => (item.id === category.id ? result : item)));
      setEntries((current) => current.map((entry) => (entry.categoryId === category.id ? { ...entry, categoryName: result.name } : entry)));
      cancelEdit();
    } else setError(result.error ?? '分类重命名失败');
    setSavingId('');
  };

  const removeCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setError('');
    const response = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
    if (response.ok) {
      setCategories((current) => current.filter((item) => item.id !== deleteTarget.id));
      setEntries((current) => current.filter((entry) => entry.categoryId !== deleteTarget.id));
      setDeleteTarget(null); setDeleting(false);
      return;
    }
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(result?.error ?? '分类删除失败'); setDeleting(false);
  };

  const deleteCount = deleteTarget ? countOf(deleteTarget.id) : 0;

  return (
    <div>
      <div className="mb-5 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex gap-2">
          <Input value={newName} maxLength={30} placeholder="输入新分类名称" onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addCategory(); } }} />
          <Button onClick={() => void addCategory()} disabled={!newName.trim() || adding} className="shrink-0">{adding ? <LoaderCircle className="animate-spin" /> : <Plus />}添加分类</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <ColorPick label="分类标识色" value={newColor} onChange={setNewColor} />
          <ColorPick label="大卡片面板色" value={newPanel} onChange={setNewPanel} />
          <ColorPick label="顶部装饰线色" value={newAccent} onChange={setNewAccent} />
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : categories.length ? (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              {editingId === category.id ? (
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input autoFocus className="h-10 flex-1" maxLength={30} value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void saveEdit(category); } if (event.key === 'Escape') cancelEdit(); }} />
                    <Button size="icon" variant="ghost" className="text-primary" disabled={savingId === category.id || !editingName.trim()} onClick={() => void saveEdit(category)}>{savingId === category.id ? <LoaderCircle className="animate-spin" /> : <Check />}</Button>
                    <Button size="icon" variant="ghost" disabled={savingId === category.id} onClick={cancelEdit}><X /></Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <ColorPick label="标识色" value={editingColor} onChange={setEditingColor} />
                    <ColorPick label="面板色" value={editingPanel} onChange={setEditingPanel} />
                    <ColorPick label="装饰线色" value={editingAccent} onChange={setEditingAccent} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{category.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: category.color }} />标识</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: category.accentColor || DEFAULT_ACCENT }} />装饰线</span>
                      <span>{countOf(category.id)} 条数据</span>
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(category)} aria-label={`重命名分类 ${category.name}`}><Pencil /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`删除分类 ${category.name}`} onClick={() => { setError(''); setDeleteTarget(category); }}><Trash2 /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-10 text-center">
          <div><span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Tags className="size-5" /></span><p className="text-sm font-medium">还没有分类</p><p className="mt-1 text-xs text-muted-foreground">在上方输入名称，添加第一个分类吧。</p></div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!deleting && !open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 /></AlertDialogMedia>
            <AlertDialogTitle>确认删除分类“{deleteTarget?.name}”？</AlertDialogTitle>
            <AlertDialogDescription>删除后，该分类下的 {deleteCount} 条影集数据及对应图片都会被一并清空，此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void removeCategory()}>{deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{deleting ? '正在删除…' : '确认删除'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}