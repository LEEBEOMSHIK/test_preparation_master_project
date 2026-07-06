'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import 'react-quill/dist/quill.snow.css';
import { examService } from '@/services/examService';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요.', minHeight = 160 }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef  = useRef<any>(null); // ReactQuill 클래스 인스턴스
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null); // 원시 Quill 인스턴스 (insertEmbed 등 privileged API)
  const fileRef   = useRef<HTMLInputElement>(null);
  const savedIdx  = useRef<number>(0);

  // 리사이즈 상태
  const [currentMinH, setCurrentMinH] = useState(minHeight);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  // dynamic()은 함수 컴포넌트 래퍼를 반환하므로 ref가 항상 null이 됨.
  // 클래스 컴포넌트인 ReactQuill을 useState에 직접 저장해 ref를 클래스 인스턴스에 전달.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [RQ, setRQ] = useState<any>(null);

  useEffect(() => {
    import('react-quill').then((mod) => setRQ(() => mod.default));
  }, []);

  // 이미지 파일을 서버에 업로드하고 성공 시 지정 인덱스에 URL로 삽입하는 공용 헬퍼.
  // 툴바 버튼(handleImageChange)·붙여넣기(paste)·드래그드롭(drop)이 모두 이 헬퍼를 공유해
  // base64 인라인 없이 항상 짧은 URL만 content에 남도록 한다.
  // 성공 여부를 반환해 여러 장 연속 삽입 시 인덱스 증가 여부를 판단할 수 있게 한다.
  const uploadAndInsertImage = useCallback(async (file: File, index: number): Promise<boolean> => {
    if (!file.type.startsWith('image/')) return false;
    const quill = editorRef.current;
    if (!quill) return false;

    try {
      const res = await examService.adminUploadQuestionImage(file);
      const url = res.data.data?.url ?? '';
      if (!url) { alert('이미지를 업로드하지 못했습니다.'); return false; }

      quill.focus();
      quill.insertEmbed(index, 'image', url);
      quill.setSelection(index + 1, 0, 'user');
      return true;
    } catch {
      alert('이미지 업로드에 실패했습니다.');
      return false;
    }
  }, []);

  // RQ 로드 후 마운트 완료까지 150ms 간격으로 폴링 → editorRef에 Quill 인스턴스 저장
  // 인스턴스 확보 시점에 paste·drop 리스너를 함께 붙여, 클립보드/드래그드롭으로 들어오는
  // 이미지 파일도 base64 인라인 대신 서버 업로드 후 URL로 삽입되도록 한다.
  useEffect(() => {
    if (!RQ) return;
    let cancelled = false;
    let detachClipboardHandlers: (() => void) | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachClipboardHandlers = (quill: any) => {
      // quill.root(에디터 contenteditable)에는 Quill 자체 clipboard 리스너도 등록돼 있는데,
      // 같은 타겟 요소에서는 capture/bubble 구분 없이 "등록 순서대로" 실행된다.
      // root에 버블 단계로 붙이면 Quill이 먼저 base64를 삽입해버려 preventDefault가 늦는다.
      // → root의 상위 요소(.ql-container)에 **capture 단계**로 붙여 Quill보다 선점한다.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const captureTarget: HTMLElement = quill.container ?? quill.root.parentElement ?? quill.root;

      // 여러 이미지를 순서대로 업로드·삽입 (성공한 만큼만 인덱스 증가)
      const insertFilesSequentially = async (files: File[], startIndex: number) => {
        let idx = startIndex;
        for (const file of files) {
          const inserted = await uploadAndInsertImage(file, idx);
          if (inserted) idx += 1;
        }
      };

      const currentIndex = () => {
        const sel = quill.getSelection();
        return sel ? sel.index : Math.max(0, (quill.getLength() ?? 1) - 1);
      };

      const onPaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const f = item.getAsFile();
            if (f) imageFiles.push(f);
          }
        }
        // 이미지가 없으면(텍스트 등) 아무것도 하지 않고 Quill 기본 붙여넣기 동작을 그대로 둔다.
        if (imageFiles.length === 0) return;

        // 이미지가 있을 때만 Quill·브라우저 기본 처리를 모두 차단
        // (capture 단계라 아직 root에 도달하기 전 — stopPropagation으로 Quill 리스너 자체를 막는다)
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        void insertFilesSequentially(imageFiles, currentIndex());
      };

      const onDrop = (e: DragEvent) => {
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return; // 이미지가 아니면 기본 동작 유지

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        void insertFilesSequentially(imageFiles, currentIndex());
      };

      captureTarget.addEventListener('paste', onPaste, true);
      captureTarget.addEventListener('drop', onDrop, true);
      detachClipboardHandlers = () => {
        captureTarget.removeEventListener('paste', onPaste, true);
        captureTarget.removeEventListener('drop', onDrop, true);
      };
    };

    const poll = () => {
      if (cancelled || editorRef.current) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = quillRef.current?.getEditor?.() ?? (quillRef.current as any)?.editor;
        if (q?.insertEmbed) {
          editorRef.current = q;
          attachClipboardHandlers(q);
          return;
        }
      } catch { /* 아직 준비 안 됨 */ }
      setTimeout(poll, 150);
    };
    poll();
    return () => {
      cancelled = true;
      editorRef.current = null;
      detachClipboardHandlers?.();
    };
  }, [RQ, uploadAndInsertImage]);

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
          if (!quill) { alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'); return; }
          const sel = quill.getSelection();
          savedIdx.current = sel ? sel.index : Math.max(0, (quill.getLength() ?? 1) - 1);
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

  const onResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartH.current = currentMinH;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const y = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      setCurrentMinH(Math.max(minHeight, dragStartH.current + (y - dragStartY.current)));
    };
    const onEnd = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;

    await uploadAndInsertImage(file, savedIdx.current);
  };

  return (
    // overflow-hidden 제거 — Quill의 링크·색상 피커 팝업이 잘리지 않도록 overflow:visible 유지
    <div className="relative rte-quill-wrapper rounded-lg border border-gray-200 transition focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {/* JSX 파일인풋 — createElement 방식보다 안정적으로 onChange 수신 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageChange}
      />
      {RQ ? (
        <RQ
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{ minHeight: currentMinH }}
        />
      ) : (
        <div className="animate-pulse" style={{ minHeight: currentMinH }}>
          <div className="h-10 bg-gray-100 border-b border-gray-200 rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      )}
      {/* 드래그 리사이즈 핸들 */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-0.5 pr-0.5 cursor-ns-resize select-none text-gray-300 hover:text-gray-500 transition-colors"
        style={{ touchAction: 'none' }}
        aria-label="에디터 크기 조절"
      >
        <svg viewBox="0 0 10 10" fill="currentColor" className="w-3 h-3">
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="4.5" cy="8" r="1.2" />
          <circle cx="8" cy="4.5" r="1.2" />
        </svg>
      </div>
    </div>
  );
}
