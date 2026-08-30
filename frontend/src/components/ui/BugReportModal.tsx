'use client';

import { useState } from 'react';
import { inquiryService } from '@/services/inquiryService';
import { stripHtml } from '@/lib/html';

export interface BugReportContext {
  /** 신고 진입 화면 */
  source: 'QUIZ' | 'EXAM' | 'CONCEPT_NOTE';
  /** 카테고리명(퀴즈) · 시험지명(시험) · 노트 제목(개념노트) */
  label: string;
  questionId?: number | string;
  questionContent?: string;
}

interface Props {
  context: BugReportContext;
  onClose: () => void;
}

const SOURCE_LABEL: Record<BugReportContext['source'], string> = {
  QUIZ: '데일리 퀴즈',
  EXAM: '시험',
  CONCEPT_NOTE: '개념노트',
};

/**
 * 퀴즈·시험 풀이 화면 및 개념노트 상세 화면에서 문항(또는 노트) 단위로 빠르게 버그를 신고하는 모달.
 * 컨텍스트 정보를 자동으로 채워 버그 신고로 등록한다 — user/inquiries/new 전체 폼 대신
 * 설명 한 줄만 입력하면 되는 축약 경로.
 */
export function BugReportModal({ context, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!description.trim() || submitting || submitted) return;
    setSubmitting(true);
    setError('');
    try {
      const contentLines = [
        '[자동 첨부 정보]',
        `- 화면: ${SOURCE_LABEL[context.source]} (${context.label})`,
        context.questionId != null ? `- 문항 ID: ${context.questionId}` : null,
        context.questionContent ? `- 문항 내용: ${stripHtml(context.questionContent).slice(0, 200)}` : null,
        '',
        '[문제 설명]',
        description.trim(),
      ].filter((line): line is string => line !== null);

      await inquiryService.create({
        title: `[버그신고] ${SOURCE_LABEL[context.source]} - ${context.label}`.slice(0, 200),
        content: contentLines.join('\n'),
        requestType: 'BUG_REPORT',
        targetArea: context.source === 'QUIZ' ? 'DAILY_QUIZ' : context.source === 'EXAM' ? 'EXAM_SOLVING_RESULT' : 'CONCEPT_NOTE',
        detailLocation: `${SOURCE_LABEL[context.source]} · ${context.label}${context.questionId != null ? ` · 문항 ${context.questionId}` : ''}`.slice(0, 500),
        attachmentIds: [],
      });
      setSubmitted(true);
      setTimeout(onClose, 900);
    } catch {
      setError('신고 접수에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-rose-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            버그 신고
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">×</button>
        </div>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2 space-y-0.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">신고 대상 문항</p>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{SOURCE_LABEL[context.source]} · {context.label}</p>
          {context.questionContent && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {stripHtml(context.questionContent)}
            </p>
          )}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 문제가 있었는지 설명해 주세요. (예: 정답이 실제와 다른 것 같아요, 문제 내용이 깨져 보여요)"
          rows={5}
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          autoFocus
        />

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim() || submitted}
            className={[
              'px-4 py-2 text-sm rounded-lg font-medium transition',
              submitted
                ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/50',
            ].join(' ')}
          >
            {submitted ? '접수됨 ✓' : submitting ? '접수 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
