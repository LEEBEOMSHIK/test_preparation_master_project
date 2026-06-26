'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RichContent } from '@/components/ui/RichContent';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { QuestionType } from '@/types';

export interface QuestionDetailItem {
  id: number;
  title?: string;
  examYear?: number;
  examRound?: number;
  categoryId?: number;
  categoryName?: string;
  content: string;
  questionType: QuestionType;
  options?: string[];
  answer?: string;
  explanation?: string;
  code?: string;
  language?: string;
}

interface Props {
  question: QuestionDetailItem | null;
  onClose: () => void;
  /** true로 설정하면 관리자 수정 링크를 숨깁니다 (사용자 북마크 페이지 등) */
  hideEditLink?: boolean;
}

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER:    '주관식',
  OX:              'O/X',
  CODE:            '코드',
};
const TYPE_COLOR: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600',
  SHORT_ANSWER:    'bg-green-50 text-green-600',
  OX:              'bg-amber-50 text-amber-600',
  CODE:            'bg-violet-50 text-violet-600',
};

export function QuestionDetailModal({ question, onClose, hideEditLink = false }: Props) {
  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, onClose]);

  if (!question) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {question.title && (
                <p className="text-sm font-semibold text-gray-900 truncate mb-1">{question.title}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  TYPE_COLOR[question.questionType],
                ].join(' ')}>
                  {TYPE_LABEL[question.questionType]}
                </span>
                {question.categoryName && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {question.categoryName}
                  </span>
                )}
                {(question.examYear || question.examRound) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {question.examYear ? `${question.examYear}년` : ''}
                    {question.examYear && question.examRound ? ' ' : ''}
                    {question.examRound ? `제${question.examRound}회` : ''}
                  </span>
                )}
                {!question.title && (
                  <span className="text-xs text-gray-400">문항 상세</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* 문항 내용 */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5">문항 내용</p>
            <RichContent html={question.content} className="text-sm text-gray-800" />
          </div>

          {/* 코드 */}
          {question.code && (
            <CodeBlock
              code={question.code}
              language={question.language}
              size="xs"
            />
          )}

          {/* 선택지 */}
          {question.questionType === 'MULTIPLE_CHOICE' && question.options && question.options.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">선택지</p>
              <ol className="space-y-1.5">
                {question.options.map((opt, i) => (
                  <li
                    key={i}
                    className={[
                      'flex items-start gap-2 px-3 py-2 rounded-lg text-sm border',
                      question.answer === String(i + 1)
                        ? 'border-green-300 bg-green-50 text-green-800 font-medium'
                        : 'border-gray-100 text-gray-700',
                    ].join(' ')}
                  >
                    <span className="font-semibold shrink-0">({i + 1})</span>
                    <span>{opt}</span>
                    {question.answer === String(i + 1) && (
                      <span className="ml-auto shrink-0 text-xs text-green-600">정답</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 정답 (객관식 외) */}
          {question.questionType !== 'MULTIPLE_CHOICE' && question.answer && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">정답</p>
              <p className="px-3 py-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg font-medium">
                {question.answer}
              </p>
            </div>
          )}

          {/* 해설 */}
          {question.explanation && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">해설</p>
              <p className="px-3 py-2 bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition"
          >
            닫기
          </button>
          {!hideEditLink && (
            <Link
              href={`/admin/exams/questions/${question.id}/edit`}
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition text-center"
            >
              수정
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
