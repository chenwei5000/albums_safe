import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: '作品集 · Album Safe' };

export default function Home() {
  return (
    <main className="relative min-h-screen bg-transparent text-foreground">
      <SiteHeader />
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-4 text-center">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">Portfolio</p>
        <h1 className="text-gold font-heading text-7xl font-bold leading-none tracking-[0.08em] drop-shadow-[0_4px_30px_rgba(212,175,55,0.25)] sm:text-8xl md:text-9xl">作品集</h1>
        <p className="mt-8 text-sm tracking-[0.3em] text-muted-foreground sm:text-base">产品经理：<span className="text-foreground">Jack Ma</span></p>
        <Button size="lg" className="mt-12 h-14 rounded-full px-10 text-base font-semibold shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition hover:scale-[1.03]" render={<Link href="/gallery" prefetch={false} />}>
          点击进入预览 <ArrowRight className="size-5" />
        </Button>
      </section>
    </main>
  );
}