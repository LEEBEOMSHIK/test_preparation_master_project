'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { useEffect, useRef } from 'react';
import { examService } from '@/services/examService';

// ── Image drag/paste upload extension ─────────────────────────────────────────

const ImageUploadExtension = Extension.create({
  name: 'imageUpload',

  addProseMirrorPlugins() {
    const editor = this.editor;

    const insertImage = async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      try {
        const res = await examService.adminUploadQuestionImage(file);
        const url = res.data.data?.url ?? '';
        if (url) editor.chain().focus().setImage({ src: url }).run();
      } catch {
        alert('이미지 업로드에 실패했습니다.');
      }
    };

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            const items = Array.from(event.clipboardData?.items ?? []);
            const images = items.filter((i) => i.type.startsWith('image/'));
            if (!images.length) return false;
            event.preventDefault();
            images.forEach((i) => { const f = i.getAsFile(); if (f) insertImage(f); });
            return true;
          },
          handleDrop(_view, event) {
            const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
              f.type.startsWith('image/'),
            );
            if (!files.length) return false;
            event.preventDefault();
            files.forEach((f) => insertImage(f));
            return true;
          },
        },
      }),
    ];
  },
});

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  active, disabled, onClick, title, children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        'px-2 py-1 rounded text-xs font-medium transition select-none',
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── RichTextEditor ─────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요.', minHeight = 120 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      ImageUploadExtension,
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'focus:outline-none' },
    },
    onUpdate({ editor: e }) {
      if (!isUpdatingRef.current) {
        onChange(e.getHTML());
      }
    },
  });

  // Sync external value changes (e.g., edit page loading data)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value || '');
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const res = await examService.adminUploadQuestionImage(file);
      const url = res.data.data?.url ?? '';
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)">
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)">
          <em>I</em>
        </ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
          <s>S</s>
        </ToolBtn>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목 2">
          H2
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="제목 3">
          H3
        </ToolBtn>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="순서 없는 목록">
          ≡
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="순서 있는 목록">
          1≡
        </ToolBtn>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="인라인 코드">
          {'</>'}
        </ToolBtn>
        <ToolBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록">
          {'{ }'}
        </ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용구">
          ❝
        </ToolBtn>

        <span className="w-px h-4 bg-gray-200 mx-1" />

        {/* Image upload button */}
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="이미지 삽입 (드래그·붙여넣기도 가능)">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block">
            <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-3 3zm5-6.56a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" clipRule="evenodd" />
          </svg>
          {' '}이미지
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Editor area */}
      <div
        className="tpmp-editor bg-white cursor-text"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Hint */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        이미지를 드래그하거나 클립보드에서 붙여넣기(Ctrl+V)로 삽입할 수 있습니다.
      </div>
    </div>
  );
}
