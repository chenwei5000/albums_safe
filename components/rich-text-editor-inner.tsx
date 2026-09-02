'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, type ReactNode } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, ImagePlus } from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
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
        <ToolButton label="插入图片" onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /></ToolButton>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.getText().trim() && <p className="sr-only">{placeholder}</p>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0])} />
    </div>
  );
}