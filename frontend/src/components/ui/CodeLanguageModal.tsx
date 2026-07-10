'use client';

import { useEffect, useState } from 'react';

interface CodeLanguageModalProps {
  open: boolean;
  onClose: () => void;
  /** 언어 선택 섹션 표시 여부 (해당 카테고리에 CODE 유형 문항 존재) */
  showLanguage: boolean;
  /** 출처 선택 섹션 표시 여부 (해당 카테고리에 AI 커스텀 문항 존재) */
  showSource: boolean;
  /** 선택 결과 콜백 — 미표시 섹션의 값은 undefined */
  onSelect: (selection: { language?: string; source?: string }) => void;
}

/** 프로그래밍 언어 카테고리 선택지 — 저장값은 관리자 문항 등록 화면과 동일한 소문자 언어 코드 컨벤션을 따른다 */
const CODE_LANGUAGES: { value?: string; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'c', label: 'C' },
];

/** 문항 출처 선택지 — 백엔드 UserQuizService.normalizeSource와 동일 값 컨벤션(EXAM/AI_CUSTOM) */
const SOURCE_OPTIONS: { value?: string; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'EXAM', label: '기출' },
  { value: 'AI_CUSTOM', label: 'AI 커스텀' },
];

/** 데일리 퀴즈에서 CODE(프로그래밍 언어) 카테고리 또는 AI 커스텀 문항이 있는 카테고리를 선택했을 때,
 *  풀고 싶은 언어·출처를 고르는 모달. 두 조건을 모두 만족하는 카테고리는 두 섹션을 함께 보여주고
 *  "시작" 버튼으로 한 번에 확정한다. */
export function CodeLanguageModal({ open, onClose, showLanguage, showSource, onSelect }: CodeLanguageModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    // 모달이 열릴 때마다 선택 상태 초기화(전체/전체)
    setSelectedLanguage(undefined);
    setSelectedSource(undefined);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const showBoth = showLanguage && showSource;

  const description = showBoth
    ? '풀고 싶은 프로그래밍 언어와 문항 출처를 선택하세요.'
    : showLanguage
    ? '풀고 싶은 프로그래밍 언어를 선택하세요.'
    : '풀고 싶은 문항 출처를 선택하세요.';

  const handleLanguageOnlyClick = (value?: string) => {
    onSelect({ language: value });
  };

  const handleSourceOnlyClick = (value?: string) => {
    onSelect({ source: value });
  };

  const handleStart = () => {
    onSelect({ language: selectedLanguage, source: selectedSource });
  };

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
              {showBoth ? '풀이 범위 선택' : showLanguage ? '언어 선택' : '출처 선택'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>

        {showLanguage && (
          <div className={showBoth ? 'mb-4' : undefined}>
            {showBoth && (
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                프로그래밍 언어
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {CODE_LANGUAGES.map((lang) => {
                const isSelected = showBoth && selectedLanguage === lang.value;
                return (
                  <button
                    key={lang.label}
                    onClick={() =>
                      showBoth ? setSelectedLanguage(lang.value) : handleLanguageOnlyClick(lang.value)
                    }
                    className={[
                      'py-2.5 rounded-lg border text-sm font-medium transition',
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
                    ].join(' ')}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showSource && (
          <div>
            {showBoth && (
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                문항 출처
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {SOURCE_OPTIONS.map((opt) => {
                const isSelected = showBoth && selectedSource === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() =>
                      showBoth ? setSelectedSource(opt.value) : handleSourceOnlyClick(opt.value)
                    }
                    className={[
                      'py-2.5 rounded-lg border text-sm font-medium transition',
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showBoth && (
          <button
            onClick={handleStart}
            className="w-full mt-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            시작
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
