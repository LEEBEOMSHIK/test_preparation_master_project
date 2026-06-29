'use client';

import { useRef } from 'react';

/** Tab 삽입 시 사용할 공백 문자열 (2칸) */
const TAB_INSERT = '  ';

export interface CodeAnswerInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 제공 시 Ctrl+Enter(또는 Cmd+Enter)로 제출 동작을 트리거한다 */
  onCtrlEnter?: () => void;
  rows?: number;
  className?: string;
}

/**
 * CODE 유형 멀티라인 monospace 답안 입력 컴포넌트.
 *
 * - Tab 키: 커서(selectionStart/End) 위치에 공백 2칸 삽입 후 포커스 유지
 * - Ctrl+Enter (또는 Cmd+Enter): onCtrlEnter 콜백 실행 (제출 등)
 * - 기본 rows: 6
 */
export function CodeAnswerInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  onCtrlEnter,
  rows = 6,
  className,
}: CodeAnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;

      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const newValue =
        value.slice(0, start) + TAB_INSERT + value.slice(end);

      onChange(newValue);

      // textarea value 갱신 후 커서 위치 복원 (requestAnimationFrame으로 DOM 반영 대기)
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const pos = start + TAB_INSERT.length;
        textareaRef.current.setSelectionRange(pos, pos);
      });
      return;
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onCtrlEnter?.();
    }
  };

  const baseClass = [
    'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono',
    'focus:outline-none focus:ring-2 focus:ring-indigo-400',
    'resize-y',
    'disabled:bg-gray-50 disabled:cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400">
        코드 답안 입력 (Tab: 들여쓰기
        {onCtrlEnter && ' · Ctrl+Enter: 제출'}
        )
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={baseClass}
      />
    </div>
  );
}
