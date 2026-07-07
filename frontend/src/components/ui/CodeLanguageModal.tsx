'use client';

import { useEffect } from 'react';

interface CodeLanguageModalProps {
  open: boolean;
  onClose: () => void;
  /** 선택된 언어 코드(소문자, 예: 'java'). "전체" 선택 시 undefined 전달 */
  onSelect: (language?: string) => void;
}

/** 프로그래밍 언어 카테고리 선택지 — 저장값은 관리자 문항 등록 화면과 동일한 소문자 언어 코드 컨벤션을 따른다 */
const CODE_LANGUAGES: { value?: string; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
];

/** 데일리 퀴즈에서 CODE 유형(프로그래밍 언어) 카테고리를 선택했을 때, 풀고 싶은 언어를 고르는 모달 */
export function CodeLanguageModal({ open, onClose, onSelect }: CodeLanguageModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-5 h-5 text-indigo-500 dark:text-indigo-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              언어 선택
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              풀고 싶은 프로그래밍 언어를 선택하세요.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CODE_LANGUAGES.map((lang) => (
            <button
              key={lang.label}
              onClick={() => onSelect(lang.value)}
              className="py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
            >
              {lang.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
