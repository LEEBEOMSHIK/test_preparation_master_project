'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { QuestionDetailModal } from '@/components/ui/QuestionDetailModal';
import { bookmarkService } from '@/services/bookmarkService';
import { stripHtml } from '@/lib/html';
import type { BookmarkQuestion, QuestionType } from '@/types';
import type { QuestionDetailItem } from '@/components/ui/QuestionDetailModal';

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
  OX: 'O/X',
  CODE: '코드',
};
const TYPE_COLOR: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600',
  SHORT_ANSWER: 'bg-green-50 text-green-600',
  OX: 'bg-amber-50 text-amber-600',
  CODE: 'bg-violet-50 text-violet-600',
};

function bookmarkToDetailItem(bq: BookmarkQuestion): QuestionDetailItem {
  return {
    id: bq.questionBankId,
    title: bq.title,
    examYear: bq.examYear,
    examRound: bq.examRound,
    content: bq.content,
    questionType: bq.questionType,
    options: bq.options,
    answer: bq.answer,
    code: bq.code,
    language: bq.language,
    explanation: bq.explanation,
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetailItem | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    bookmarkService.getBookmarks()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setBookmarks(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveBookmark = useCallback(async (bq: BookmarkQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (togglingId === bq.questionBankId) return;
    setTogglingId(bq.questionBankId);
    try {
      const res = await bookmarkService.toggle(bq.questionBankId);
      if (res.data.success && res.data.data?.bookmarked === false) {
        // 낙관적 제거
        setBookmarks((prev) => prev.filter((item) => item.bookmarkId !== bq.bookmarkId));
      }
    } catch {
      // 실패 시 조용히 무시 (목록 상태 유지)
    } finally {
      setTogglingId(null);
    }
  }, [togglingId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-lg font-bold text-gray-900">즐겨찾기</h1>
        <CardListSkeleton rows={6} />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-lg font-bold text-gray-900">즐겨찾기</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-amber-400">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">즐겨찾기한 문항이 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">데일리 퀴즈에서 별 아이콘을 눌러 문항을 즐겨찾기해보세요.</p>
          <button
            onClick={() => router.push('/user/quiz')}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
          >
            데일리 퀴즈 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">즐겨찾기</h1>
        <span className="text-sm text-gray-400">{bookmarks.length}개 문항</span>
      </div>

      <div className="grid gap-3">
        {bookmarks.map((bq) => {
          const preview = stripHtml(bq.content);
          return (
            <div
              key={bq.bookmarkId}
              onClick={() => setSelectedQuestion(bookmarkToDetailItem(bq))}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* 뱃지 영역 */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className={[
                      'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      TYPE_COLOR[bq.questionType],
                    ].join(' ')}>
                      {TYPE_LABEL[bq.questionType]}
                    </span>
                    {bq.categoryName && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 truncate max-w-[120px]">
                        {bq.categoryName}
                      </span>
                    )}
                    {(bq.examYear || bq.examRound) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 shrink-0">
                        {bq.examYear ? `${bq.examYear}년` : ''}
                        {bq.examYear && bq.examRound ? ' ' : ''}
                        {bq.examRound ? `제${bq.examRound}회` : ''}
                      </span>
                    )}
                  </div>

                  {/* 문항 내용 미리보기 */}
                  <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                    {preview || '(내용 없음)'}
                  </p>
                </div>

                {/* 북마크 해제 버튼 */}
                <button
                  onClick={(e) => handleRemoveBookmark(bq, e)}
                  disabled={togglingId === bq.questionBankId}
                  className="shrink-0 p-1.5 rounded-lg text-amber-400 hover:text-gray-400 hover:bg-gray-100 transition disabled:opacity-50"
                  title="즐겨찾기 해제"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <QuestionDetailModal
        question={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        hideEditLink
      />
    </div>
  );
}
