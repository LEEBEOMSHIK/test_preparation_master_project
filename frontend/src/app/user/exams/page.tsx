'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { examService } from '@/services/examService';
import { quoteService } from '@/services/quoteService';
import type { ExamSummary, Quote } from '@/types';

export default function UserExamsPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const quoteFetched = useRef(false);

  useEffect(() => {
    Promise.all([
      examService.getExams(0, 50),
      !quoteFetched.current ? quoteService.getRandom() : Promise.resolve(null),
    ]).then(([examRes, quoteRes]) => {
      if (examRes.data.success && examRes.data.data) {
        setExams(examRes.data.data.content);
      }
      if (quoteRes && quoteRes.data.success && quoteRes.data.data) {
        setQuote(quoteRes.data.data);
        setShowQuote(true);
        quoteFetched.current = true;
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {/* 랜덤 명언 모달 */}
      {showQuote && quote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium text-base leading-relaxed">&ldquo;{quote.content}&rdquo;</p>
            {quote.author && (
              <p className="text-sm text-gray-400">— {quote.author}</p>
            )}
            <button
              onClick={() => setShowQuote(false)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
            >
              오늘도 화이팅!
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900">시험 목록</h2>
        <p className="text-sm text-gray-500 mt-1">응시 가능한 시험 목록입니다.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
          등록된 시험이 없습니다.
        </div>
      ) : (
        <div className="grid gap-3">
          {exams.map(exam => (
            <Link
              key={exam.id}
              href={`/user/exams/${exam.id}`}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition truncate">
                  {exam.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  문항 {exam.questionCount}개 &middot; {exam.questionMode === 'RANDOM' ? '랜덤 출제' : '순서 출제'}
                </p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 shrink-0 ml-4 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
