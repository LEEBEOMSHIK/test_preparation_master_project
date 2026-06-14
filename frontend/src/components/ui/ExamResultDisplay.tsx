'use client';

import { useState } from 'react';
import { RichContent } from '@/components/ui/RichContent';
import { stripHtml } from '@/lib/html';
import type { ExamResultData } from '@/types';

interface Props {
  result: ExamResultData;
  examinationTitle?: string;
  onBack: () => void;
  backLabel?: string;
  showSavedBanner?: boolean;
  /** 제공 시 '다시 풀기' 버튼을 표시한다 (시험 응시 화면에서만 전달). */
  onRetake?: () => void;
}

/**
 * 시험 결과 공용 표시 컴포넌트
 * - 제출 직후(exam/[id])와 이력 재조회(user/exam-history/[historyId]) 양쪽에서 사용
 */
export function ExamResultDisplay({
  result,
  examinationTitle,
  onBack,
  backLabel = '시험 목록으로',
  showSavedBanner = false,
  onRetake,
}: Props) {
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const allCorrect = result.results.every(r => r.correct);
  const displayResults =
    resultFilter === 'wrong' ? result.results.filter(r => !r.correct) : result.results;

  const toggleExpand = (seq: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(seq) ? next.delete(seq) : next.add(seq);
      return next;
    });
  };

  const scoreColorClass =
    result.score >= 80
      ? 'bg-green-100 text-green-600'
      : result.score >= 50
      ? 'bg-yellow-100 text-yellow-600'
      : 'bg-red-100 text-red-600';

  const formatTakenAt = (takenAt: string) => {
    const d = new Date(takenAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* 집계 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-3">
          {examinationTitle && (
            <p className="text-sm font-medium text-indigo-600 truncate">{examinationTitle}</p>
          )}
          <div
            className={[
              'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold',
              scoreColorClass,
            ].join(' ')}
          >
            {result.score}점
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">시험 완료</h2>
            <p className="text-gray-500 text-sm mt-1">
              {result.total}문제 중{' '}
              <span className="font-semibold text-indigo-600">{result.correct}문제</span> 정답
            </p>
          </div>
          {result.takenAt && (
            <p className="text-xs text-gray-400">응시일시: {formatTakenAt(result.takenAt)}</p>
          )}
        </div>

        {/* 저장 안내 배너 (제출 직후에만) */}
        {showSavedBanner && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">
            결과는 저장되어 있어 나중에 다시 확인할 수 있습니다.
          </div>
        )}

        {/* 필터 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setResultFilter('all')}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium border transition',
              resultFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300',
            ].join(' ')}
          >
            전체 ({result.total})
          </button>
          <button
            onClick={() => setResultFilter('wrong')}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium border transition',
              resultFilter === 'wrong'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-300',
            ].join(' ')}
          >
            오답만 ({result.total - result.correct})
          </button>
        </div>

        {/* 아코디언 목록 */}
        {allCorrect && resultFilter === 'wrong' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            모든 문항을 맞혔습니다!
          </div>
        ) : displayResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            표시할 문항이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {displayResults.map(item => {
              const isExpanded = expandedItems.has(item.seq);
              const previewText = stripHtml(item.content) || '문항 내용 없음';
              return (
                <div
                  key={item.seq}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* 헤더 */}
                  <button
                    onClick={() => toggleExpand(item.seq)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <span
                      className={[
                        'shrink-0 px-2 py-0.5 rounded-full text-xs font-bold',
                        item.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                      ].join(' ')}
                    >
                      {item.correct ? '정답' : '오답'}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 shrink-0">
                      Q{item.seq}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{previewText}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={[
                        'w-4 h-4 text-gray-400 shrink-0 transition-transform',
                        isExpanded ? 'rotate-180' : '',
                      ].join(' ')}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 펼침 내용 */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                      {/* 문항 본문 */}
                      <RichContent html={item.content} className="text-gray-800 text-sm" />

                      {/* 객관식 선택지 */}
                      {item.questionType === 'MULTIPLE_CHOICE' && item.options && (
                        <div className="space-y-1.5">
                          {item.options.map((opt, idx) => {
                            const val = String(idx + 1);
                            const isUserAns = item.userAnswer === val;
                            const isCorrectAns = item.correctAnswer === val;
                            return (
                              <div
                                key={idx}
                                className={[
                                  'px-3 py-2 rounded-lg text-sm border',
                                  isCorrectAns
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : isUserAns
                                    ? 'bg-red-50 border-red-300 text-red-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-600',
                                ].join(' ')}
                              >
                                <span className="font-semibold mr-1.5">({val})</span>
                                {opt}
                                {isCorrectAns && (
                                  <span className="ml-2 text-xs font-bold text-green-600">정답</span>
                                )}
                                {isUserAns && !isCorrectAns && (
                                  <span className="ml-2 text-xs font-bold text-red-500">내 답</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 내 답 / 정답 (객관식 외) */}
                      {item.questionType !== 'MULTIPLE_CHOICE' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 shrink-0 w-14">내 답</span>
                            <span
                              className={[
                                'font-medium',
                                item.correct ? 'text-green-700' : 'text-red-600',
                              ].join(' ')}
                            >
                              {item.userAnswer || (
                                <span className="text-gray-400 font-normal">미제출</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 shrink-0 w-14">정답</span>
                            <span className="font-medium text-green-700">
                              {item.correctAnswer ?? '—'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 해설 */}
                      {item.explanation && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                          <p className="text-xs font-semibold text-gray-500">해설</p>
                          <RichContent html={item.explanation} className="text-gray-700 text-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 버튼 (다시 풀기 / 뒤로가기) */}
        <div className="flex gap-2">
          {onRetake && (
            <button
              onClick={onRetake}
              className="flex-1 py-3 bg-white text-indigo-700 border border-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-50 transition"
            >
              다시 풀기
            </button>
          )}
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
