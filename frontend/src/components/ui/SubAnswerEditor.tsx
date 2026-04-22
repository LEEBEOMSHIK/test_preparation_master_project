'use client';

import { useState } from 'react';

const KO_LABELS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ'];

interface SubAnswerItem { label: string; value: string; }

export function parseSubAnswers(answer: string): SubAnswerItem[] {
  if (!answer.trim()) return [{ label: KO_LABELS[0], value: '' }];
  const lines = answer.split('\n').filter(Boolean);
  const parsed = lines
    .map((line) => {
      const m = line.match(/^\(([ㄱ-ㅎ])\)\s*(.*)/);
      return m ? { label: m[1], value: m[2] } : null;
    })
    .filter((x): x is SubAnswerItem => x !== null);
  if (parsed.length === 0) return [{ label: KO_LABELS[0], value: answer.trim() }];
  return parsed;
}

export function serializeSubAnswers(items: SubAnswerItem[]): string {
  if (items.length === 1) return items[0].value;
  return items.map((item) => `(${item.label}) ${item.value}`).join('\n');
}

interface Props {
  answer: string;
  onChange: (v: string) => void;
}

export function SubAnswerEditor({ answer, onChange }: Props) {
  const [items, setItems] = useState<SubAnswerItem[]>(() => parseSubAnswers(answer));

  const updateItem = (idx: number, value: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, value } : item));
    setItems(next);
    onChange(serializeSubAnswers(next));
  };

  const addItem = () => {
    if (items.length >= KO_LABELS.length) return;
    const next = [...items, { label: KO_LABELS[items.length], value: '' }];
    setItems(next);
    onChange(serializeSubAnswers(next));
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    const next = items
      .filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, label: KO_LABELS[i] }));
    setItems(next);
    onChange(serializeSubAnswers(next));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-9 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold shrink-0 border border-indigo-200 select-none">
            ({item.label})
          </span>
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(idx, e.target.value)}
            maxLength={500}
            placeholder={`(${item.label}) 정답`}
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-gray-300 hover:text-red-400 transition shrink-0"
              aria-label="항목 삭제"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {items.length < KO_LABELS.length && (
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-indigo-500 hover:text-indigo-700 transition"
        >
          + 항목 추가 <span className="text-gray-400">(({KO_LABELS[items.length]}) 항목)</span>
        </button>
      )}
    </div>
  );
}
