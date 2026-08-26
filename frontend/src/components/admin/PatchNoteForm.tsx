'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { extractApiErrorMessage } from '@/lib/apiError';
import { stripHtml } from '@/lib/html';
import type { PatchNoteRequest } from '@/types';

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
};

export function PatchNoteForm({ initialValue = DEFAULT_VALUE, onSubmit, submitLabel, cancelHref }: PatchNoteFormProps) {
  const [title, setTitle] = useState(initialValue.title);
  const [version, setVersion] = useState(initialValue.version);
  const [content, setContent] = useState(initialValue.content);
  const [published, setPublished] = useState(initialValue.published);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

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
    if (stripHtml(content).trim().length === 0) {
      setError('본문을 입력해 주세요.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ title: trimmedTitle, version: trimmedVersion, content, published });
    } catch (submitError: unknown) {
      setError(extractApiErrorMessage(submitError, '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setSubmitting(false);
    }
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
        <p className="mt-1 text-xs text-gray-400">최대 50자</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          본문 <span className="text-red-500">*</span>
        </label>
        <RichTextEditor value={content} onChange={setContent} placeholder="패치노트 본문을 입력하세요" minHeight={240} />
      </div>

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
