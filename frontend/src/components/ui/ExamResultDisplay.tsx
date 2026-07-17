'use client';

import { useState } from 'react';
import { RichContent } from '@/components/ui/RichContent';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { stripHtml } from '@/lib/html';
import { hasOptions, formatAnswerAlternatives } from '@/lib/answer';
import type { ExamResultData } from '@/types';
import { SchedulingProblemTable } from '@/components/ui/SchedulingProblemTable';
import { SqlProblemView } from '@/components/ui/SqlProblemView';

interface Props {
  result: ExamResultData;
  examinationTitle?: string;
  onBack: () => void;
  backLabel?: string;
  showSavedBanner?: boolean;
  /** 제공 시 '다시 풀기' 버튼을 표시한다 (시험 응시 화면에서만 전달). */
  onRetake?: () => void;
  /** 집계 카드의 완료 헤딩 텍스트 (기본값: '시험 완료') */
  completionLabel?: string;
  /** false면 점수 집계 카드 미렌더, 기본 true */
  showScoreCard?: boolean;
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
  completionLabel,
  showScoreCard = true,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* 집계 카드 */}
        {showScoreCard && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center space-y-3">
            {examinationTitle && (
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{examinationTitle}</p>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{completionLabel ?? '시험 완료'}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {result.total}문제 중{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{result.correct}문제</span> 정답
              </p>
            </div>
            {result.takenAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500">응시일시: {formatTakenAt(result.takenAt)}</p>
            )}
          </div>
        )}

        {/* 저장 안내 배너 (제출 직후에만) */}
        {showSavedBanner && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-300">
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
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-indigo-500',
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
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-red-500',
            ].join(' ')}
          >
            오답만 ({result.total - result.correct})
          </button>
        </div>

        {/* 아코디언 목록 */}
        {allCorrect && resultFilter === 'wrong' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            모든 문항을 맞혔습니다!
          </div>
        ) : displayResults.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            표시할 문항이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {displayResults.map(item => {
              const isExpanded = expandedItems.has(item.seq);
              const previewText =
                item.title?.trim()
                || stripHtml(item.instruction ?? '')
                || stripHtml(item.content)
                || '문항 제목 없음';
              return (
                <div
                  key={item.seq}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* 헤더 */}
                  <button
                    onClick={() => toggleExpand(item.seq)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <span
                      className={[
                        'shrink-0 px-2 py-0.5 rounded-full text-xs font-bold',
                        item.correct
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                      ].join(' ')}
                    >
                      {item.correct ? '정답' : '오답'}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                      Q{item.seq}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{previewText}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={[
                        'w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform',
                        isExpanded ? 'rotate-180' : '',
                      ].join(' ')}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 펼침 내용 */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 space-y-4">
                      {item.instruction && (
                        <div className="rounded-lg bg-indigo-50/70 dark:bg-indigo-900/20 px-3 py-2">
                          <RichContent html={item.instruction} className="text-indigo-900 dark:text-indigo-200 text-sm font-medium" />
                        </div>
                      )}
                      {/* 문항 본문 */}
                      <RichContent html={item.content} className="text-gray-800 dark:text-gray-200 text-sm" />

                      {item.schedulingData && <SchedulingProblemTable data={item.schedulingData} />}

                      {item.sqlData && <SqlProblemView data={item.sqlData} />}

                      {/* 보기 목록(번호+텍스트) 참고 표시 — 유형 무관, 보기가 있으면 표시 (MULTIPLE_CHOICE 포함) */}
                      {hasOptions(item.options) && item.options && (
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
                                    ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                                    : isUserAns
                                    ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
                                ].join(' ')}
                              >
                                <span className="font-semibold mr-1.5">({val})</span>
                                {opt}
                                {isCorrectAns && (
                                  <span className="ml-2 text-xs font-bold text-green-600 dark:text-green-400">정답</span>
                                )}
                                {isUserAns && !isCorrectAns && (
                                  <span className="ml-2 text-xs font-bold text-red-500 dark:text-red-400">내 답</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 내 답 / 정답 (보기 없는 유형만 — 보기가 있으면 위 참고 표시로 대체) */}
                      {!hasOptions(item.options) && (
                        <div className="flex flex-col gap-2 text-sm">
                          {item.questionType === 'CODE' ? (
                            <>
                              <div>
                                <span className={[
                                  'text-xs font-semibold',
                                  item.correct ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                                ].join(' ')}>내 답</span>
                                {item.userAnswer ? (
                                  <CodeBlock
                                    code={item.userAnswer}
                                    language={item.language}
                                    showHeader={false}
                                    size="xs"
                                    className="mt-1"
                                  />
                                ) : (
                                  <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">미제출</span>
                                )}
                              </div>
                              {!item.correct && (
                                <div>
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">정답</span>
                                  <CodeBlock
                                    code={item.correctAnswer ?? ''}
                                    language={item.language}
                                    showHeader={false}
                                    size="xs"
                                    className="mt-1"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400 shrink-0 w-14">내 답</span>
                                <span
                                  className={[
                                    'font-medium',
                                    item.correct ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300',
                                  ].join(' ')}
                                >
                                  {item.userAnswer || (
                                    <span className="text-gray-400 dark:text-gray-500 font-normal">미제출</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400 shrink-0 w-14">정답</span>
                                <span className="font-medium text-green-700 dark:text-green-300">
                                  {item.correctAnswer ? formatAnswerAlternatives(item.correctAnswer) : '—'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* 해설 */}
                      {item.explanation && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">해설</p>
                          <RichContent html={item.explanation} className="text-gray-700 dark:text-gray-200 text-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 고정(sticky) 액션 바 — 20문항을 스크롤해도 항상 접근 가능 */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {onRetake && (
            <button
              onClick={onRetake}
              className="flex-1 py-3 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
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
