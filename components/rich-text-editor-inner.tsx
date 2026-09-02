'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useRef, useState, type ReactNode } from 'react';
import { Baseline, Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, ImagePlus } from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

// 编辑器内文字颜色预设：编辑区为浅底，同时兼顾大卡片深底展示的常用色
const TEXT_COLOR_PRESETS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#2563eb', '#4f46e5', '#9333ea', '#db2777', '#475569', '#000000', '#ffffff'];

function ToolButton({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick}
      className={`grid size-8 place-items-center rounded-md transition ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
      {children}
    </button>
  );
}

export function RichTextEditorInner({ value, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [colorOpen, setColorOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TextStyle,
      Color,
      Image.configure({ inline: false }),
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'rich-text min-h-[140px] max-h-[320px] overflow-y-auto rounded-b-xl border border-input bg-background/60 px-3 py-2.5 text-sm leading-6 outline-none' },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const uploadImage = async (file: File | undefined) => {
    if (!file || uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (response.ok && result?.url && editor) editor.chain().focus().setImage({ src: result.url }).run();
    } finally {
      uploadingRef.current = false;
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!editor) return <div className="h-[140px] animate-pulse rounded-xl bg-muted" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-input bg-muted/40 p-1">
        <ToolButton label="加粗" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolButton>
        <ToolButton label="斜体" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
        <ToolButton label="标题" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolButton>
        <ToolButton label="小标题" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolButton>
        <ToolButton label="无序列表" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolButton>
        <ToolButton label="有序列表" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
        <ToolButton label="引用" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
        <div className="relative">
          <ToolButton label="文字颜色" active={colorOpen} onClick={() => setColorOpen((open) => !open)}>
            <span className="relative">
              <Baseline className="size-4" />
              <span className="absolute inset-x-0.5 -bottom-1 h-0.5 rounded-full" style={{ backgroundColor: (editor.getAttributes('textStyle').color as string | undefined) ?? 'currentColor' }} />
            </span>
          </ToolButton>
          {colorOpen && (
            <>
              <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-30 cursor-default" onMouseDown={(event) => { event.preventDefault(); setColorOpen(false); }} />
              <div className="absolute left-0 top-9 z-40 w-48 rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-lg" onMouseDown={(event) => event.preventDefault()}>
                <p className="mb-2 text-xs text-muted-foreground">选中文字后点击颜色</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {TEXT_COLOR_PRESETS.map((color) => (
                    <button key={color} type="button" title={color} aria-label={`文字颜色 ${color}`} onClick={() => { editor.chain().focus().setColor(color).run(); setColorOpen(false); }}
                      className="size-6 rounded-full border border-black/10 transition hover:scale-110" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5">
                  <label className="flex flex-1 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="relative size-6 shrink-0 overflow-hidden rounded-full border border-input">
                      <input type="color" value={(editor.getAttributes('textStyle').color as string | undefined) ?? '#000000'} onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                    </span>
                    自定义
                  </label>
                  <button type="button" className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline" onClick={() => { editor.chain().focus().unsetColor().run(); setColorOpen(false); }}>清除颜色</button>
                </div>
              </div>
            </>
          )}
        </div>
        <ToolButton label="插入图片" onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /></ToolButton>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.getText().trim() && <p className="sr-only">{placeholder}</p>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0])} />
    </div>
  );
}