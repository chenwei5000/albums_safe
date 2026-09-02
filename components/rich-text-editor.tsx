'use client';

import dynamic from 'next/dynamic';

// Tiptap 依赖浏览器 API，关闭 SSR，避免服务端渲染报错
const Inner = dynamic(
  () => import('./rich-text-editor-inner').then((module) => module.RichTextEditorInner),
  {
    ssr: false,
    loading: () => <div className="h-[180px] animate-pulse rounded-xl bg-muted" />,
  },
);

export function RichTextEditor(props: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  return <Inner {...props} />;
}