'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RichContent } from '@/components/ui/RichContent';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { stripHtml } from '@/lib/html';
import { hasOptions, formatAnswerAlternatives } from '@/lib/answer';
import type { ExamResultData } from '@/types';
import { SchedulingProblemTable } from '@/components/ui/SchedulingProblemTable';
import { SqlProblemView } from '@/components/ui/SqlProblemView';
import { bookmarkService } from '@/services/bookmarkService';

const useCommittedLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [pendingBookmarkIds, setPendingBookmarkIds] = useState<Set<number>>(new Set());
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [canRetryBookmarkLoad, setCanRetryBookmarkLoad] = useState(false);
  const [bookmarkLoadRetryKey, setBookmarkLoadRetryKey] = useState(0);
  const [bookmarkLoadStatus, setBookmarkLoadStatus] = useState<{
    result: ExamResultData | null;
    retryKey: number;
    loading: boolean;
    known: boolean;
  }>({ result: null, retryKey: -1, loading: false, known: false });
  const pendingBookmarkIdsRef = useRef<Set<number>>(new Set());
  const bookmarkMutationVersionsRef = useRef<Map<number, number>>(new Map());
  const visibleQuestionBankIdsRef = useRef<Set<number>>(new Set());
  const bookmarkGenerationRef = useRef(0);
  const mountedRef = useRef(false);

  const questionBankIds = useMemo(
    () => Array.from(new Set(
      result.results
        .map(item => item.questionBankId)
        .filter((id): id is number => id !== null && id !== undefined),
    )),
    [result.results],
  );
  const visibleQuestionBankIds = useMemo(() => new Set(questionBankIds), [questionBankIds]);

  const isCurrentBookmarkLoad =
    bookmarkLoadStatus.result === result && bookmarkLoadStatus.retryKey === bookmarkLoadRetryKey;
  const isBookmarkListLoading =
    questionBankIds.length > 0 && (!isCurrentBookmarkLoad || bookmarkLoadStatus.loading);
  const isBookmarkStateUnknown =
    questionBankIds.length > 0 && (!isCurrentBookmarkLoad || !bookmarkLoadStatus.known);
  const isBookmarkInteractionBlocked = isBookmarkListLoading || isBookmarkStateUnknown;

  useCommittedLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      visibleQuestionBankIdsRef.current = new Set();
      bookmarkGenerationRef.current += 1;
    };
  }, []);

  useCommittedLayoutEffect(() => {
    visibleQuestionBankIdsRef.current = visibleQuestionBankIds;
  }, [visibleQuestionBankIds]);

  useEffect(() => {
    const generation = ++bookmarkGenerationRef.current;
    const idsForResult = new Set(
      result.results
        .map(item => item.questionBankId)
        .filter((id): id is number => id !== null && id !== undefined),
    );
    const mutationVersionsAtLoad = new Map(
      Array.from(
        idsForResult,
        id => [id, bookmarkMutationVersionsRef.current.get(id) ?? 0] as const,
      ),
    );
    let active = true;

    setBookmarkError(null);
    setCanRetryBookmarkLoad(false);
    setBookmarkLoadStatus({
      result,
      retryKey: bookmarkLoadRetryKey,
      loading: idsForResult.size > 0,
      known: idsForResult.size === 0,
    });

    if (idsForResult.size === 0) {
      setBookmarkedIds(new Set());
      return () => {
        active = false;
      };
    }

    bookmarkService.getBookmarkedIds()
      .then((response) => {
        if (!active || !mountedRef.current || bookmarkGenerationRef.current !== generation) return;
        if (!response.data.success || !response.data.data) {
          setBookmarkedIds(new Set());
          setBookmarkError('복습 표시 정보를 불러오지 못했습니다.');
          setCanRetryBookmarkLoad(true);
          setBookmarkLoadStatus({
            result,
            retryKey: bookmarkLoadRetryKey,
            loading: false,
            known: false,
          });
          return;
        }
        const loadedIds = new Set(response.data.data);
        setBookmarkedIds(prev => {
          const next = new Set(Array.from(prev).filter(id => idsForResult.has(id)));
          idsForResult.forEach(id => {
            const versionAtLoad = mutationVersionsAtLoad.get(id) ?? 0;
            const currentVersion = bookmarkMutationVersionsRef.current.get(id) ?? 0;
            if (currentVersion !== versionAtLoad) return;
            if (loadedIds.has(id)) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
          return next;
        });
        setBookmarkLoadStatus({
          result,
          retryKey: bookmarkLoadRetryKey,
          loading: false,
          known: true,
        });
      })
      .catch(() => {
        if (!active || !mountedRef.current || bookmarkGenerationRef.current !== generation) return;
        setBookmarkedIds(new Set());
        setBookmarkError('복습 표시 정보를 불러오지 못했습니다.');
        setCanRetryBookmarkLoad(true);
        setBookmarkLoadStatus({
          result,
          retryKey: bookmarkLoadRetryKey,
          loading: false,
          known: false,
        });
      });

    return () => {
      active = false;
    };
  }, [result, bookmarkLoadRetryKey]);

  const handleToggleBookmark = useCallback(async (questionBankId: number) => {
    if (isBookmarkInteractionBlocked || pendingBookmarkIdsRef.current.has(questionBankId)) return;

    const generation = bookmarkGenerationRef.current;
    pendingBookmarkIdsRef.current.add(questionBankId);
    bookmarkMutationVersionsRef.current.set(
      questionBankId,
      (bookmarkMutationVersionsRef.current.get(questionBankId) ?? 0) + 1,
    );
    setPendingBookmarkIds(new Set(pendingBookmarkIdsRef.current));
    setBookmarkError(null);
    setCanRetryBookmarkLoad(false);

    try {
      const response = await bookmarkService.toggle(questionBankId);
      if (!response.data.success || !response.data.data) {
        if (mountedRef.current && bookmarkGenerationRef.current === generation) {
          setBookmarkError('복습 표시를 변경하지 못했습니다. 다시 시도해 주세요.');
        }
        return;
      }
      const bookmarked = response.data.data.bookmarked;
      bookmarkMutationVersionsRef.current.set(
        questionBankId,
        (bookmarkMutationVersionsRef.current.get(questionBankId) ?? 0) + 1,
      );

      if (mountedRef.current && visibleQuestionBankIdsRef.current.has(questionBankId)) {
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (bookmarked) {
            next.add(questionBankId);
          } else {
            next.delete(questionBankId);
          }
          return next;
        });
      }
    } catch {
      if (mountedRef.current && bookmarkGenerationRef.current === generation) {
        setBookmarkError('복습 표시를 변경하지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      pendingBookmarkIdsRef.current.delete(questionBankId);
      if (mountedRef.current) {
        setPendingBookmarkIds(new Set(pendingBookmarkIdsRef.current));
      }
    }
  }, [isBookmarkInteractionBlocked]);

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

        {bookmarkError && questionBankIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <p role="alert">{bookmarkError}</p>
            {canRetryBookmarkLoad && (
              <button
                type="button"
                onClick={() => setBookmarkLoadRetryKey(key => key + 1)}
                className="font-medium underline underline-offset-2"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {isBookmarkListLoading && (
          <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
            복습 표시 상태를 불러오는 중입니다.
          </p>
        )}

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
              const questionBankId = item.questionBankId;
              const hasQuestionBankId = questionBankId !== null && questionBankId !== undefined;
              const isBookmarked = hasQuestionBankId && bookmarkedIds.has(questionBankId);
              const isBookmarkPending = hasQuestionBankId && pendingBookmarkIds.has(questionBankId);
              const isBookmarkButtonDisabled =
                isBookmarkInteractionBlocked || isBookmarkPending;
              const bookmarkButtonLabel = isBookmarkListLoading
                ? '복습 표시 상태 불러오는 중'
                : isBookmarkStateUnknown
                ? '복습 표시 상태 확인 필요'
                : isBookmarkPending
                ? '복습 표시 변경 중'
                : isBookmarked
                ? '복습 표시됨'
                : '복습 표시';
              const bookmarkButtonTitle = isBookmarkListLoading
                ? '복습 표시 상태를 불러오는 중입니다'
                : isBookmarkStateUnknown
                ? '복습 표시 상태 확인이 필요합니다. 상단에서 다시 시도해 주세요'
                : isBookmarkPending
                ? '복습 표시 상태를 변경하는 중입니다'
                : isBookmarked
                ? '복습 표시 해제'
                : '나중에 다시 풀 문제로 표시';
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
                  <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <button
                      onClick={() => toggleExpand(item.seq)}
                      aria-expanded={isExpanded}
                      className="min-w-0 flex-1 flex items-center gap-3 px-4 py-3 text-left"
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
                    {hasQuestionBankId && (
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(questionBankId)}
                        disabled={isBookmarkButtonDisabled}
                        aria-busy={isBookmarkListLoading || isBookmarkPending}
                        aria-pressed={isBookmarkStateUnknown ? undefined : isBookmarked}
                        aria-label={bookmarkButtonLabel}
                        title={bookmarkButtonTitle}
                        className={[
                          'shrink-0 mr-2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 disabled:cursor-not-allowed',
                          isBookmarked
                            ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                            : 'border-amber-200 text-amber-500 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20',
                        ].join(' ')}
                      >
                        {isBookmarked ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-500" aria-hidden="true">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        )}
                        <span>
                          {isBookmarkListLoading
                            ? '불러오는 중'
                            : isBookmarkStateUnknown
                            ? '상태 확인 필요'
                            : isBookmarkPending
                            ? '변경 중'
                            : isBookmarked
                            ? '복습 표시됨'
                            : '복습 표시'}
                        </span>
                      </button>
                    )}
                  </div>

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

                      {/* 문제 코드(지문 코드) */}
                      {item.code && (
                        <CodeBlock
                          code={item.code}
                          language={item.language}
                          size="xs"
                        />
                      )}

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
                                  {item.correctAnswer ? formatAnswerAlternatives(item.correctAnswer, item.disableAlternativeAnswer) : '—'}
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
