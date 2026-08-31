'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { examService } from '@/services/examService';
import type { RichTextEditorHandle, RichTextEditorProps } from '@/types';

interface QuillSelection { index: number; length: number; }
interface QuillEditor {
  container?: HTMLElement;
  root: HTMLElement;
  focus(): void;
  getLength(): number;
  getSelection(): QuillSelection | null;
  insertEmbed(index: number, type: string, value: string): void;
  insertText(index: number, text: string, source: 'user'): void;
  setSelection(index: number, length: number, source: 'user'): void;
}
interface ReactQuillInstance { getEditor?(): QuillEditor; editor?: QuillEditor; }
interface QuillModules { toolbar: { container: unknown[]; handlers?: Record<string, () => void> }; }
interface ReactQuillComponentProps {
  ref?: React.Ref<ReactQuillInstance>;
  theme: string;
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  modules: QuillModules;
  formats: string[];
  style: React.CSSProperties;
  readOnly?: boolean;
}
type ReactQuillComponent = React.ComponentType<ReactQuillComponentProps>;

function stopImageEvent(event: ClipboardEvent | DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function clipboardImageFiles(event: ClipboardEvent): File[] {
  return Array.from(event.clipboardData?.items ?? [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

function isImageUri(value: string): boolean {
  const uri = value.trim();
  if (/^data:image\//i.test(uri)) return true;
  const withoutQueryOrHash = uri.split(/[?#]/, 1)[0];
  return /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(withoutQueryOrHash);
}

function transferHasImagePayload(transfer: DataTransfer | null): boolean {
  if (!transfer) return false;
  const html = transfer.getData('text/html');
  if (/<img\b/i.test(html)) return true;
  return transfer.getData('text/uri-list')
    .split(/\r?\n/)
    .some((line) => line.trim() !== '' && !line.trimStart().startsWith('#') && isImageUri(line));
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  {
    value,
    onChange,
    placeholder = '내용을 입력하세요.',
    minHeight = 160,
    allowImages = true,
    disabled = false,
    ariaLabel,
    ariaLabelledBy,
  },
  ref,
) {
  const quillRef = useRef<ReactQuillInstance | null>(null);
  const editorRef = useRef<QuillEditor | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedIdx = useRef(0);
  const [currentMinH, setCurrentMinH] = useState(minHeight);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const [RQ, setRQ] = useState<ReactQuillComponent | null>(null);

  useEffect(() => {
    let mounted = true;
    void import('react-quill').then((module) => {
      if (mounted) setRQ(() => module.default as unknown as ReactQuillComponent);
    });
    return () => { mounted = false; };
  }, []);

  const currentIndex = useCallback((quill: QuillEditor): number => {
    const selection = quill.getSelection();
    return selection ? selection.index : Math.max(0, quill.getLength() - 1);
  }, []);

  useImperativeHandle(ref, () => ({
    insertText(text: string): void {
      const quill = editorRef.current;
      if (!quill) return;
      const index = currentIndex(quill);
      quill.focus();
      quill.insertText(index, text, 'user');
      quill.setSelection(index + text.length, 0, 'user');
    },
  }), [currentIndex]);

  const uploadAndInsertImage = useCallback(async (file: File, index: number): Promise<boolean> => {
    if (!allowImages || !file.type.startsWith('image/')) return false;
    const quill = editorRef.current;
    if (!quill) return false;
    try {
      const response = await examService.adminUploadQuestionImage(file);
      const url = response.data.data?.url ?? '';
      if (!url) { alert('이미지를 업로드하지 못했습니다.'); return false; }
      quill.focus();
      quill.insertEmbed(index, 'image', url);
      quill.setSelection(index + 1, 0, 'user');
      return true;
    } catch {
      alert('이미지 업로드에 실패했습니다.');
      return false;
    }
  }, [allowImages]);

  useEffect(() => {
    if (!RQ) return;
    let cancelled = false;
    let detach: (() => void) | null = null;
    const attach = (quill: QuillEditor) => {
      if (ariaLabel) quill.root.setAttribute('aria-label', ariaLabel);
      else quill.root.removeAttribute('aria-label');
      if (ariaLabelledBy) quill.root.setAttribute('aria-labelledby', ariaLabelledBy);
      else quill.root.removeAttribute('aria-labelledby');
      const captureTarget = quill.container ?? quill.root.parentElement ?? quill.root;
      const insertSequentially = async (files: File[], startIndex: number) => {
        let index = startIndex;
        for (const file of files) if (await uploadAndInsertImage(file, index)) index += 1;
      };
      const onPaste = (event: ClipboardEvent) => {
        const files = clipboardImageFiles(event);
        if (files.length > 0) {
          stopImageEvent(event);
          if (allowImages) void insertSequentially(files, currentIndex(quill));
          return;
        }
        if (!allowImages && transferHasImagePayload(event.clipboardData)) stopImageEvent(event);
      };
      const onDrop = (event: DragEvent) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith('image/'));
        if (files.length > 0) {
          stopImageEvent(event);
          if (allowImages) void insertSequentially(files, currentIndex(quill));
          return;
        }
        if (!allowImages && transferHasImagePayload(event.dataTransfer)) stopImageEvent(event);
      };
      captureTarget.addEventListener('paste', onPaste, true);
      captureTarget.addEventListener('drop', onDrop, true);
      detach = () => {
        captureTarget.removeEventListener('paste', onPaste, true);
        captureTarget.removeEventListener('drop', onDrop, true);
      };
    };
    const poll = () => {
      if (cancelled || editorRef.current) return;
      try {
        const quill = quillRef.current?.getEditor?.() ?? quillRef.current?.editor;
        if (quill?.insertEmbed) { editorRef.current = quill; attach(quill); return; }
      } catch { /* react-quill 인스턴스가 준비될 때까지 재시도한다. */ }
      window.setTimeout(poll, 150);
    };
    poll();
    return () => { cancelled = true; editorRef.current = null; detach?.(); };
  }, [RQ, allowImages, ariaLabel, ariaLabelledBy, currentIndex, uploadAndInsertImage]);

  const modules = useMemo<QuillModules>(() => {
    const container: unknown[] = [
      [{ header: [1, 2, 3, false] }], [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'], [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }], allowImages ? ['link', 'image'] : ['link'], ['clean'],
    ];
    if (!allowImages) return { toolbar: { container } };
    return { toolbar: { container, handlers: { image: () => {
      const quill = editorRef.current;
      if (!quill) { alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'); return; }
      savedIdx.current = currentIndex(quill);
      fileRef.current?.click();
    } } } };
  }, [allowImages, currentIndex]);

  const formats = useMemo(() => [
    'header', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
    'list', 'bullet', 'link', ...(allowImages ? ['image'] : []),
  ], [allowImages]);

  const onResizeStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    isDragging.current = true;
    dragStartY.current = 'touches' in event ? event.touches[0].clientY : event.clientY;
    dragStartH.current = currentMinH;
    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const y = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      setCurrentMinH(Math.max(minHeight, dragStartH.current + y - dragStartY.current));
    };
    const onEnd = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await uploadAndInsertImage(file, savedIdx.current);
  };

  return (
    <div data-testid="rich-text-editor" data-image-enabled={allowImages} className="relative rte-quill-wrapper rounded-lg border border-gray-200 transition focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {allowImages && <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" aria-label="이미지 업로드" className="hidden" onChange={handleImageChange} />}
      {RQ ? (
        <RQ ref={quillRef} theme="snow" value={value} onChange={onChange} placeholder={placeholder} modules={modules} formats={formats} style={{ minHeight: currentMinH }} readOnly={disabled} />
      ) : (
        <div className="animate-pulse" style={{ minHeight: currentMinH }}><div className="h-10 bg-gray-100 border-b border-gray-200 rounded-t-lg" /><div className="p-3 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div>
      )}
      <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-0.5 pr-0.5 cursor-ns-resize select-none text-gray-300 hover:text-gray-500 transition-colors" style={{ touchAction: 'none' }} aria-label="에디터 크기 조절">
        <svg viewBox="0 0 10 10" fill="currentColor" className="w-3 h-3"><circle cx="8" cy="8" r="1.2" /><circle cx="4.5" cy="8" r="1.2" /><circle cx="8" cy="4.5" r="1.2" /></svg>
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
