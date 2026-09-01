'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function DeleteEntryButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const remove = async () => {
    setDeleting(true); setError('');
    const response = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (response.ok) { router.push('/'); router.refresh(); return; }
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(result?.error ?? '删除失败，请稍后重试'); setDeleting(false);
  };

  return (
    <><Button variant="destructive" className="mt-8 w-full" onClick={() => setOpen(true)}><Trash2 />删除这条数据</Button><AlertDialog open={open} onOpenChange={setOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 /></AlertDialogMedia><AlertDialogTitle>确认删除“{title}”？</AlertDialogTitle><AlertDialogDescription>这会永久删除该条数据及其图片文件，操作无法撤销。</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void remove()}>{deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{deleting ? '正在删除…' : '确认删除'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>
  );
}
