'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { examService } from '@/services/examService';
import type { QuestionSummary, QuestionType } from '@/types';

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

export default function AdminExamPaperNewPage() {
  const router = useRouter();

  // 기본 정보
  const [title, setTitle] = useState('');
  const [questionMode, setQuestionMode] = useState<'SEQUENTIAL' | 'RANDOM'>('SEQUENTIAL');

  // 문항 선택
  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [qLoading, setQLoading] = useState(true);
  const [qError, setQError] = useState('');

  // 제출
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 문항 목록 로드
  useEffect(() => {
    examService
      .adminGetQuestions(0, 200)
      .then((res) => setAllQuestions(res.data.data?.content ?? []))
      .catch(() => setQError('문항 목록을 불러오지 못했습니다.'))
      .finally(() => setQLoading(false));
  }, []);

  const filteredQuestions = allQuestions.filter((q) =>
    q.content.toLowerCase().includes(searchText.toLowerCase()),
  );

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('시험지 제목을 입력해주세요.'); return; }
    if (selectedIds.size === 0) { setError('문항을 하나 이상 선택해야 시험지를 등록할 수 있습니다.'); return; }
    setError('');
    setLoading(true);
    try {
      const selected = allQuestions.filter((q) => selectedIds.has(q.id));
      // 시험지 생성 + 문항 추가를 하나의 트랜잭션으로 처리
      await examService.adminCreateExamWithQuestions(
        title.trim(),
        questionMode,
        selected.map((q) => ({
          content: q.content,
          questionType: q.questionType,
          options: q.options ?? null,
          answer: q.answer ?? null,
          explanation: q.explanation ?? null,
          code: q.code ?? null,
          language: q.language ?? null,
        })),
      );
      router.push('/admin/exams/papers');
    } catch {
      setError('시험지 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const allSelected =
    filteredQuestions.length > 0 && filteredQuestions.every((q) => selectedIds.has(q.id));

  return (
    <div className="max-w-2xl space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/exams/papers"
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험지 등록</h2>
          <p className="text-sm text-gray-500">새 시험지를 등록하고 문항을 추가합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── 기본 정보 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <p className="text-sm font-semibold text-gray-700">기본 정보</p>

          {/* 시험지 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시험지 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2024년 1차 모의고사 시험지"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* 출제 방식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문항 출제 방식
            </label>
            <div className="flex gap-3">
              {(['SEQUENTIAL', 'RANDOM'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setQuestionMode(mode)}
                  className={[
                    'flex-1 py-2.5 rounded-lg border text-sm font-medium transition',
                    questionMode === mode
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  ].join(' ')}
                >
                  {mode === 'SEQUENTIAL' ? '순차 출제' : '랜덤 출제'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {questionMode === 'SEQUENTIAL'
                ? '문항이 등록된 순서대로 출제됩니다.'
                : '문항이 매 응시마다 무작위로 출제됩니다.'}
            </p>
          </div>
        </div>

        {/* ── 문항 선택 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">문항 선택</p>
              <p className="text-xs text-gray-400 mt-0.5">
                등록된 문항에서 이 시험지에 포함할 문항을 선택하세요.
              </p>
            </div>
            {selectedIds.size > 0 && (
              <span className="shrink-0 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                {selectedIds.size}개 선택됨
              </span>
            )}
          </div>

          {/* 검색 + 전체선택 */}
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3">
            <div className="flex-1 relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="문항 내용 검색..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>
            {filteredQuestions.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 transition whitespace-nowrap"
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            )}
          </div>

          {/* 문항 목록 */}
          <div className="max-h-72 overflow-y-auto">
            {qLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
            ) : qError ? (
              <div className="p-8 text-center space-y-1">
                <p className="text-sm text-gray-400">{qError}</p>
                <Link
                  href="/admin/exams/questions/new"
                  className="text-xs text-indigo-500 hover:underline"
                >
                  문항을 먼저 등록해보세요 →
                </Link>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <p className="text-sm text-gray-400">
                  {searchText ? '검색 결과가 없습니다.' : '등록된 문항이 없습니다.'}
                </p>
                {!searchText && (
                  <Link
                    href="/admin/exams/questions/new"
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    문항 등록하러 가기 →
                  </Link>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filteredQuestions.map((q) => {
                  const checked = selectedIds.has(q.id);
                  return (
                    <li
                      key={q.id}
                      onClick={() => toggleSelect(q.id)}
                      className={[
                        'flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors select-none',
                        checked ? 'bg-indigo-50/60' : 'hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {/* Checkbox */}
                      <div className={[
                        'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition',
                        checked ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200 bg-white',
                      ].join(' ')}>
                        {checked && (
                          <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l2.5 2.5L10 3.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2">{q.content}</p>
                        {q.options && q.options.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {q.options.slice(0, 3).join(' · ')}{q.options.length > 3 ? ' ...' : ''}
                          </p>
                        )}
                      </div>
                      <span className={[
                        'shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium',
                        TYPE_COLOR[q.questionType],
                      ].join(' ')}>
                        {TYPE_LABEL[q.questionType]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href="/admin/exams/papers"
            className="flex-1 text-center py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading
              ? '등록 중...'
              : selectedIds.size > 0
              ? `시험지 등록 (문항 ${selectedIds.size}개 포함)`
              : '시험지 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
