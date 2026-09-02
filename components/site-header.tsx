import Link from 'next/link';
import { Images, Plus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" prefetch={false} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Images className="size-4.5" /></span>
          <div><p className="font-heading text-base font-bold leading-none tracking-tight">Album Safe</p><p className="mt-1 text-[11px] text-muted-foreground">灵感影集</p></div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="主要导航">
          <Button variant="ghost" render={<Link href="/gallery" prefetch={false} />}>画廊</Button>
          <Button variant="ghost" render={<Link href="/categories" prefetch={false} />}><Tags /><span className="hidden sm:inline">分类管理</span></Button>
          <Button render={<Link href="/upload" prefetch={false} />}><Plus /><span className="hidden sm:inline">上传图片</span></Button>
        </nav>
      </div>
    </header>
  );
}
