'use client';

import { useRef, useState } from 'react';
import { examService } from '@/services/examService';

interface Props {
  /** 업로드 완료 후 삽입할 마크다운을 반환합니다. */
  onInsert: (markdown: string) => void;
}

/**
 * 이미지 업로드 버튼.
 * 클릭 시 파일 선택 → 업로드 → `![이미지](url)` 마크다운을 onInsert 콜백으로 전달.
 */
export function ImageUploadButton({ onInsert }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await examService.adminUploadQuestionImage(file);
      const url = res.data.data?.url ?? '';
      onInsert(`![이미지](${url})`);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      // 같은 파일 재선택 허용
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="이미지 삽입"
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
      >
        {uploading ? (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        이미지
      </button>
    </>
  );
}
