'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import type { UserExamHistorySummary } from '@/types';

function formatTakenAt(takenAt: string): string {
  const d = new Date(takenAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={['px-2.5 py-1 rounded-full text-sm font-bold shrink-0', cls].join(' ')}>
      {score}점
    </span>
  );
}

export default function ExamHistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<UserExamHistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setLoading(true);
    examinationService
      .userGetExamHistories(page, 10)
      .then(res => {
        if (res.data.success && res.data.data) {
          setHistories(res.data.data.content);
          setTotalPages(res.data.data.totalPages);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">시험 이력</h1>
        {!loading && (
          <span className="text-sm text-gray-500 dark:text-gray-400">총 {totalElements}건</span>
        )}
      </div>

      {/* 로딩 */}
      {loading && <CardListSkeleton rows={10} />}

      {/* 빈 상태 */}
      {!loading && histories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">아직 응시한 시험이 없습니다.</p>
          <button
            onClick={() => router.push('/user/exams')}
            className="text-sm text-indigo-600 hover:underline"
          >
            시험 목록으로
          </button>
        </div>
      )}

      {/* 이력 목록 */}
      {!loading && histories.length > 0 && (
        <div className="space-y-2">
          {histories.map(h => (
            <button
              key={h.id}
              onClick={() => router.push(`/user/exam-history/${h.id}`)}
              className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition text-left"
            >
              {/* 왼쪽: 시험명 + 응시일시 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {h.examinationTitle}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatTakenAt(h.takenAt)}
                </p>
              </div>

              {/* 오른쪽: 점수 배지 + 정답수 + 화살표 */}
              <div className="flex items-center gap-2 shrink-0">
                <ScoreBadge score={h.score} />
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {h.correctCount}/{h.totalQuestions}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4 text-gray-300 dark:text-gray-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            이전
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            페이지 {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
