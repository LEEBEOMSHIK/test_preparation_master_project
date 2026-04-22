'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { examinationService } from '@/services/examinationService';
import { examService } from '@/services/examService';
import { domainService } from '@/services/domainService';
import type { ExamSummary, DomainSlave } from '@/types';

const TIME_OPTIONS = [
  { value: 30,  label: '30분' },
  { value: 60,  label: '60분' },
  { value: 90,  label: '90분' },
  { value: 120, label: '120분 (2시간)' },
  { value: 150, label: '150분' },
  { value: 180, label: '180분 (3시간)' },
];

export default function AdminExamNewPage() {
  const router = useRouter();

  const [title, setTitle]               = useState('');
  const [examPaperId, setExamPaperId]   = useState<number | null>(null);
  const [categoryId, setCategoryId]     = useState<number | null>(null);
  const [timeLimit, setTimeLimit]       = useState<number | null>(null);

  const [papers, setPapers]             = useState<ExamSummary[]>([]);
  const [examCategories, setExamCategories] = useState<DomainSlave[]>([]);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    // 시험지 목록 로드
    examService.adminGetExams(0, 200)
      .then((res) => setPapers(res.data.data?.content ?? []))
      .catch(() => {});

    // 시험 유형 카테고리 로드
    domainService.getDomains()
      .then((res) => {
        const master = (res.data.data ?? []).find((m) => m.name === '시험 유형');
        setExamCategories(master?.slaves ?? []);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())    { setError('시험 제목을 입력해주세요.'); return; }
    if (!examPaperId)     { setError('사용할 시험지를 선택해주세요.'); return; }
    if (!categoryId)      { setError('시험 유형을 선택해주세요.'); return; }
    if (!timeLimit)       { setError('시험 시간을 선택해주세요.'); return; }

    setError('');
    setLoading(true);
    try {
      await examinationService.adminCreateExamination({
        title: title.trim(),
        examPaperId,
        categoryId,
        timeLimit,
      });
      router.push('/admin/exams');
    } catch {
      setError('시험 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="text-gray-400 hover:text-gray-600 transition" aria-label="뒤로가기">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험 등록</h2>
          <p className="text-sm text-gray-500">새 시험을 등록합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 시험 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시험 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="예: 2024년 1차 SQLD 모의고사"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* 시험 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시험 유형 <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">시험 유형 선택</option>
              {examCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 시험지 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사용 시험지 <span className="text-red-400">*</span>
            </label>
            <select
              value={examPaperId ?? ''}
              onChange={(e) => setExamPaperId(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">시험지 선택</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.questionCount}문항)
                </option>
              ))}
            </select>
            {papers.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                등록된 시험지가 없습니다.{' '}
                <Link href="/admin/exams/papers/new" className="text-indigo-500 hover:underline">시험지 먼저 등록하기 →</Link>
              </p>
            )}
          </div>

          {/* 시험 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시험 시간 <span className="text-red-400">*</span>
            </label>
            <select
              value={timeLimit ?? ''}
              onChange={(e) => setTimeLimit(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">시험 시간 선택</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/admin/exams"
              className="flex-1 text-center py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '등록 중...' : '시험 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
