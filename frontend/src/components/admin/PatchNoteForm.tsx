'use client';

import { useState } from 'react';
import Link from 'next/link';
import { extractApiErrorMessage } from '@/lib/apiError';
import { stripHtml } from '@/lib/html';
import type { PatchNoteItem, PatchNoteItemType, PatchNoteRequest } from '@/types';

interface PatchNoteFormProps {
  initialValue?: PatchNoteRequest;
  onSubmit: (request: PatchNoteRequest) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
}

const DEFAULT_VALUE: PatchNoteRequest = {
  title: '',
  version: '',
  content: '',
  published: true,
  items: [{ itemType: 'ETC', summary: '', displayOrder: 0 }],
};

const ITEM_TYPE_OPTIONS: ReadonlyArray<{ value: PatchNoteItemType; label: string }> = [
  { value: 'ADD', label: '추가' },
  { value: 'IMPROVEMENT', label: '개선' },
  { value: 'FIX', label: '수정' },
  { value: 'SECURITY', label: '보안' },
  { value: 'ETC', label: '기타' },
];

function createItem(): PatchNoteItem {
  return { itemType: 'ETC', summary: '', displayOrder: 0 };
}

export function PatchNoteForm({ initialValue = DEFAULT_VALUE, onSubmit, submitLabel, cancelHref }: PatchNoteFormProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [version, setVersion] = useState(initialValue.version);
  const [published, setPublished] = useState(initialValue.published);
  const initialItems = initialValue.items ?? [];
  const initialLegacySummary = stripHtml(initialValue.content).trim();
  const preservesLegacyContent = initialValue.content.trim().length > 0 && (
    initialItems.length === 0
    || (
      initialItems.length === 1
      && initialItems[0].id == null
      && initialItems[0].itemType === 'ETC'
      && initialItems[0].summary.trim() === initialLegacySummary
    )
  );
  const [items, setItems] = useState<PatchNoteItem[]>(() => {
    return initialItems.length > 0
      ? [...initialItems].sort((a, b) => a.displayOrder - b.displayOrder).map((item) => ({ ...item }))
      : [{ ...createItem(), summary: initialLegacySummary }];
  });
  const [itemsDirty, setItemsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [itemErrorIndex, setItemErrorIndex] = useState<number | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setItemErrorIndex(null);

    const trimmedTitle = title.trim();
    const trimmedVersion = version.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!trimmedVersion) {
      setError('버전을 입력해 주세요.');
      return;
    }
    if (!/^v\d+\.\d+\.\d+$/.test(trimmedVersion)) {
      setError('버전 형식은 vMAJOR.MINOR.PATCH로 입력해 주세요.');
      return;
    }
    if (items.length === 0) {
      setError('항목을 1개 이상 추가해 주세요.');
      return;
    }
    const invalidItemIndex = items.findIndex((item) => item.summary.trim().length === 0);
    if (invalidItemIndex >= 0) {
      setItemErrorIndex(invalidItemIndex);
      setError(`${invalidItemIndex + 1}번 항목 요약을 입력해 주세요.`);
      return;
    }
    const tooLongItemIndex = items.findIndex((item) => item.summary.trim().length > 200);
    if (tooLongItemIndex >= 0) {
      setItemErrorIndex(tooLongItemIndex);
      setError(`${tooLongItemIndex + 1}번 항목 요약은 200자 이내로 입력해 주세요.`);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const generatedContent = items.map((item) => item.summary.trim()).join('\n');
      await onSubmit({
        title: trimmedTitle,
        version: trimmedVersion,
        content: !itemsDirty && preservesLegacyContent ? initialValue.content : generatedContent,
        published,
        items: items.map((item, displayOrder) => ({
          itemType: item.itemType,
          summary: item.summary.trim(),
          displayOrder,
        })),
      });
    } catch (submitError: unknown) {
      setError(extractApiErrorMessage(submitError, '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (index: number, update: Partial<PatchNoteItem>) => {
    setItemsDirty(true);
    setItemErrorIndex((currentIndex) => (currentIndex === index ? null : currentIndex));
    setItems((currentItems) => currentItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...update } : item
    )));
  };

  const addItem = () => {
    setItemsDirty(true);
    setItems((currentItems) => [...currentItems, { ...createItem(), displayOrder: currentItems.length }]);
  };

  const removeItem = (index: number) => {
    setItemsDirty(true);
    setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveItem = (index: number, offset: -1 | 1) => {
    setItemsDirty(true);
    setItems((currentItems) => {
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= currentItems.length) return currentItems;
      const nextItems = [...currentItems];
      [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
      return nextItems;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label htmlFor="patch-note-title" className="block text-sm font-medium text-gray-700 mb-1.5">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="patch-note-title"
          aria-label="제목"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
          placeholder="패치노트 제목을 입력하세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">최대 200자</p>
      </div>

      <div>
        <label htmlFor="patch-note-version" className="block text-sm font-medium text-gray-700 mb-1.5">
          버전 <span className="text-red-500">*</span>
        </label>
        <input
          id="patch-note-version"
          aria-label="버전"
          type="text"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          maxLength={50}
          required
          placeholder="예: v1.2.0"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">형식: vMAJOR.MINOR.PATCH (예: v1.2.0) · 최대 50자</p>
      </div>

      <section aria-labelledby="patch-note-items-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="patch-note-items-heading" className="text-sm font-medium text-gray-700">패치 항목 <span className="text-red-500">*</span></h3>
            <p className="mt-1 text-xs text-gray-400">사용자 화면에는 유형과 한 줄 요약으로 표시됩니다.</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="shrink-0 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            항목 추가
          </button>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
            항목을 1개 이상 추가해 주세요.
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => {
            const summaryId = `patch-note-item-summary-${index}`;
            const typeId = `patch-note-item-type-${index}`;
            return (
              <fieldset key={`${index}-${item.id ?? 'new'}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                <legend className="sr-only">{index + 1}번 패치 항목</legend>
                <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <label htmlFor={typeId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">유형</label>
                    <select
                      id={typeId}
                      aria-label={`항목 유형 ${index + 1}`}
                      value={item.itemType}
                      onChange={(event) => updateItem(index, { itemType: event.target.value as PatchNoteItemType })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    >
                      {ITEM_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={summaryId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">요약</label>
                    <input
                      id={summaryId}
                      aria-label={`항목 요약 ${index + 1}`}
                      type="text"
                      value={item.summary}
                      onChange={(event) => updateItem(index, { summary: event.target.value })}
                      aria-invalid={itemErrorIndex === index}
                      aria-describedby={itemErrorIndex === index ? `${summaryId}-error` : undefined}
                      maxLength={200}
                      placeholder="변경 사항을 한 줄로 입력하세요"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    />
                    {itemErrorIndex === index && error.includes('요약') && (
                      <p id={`${summaryId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label={`항목 ${index + 1} 위로 이동`} className="rounded-md border border-gray-200 px-2 py-2 text-xs text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">위</button>
                    <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} aria-label={`항목 ${index + 1} 아래로 이동`} className="rounded-md border border-gray-200 px-2 py-2 text-xs text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">아래</button>
                    <button type="button" onClick={() => removeItem(index)} aria-label={`항목 ${index + 1} 삭제`} className="rounded-md border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30">삭제</button>
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1.5">게시 여부</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPublished((value) => !value)}
            aria-label="게시 여부"
            aria-pressed={published}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              published ? 'bg-indigo-600' : 'bg-gray-200',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              published ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')} />
          </button>
          <span className="text-sm text-gray-600">{published ? '게시' : '비게시'}</span>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Link href={cancelHref} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          취소
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '등록 중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
