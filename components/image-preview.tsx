'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Expand } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <><button type="button" onClick={() => setOpen(true)} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-3xl border bg-muted shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><div className="relative min-h-[55vh] w-full sm:min-h-[70vh]"><Image src={src} alt={alt} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain" /></div><span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs font-medium text-white opacity-90 backdrop-blur transition group-hover:bg-black/70"><Expand className="size-3.5" />放大预览</span></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="h-[92vh] max-w-[96vw] border-white/10 bg-black/90 p-2 text-white sm:max-w-[96vw]" showCloseButton><DialogHeader className="sr-only"><DialogTitle>{alt}</DialogTitle><DialogDescription>图片大图预览</DialogDescription></DialogHeader><div className="relative h-full w-full"><Image src={src} alt={alt} fill unoptimized sizes="96vw" className="object-contain" /></div></DialogContent></Dialog></>
  );
}
