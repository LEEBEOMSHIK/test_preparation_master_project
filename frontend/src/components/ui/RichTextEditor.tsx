'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { examService } from '@/services/examService';

// dynamic()은 함수 컴포넌트 래퍼를 생성하므로 ref를 자동으로 전달하지 않음.
// forwardRef로 감싸서 quillRef가 ReactQuill 클래스 인스턴스에 정확히 도달하도록 처리.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactQuill = dynamic<any>(
  async () => {
    const { default: RQ } = await import('react-quill');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/display-name
    const Fwd = React.forwardRef<any, any>((props, ref) => <RQ {...props} ref={ref} />);
    Fwd.displayName = 'ReactQuill';
    return Fwd;
  },
  { ssr: false },
);

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요.', minHeight = 160 }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef    = useRef<any>(null); // ReactQuill 컴포넌트 인스턴스
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef   = useRef<any>(null); // 원시 Quill 인스턴스 (insertEmbed 등 privileged API 사용)
  const fileRef     = useRef<HTMLInputElement>(null);
  const savedIdx    = useRef<number>(0);

  // dynamic() 로드는 비동기 → 마운트 직후 getEditor()가 undefined일 수 있음.
  // 150ms 간격으로 폴링해 인스턴스가 준비되는 즉시 editorRef에 저장.
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      if (cancelled || editorRef.current) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = quillRef.current?.getEditor?.() ?? (quillRef.current as any)?.editor;
        if (q?.insertEmbed) { editorRef.current = q; return; }
      } catch { /* 아직 준비 안 됨 */ }
      setTimeout(poll, 150);
    };
    poll();
    return () => { cancelled = true; editorRef.current = null; };
  }, []);

  // modules는 최초 1회만 생성 (재생성 시 Quill이 툴바를 재초기화)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = useMemo<any>(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        // 파일 다이얼로그가 열리면 에디터 포커스 소실 → selection null
        // → 다이얼로그 열기 전 커서 위치를 먼저 저장, JSX 파일인풋을 클릭
        image: () => {
          const quill = editorRef.current;
          const sel = quill?.getSelection();
          savedIdx.current = sel ? sel.index : Math.max(0, (quill?.getLength() ?? 1) - 1);
          fileRef.current?.click();
        },
      },
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image',
  ];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;

    const quill = editorRef.current;
    if (!quill) { alert('에디터가 아직 준비되지 않았습니다.'); return; }

    try {
      const res = await examService.adminUploadQuestionImage(file);
      const url = res.data.data?.url ?? '';
      if (!url) { alert('이미지를 업로드하지 못했습니다.'); return; }

      const idx = savedIdx.current;
      quill.focus();
      quill.insertEmbed(idx, 'image', url);
      quill.setSelection(idx + 1, 0, 'user');
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    // overflow-hidden 제거 — Quill의 링크·색상 피커 팝업이 잘리지 않도록 overflow:visible 유지
    <div className="rte-quill-wrapper rounded-lg border border-gray-200 transition focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {/* JSX 파일인풋 — createElement 방식보다 안정적으로 onChange 수신 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageChange}
      />
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ minHeight }}
      />
    </div>
  );
}
