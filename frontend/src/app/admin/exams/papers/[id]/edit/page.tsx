'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examService } from '@/services/examService';
import type { ExamQuestion, QuestionSummary, QuestionType } from '@/types';
import { stripHtml } from '@/lib/html';
import { QuestionDetailModal, type QuestionDetailItem } from '@/components/ui/QuestionDetailModal';

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
  OX: 'O/X',
  CODE: '코드',
  SCHEDULING: '스케줄링',
};
const TYPE_COLOR: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600',
  SHORT_ANSWER:    'bg-green-50 text-green-600',
  OX:              'bg-amber-50 text-amber-600',
  CODE:            'bg-violet-50 text-violet-600',
  SCHEDULING:      'bg-teal-50 text-teal-600',
};

export default function AdminExamPaperEditPage() {
  const router = useRouter();
  const params = useParams();
  const id     = Number(params.id);

  // ── 기본 정보 ──
  const [title,        setTitle]        = useState('');
  const [questionMode, setQuestionMode] = useState<'SEQUENTIAL' | 'RANDOM'>('SEQUENTIAL');
  const [infoLoading,  setInfoLoading]  = useState(false);

  // ── 현재 문항 목록 ──
  const [examQuestions,    setExamQuestions]    = useState<ExamQuestion[]>([]);
  const [qListLoading,     setQListLoading]     = useState(true);
  const [removingId,       setRemovingId]       = useState<number | null>(null);

  // ── 문항 추가 (문항 풀) ──
  const [allQuestions,  setAllQuestions]  = useState<QuestionSummary[]>([]);
  const [selectedIds,   setSelectedIds]   = useState<Set<number>>(new Set());
  const [searchText,    setSearchText]    = useState('');
  const [bankLoading,   setBankLoading]   = useState(true);
  const [addingBulk,    setAddingBulk]    = useState(false);

  // ── 파일(PDF)로 문항 추가 ──
  const [uploadingPdf,  setUploadingPdf]  = useState(false);
  const [uploadResult,  setUploadResult]  = useState('');

  const [fetching, setFetching]   = useState(true);
  const [error,    setError]      = useState('');
  const [detailQ,  setDetailQ]    = useState<QuestionDetailItem | null>(null);

  // ── 초기 로드 ──
  useEffect(() => {
    Promise.all([
      examService.adminGetExam(id),
      examService.adminGetExamQuestions(id),
      examService.adminGetQuestions(0, 500),
    ])
      .then(([examRes, questionsRes, bankRes]) => {
        const exam = examRes.data.data;
        if (exam) {
          setTitle(exam.title);
          setQuestionMode(exam.questionMode as 'SEQUENTIAL' | 'RANDOM');
        }
        setExamQuestions(questionsRes.data.data ?? []);
        setAllQuestions(bankRes.data.data?.content ?? []);
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => {
        setFetching(false);
        setQListLoading(false);
        setBankLoading(false);
      });
  }, [id]);

  // ── 기본 정보 저장 ──
  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('시험지 제목을 입력해주세요.'); return; }
    setError('');
    setInfoLoading(true);
    try {
      await examService.adminUpdateExam(id, { title: title.trim(), questionMode });
      setError('');
    } catch {
      setError('시험지 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setInfoLoading(false);
    }
  };

  // ── 문항 삭제 ──
  const handleRemoveQuestion = async (questionId: number) => {
    if (!confirm('이 문항을 시험지에서 제거하시겠습니까?')) return;
    setRemovingId(questionId);
    try {
      await examService.adminRemoveQuestion(id, questionId);
      setExamQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch {
      setError('문항 제거에 실패했습니다.');
    } finally {
      setRemovingId(null);
    }
  };

  // ── 문항 추가 ──
  const alreadyInExamIds = new Set(examQuestions.map((q) => q.id));
  const filteredBank = allQuestions.filter(
    (q) =>
      !alreadyInExamIds.has(q.id) &&
      q.content.toLowerCase().includes(searchText.toLowerCase()),
  );

  const toggleSelect = (qId: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return;
    setAddingBulk(true);
    setError('');
    try {
      const toAdd = allQuestions.filter((q) => selectedIds.has(q.id));
      await examService.adminAddQuestionsBulk(
        id,
        toAdd.map((q) => ({
          content:      q.content,
          questionType: q.questionType,
          options:      q.options ?? null,
          answer:       q.answer ?? null,
          explanation:  q.explanation ?? null,
          code:         q.code ?? null,
          language:     q.language ?? null,
          categoryId:   q.categoryId ?? null,
        })),
      );
      // 문항 목록 새로고침
      const refreshed = await examService.adminGetExamQuestions(id);
      setExamQuestions(refreshed.data.data ?? []);
      setSelectedIds(new Set());
    } catch {
      setError('문항 추가에 실패했습니다.');
    } finally {
      setAddingBulk(false);
    }
  };

  // ── PDF 업로드 → 서버 파싱 ──
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드할 수 있습니다.');
      setUploadResult('');
      return;
    }
    setError('');
    setUploadResult('');
    setUploadingPdf(true);
    try {
      const res = await examService.adminUploadQuestions(id, file);
      const imported = res.data.data?.imported ?? 0;
      const refreshed = await examService.adminGetExamQuestions(id);
      setExamQuestions(refreshed.data.data ?? []);
      setUploadResult(`${imported}개 문항을 가져왔습니다. 정답·해설은 문항 상세에서 확인·보정하세요.`);
    } catch {
      setError('PDF 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadingPdf(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <QuestionDetailModal question={detailQ} onClose={() => setDetailQ(null)} />
    <div className="max-w-2xl space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/exams/papers" className="text-gray-400 hover:text-gray-600 transition" aria-label="뒤로가기">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험지 수정</h2>
          <p className="text-sm text-gray-500">기본 정보를 수정하고, 문항을 추가/제거합니다.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* ── 기본 정보 ── */}
      <form onSubmit={handleInfoSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <p className="text-sm font-semibold text-gray-700">기본 정보</p>

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
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">문항 출제 방식</label>
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
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={infoLoading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {infoLoading ? '저장 중...' : '기본 정보 저장'}
          </button>
        </div>
      </form>

      {/* ── 현재 문항 목록 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">현재 문항</p>
            <p className="text-xs text-gray-400 mt-0.5">{examQuestions.length}개 포함됨</p>
          </div>
        </div>

        {qListLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : examQuestions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">등록된 문항이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {examQuestions.map((q) => (
              <li key={q.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="shrink-0 w-8 h-6 flex items-center justify-center text-xs font-mono text-gray-400 bg-gray-50 rounded mt-0.5">
                  {q.seq}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{stripHtml(q.content)}</p>
                  {q.options && q.options.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {q.options.slice(0, 3).join(' · ')}{q.options.length > 3 ? ' ...' : ''}
                    </p>
                  )}
                </div>
                {q.categoryName ? (
                  <span className="shrink-0 mt-0.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {q.categoryName}
                  </span>
                ) : (
                  <span className="shrink-0 mt-0.5 text-xs text-gray-300">—</span>
                )}
                <span className={['shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLOR[q.questionType]].join(' ')}>
                  {TYPE_LABEL[q.questionType]}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailQ(q)}
                  className="shrink-0 mt-0.5 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-medium transition whitespace-nowrap"
                >
                  상세
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  disabled={removingId === q.id}
                  className="shrink-0 mt-0.5 p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-40"
                  title="문항 제거"
                >
                  {removingId === q.id ? (
                    <div className="w-4 h-4 border border-red-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 파일(PDF)로 문항 추가 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">파일로 문항 추가</p>
          <p className="text-xs text-gray-400 mt-0.5">PDF 기출 파일을 올리면 문항을 자동으로 분리해 추가합니다.</p>
        </div>
        <label
          className={[
            'flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed text-sm font-medium transition',
            uploadingPdf
              ? 'border-gray-200 text-gray-300 cursor-wait'
              : 'border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer',
          ].join(' ')}
        >
          {uploadingPdf ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              업로드·파싱 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16" />
              </svg>
              PDF 파일 선택
            </>
          )}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfUpload}
            disabled={uploadingPdf}
            className="hidden"
          />
        </label>
        {uploadResult && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2.5">{uploadResult}</p>
        )}
        <p className="text-xs text-gray-400">
          ※ 문항 번호(1. / 문 1. 등)와 보기(①②③④ / 1)2)3)4))를 기준으로 분리합니다. 분리에 실패하면 전체 내용이 1개 문항으로 저장됩니다.
        </p>
      </div>

      {/* ── 문항 추가 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">문항 추가</p>
            <p className="text-xs text-gray-400 mt-0.5">문항 풀에서 추가할 문항을 선택하세요.</p>
          </div>
          {selectedIds.size > 0 && (
            <span className="shrink-0 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
              {selectedIds.size}개 선택됨
            </span>
          )}
        </div>

        {/* 검색 */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="relative">
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
        </div>

        {/* 문항 목록 */}
        <div className="max-h-64 overflow-y-auto">
          {bankLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : filteredBank.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              {searchText ? '검색 결과가 없습니다.' : '추가 가능한 문항이 없습니다.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filteredBank.map((q) => {
                const checked = selectedIds.has(q.id);
                return (
                  <li
                    key={q.id}
                    onClick={() => toggleSelect(q.id)}
                    className={[
                      'flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors select-none',
                      checked ? 'bg-indigo-50/60' : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
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
                      <p className="text-sm text-gray-800 truncate">{stripHtml(q.content)}</p>
                    </div>
                    {q.categoryName ? (
                      <span className="shrink-0 mt-0.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {q.categoryName}
                      </span>
                    ) : (
                      <span className="shrink-0 mt-0.5 text-xs text-gray-300">—</span>
                    )}
                    <span className={['shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLOR[q.questionType]].join(' ')}>
                      {TYPE_LABEL[q.questionType]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDetailQ(q); }}
                      className="shrink-0 mt-0.5 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-medium transition whitespace-nowrap"
                    >
                      상세
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 추가 버튼 */}
        {selectedIds.size > 0 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={addingBulk}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {addingBulk ? '추가 중...' : `선택한 문항 ${selectedIds.size}개 추가`}
            </button>
          </div>
        )}
      </div>

      {/* 하단 취소 버튼 */}
      <div className="flex justify-end">
        <Link
          href="/admin/exams/papers"
          className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          목록으로
        </Link>
      </div>
    </div>
    </>
  );
}
