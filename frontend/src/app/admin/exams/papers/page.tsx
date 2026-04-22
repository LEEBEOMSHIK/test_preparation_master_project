'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examService } from '@/services/examService';
import type { ExamSummary } from '@/types';

const MODE_LABEL: Record<string, string> = {
  SEQUENTIAL: '순차',
  RANDOM: '랜덤',
};

export default function AdminExamPapersPage() {
  const router = useRouter();
  const [papers, setPapers]     = useState<ExamSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    examService
      .adminGetExams(0, 100)
      .then((res) => setPapers(res.data.data?.content ?? []))
      .catch(() => setError('시험지 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('이 시험지를 삭제하시겠습니까?\n포함된 문항도 함께 삭제됩니다.')) return;
    setDeletingId(id);
    try {
      await examService.adminDeleteExam(id);
      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('시험지 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험지 관리</h2>
          <p className="text-sm text-gray-500 mt-1">등록된 시험지 목록입니다.</p>
        </div>
        <Link
          href="/admin/exams/papers/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + 시험지 등록
        </Link>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : papers.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            등록된 시험지가 없습니다.{' '}
            <Link href="/admin/exams/papers/new" className="text-indigo-500 hover:underline">
              시험지를 등록해보세요.
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-4 py-3 w-12 text-center whitespace-nowrap">No.</th>
                <th className="px-4 py-3">시험지 제목</th>
                <th className="px-4 py-3 w-24 text-center whitespace-nowrap">출제 방식</th>
                <th className="px-4 py-3 w-20 text-center whitespace-nowrap">문항 수</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">등록일</th>
                <th className="px-4 py-3 w-44 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {papers.map((paper, idx) => (
                <tr key={paper.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-center whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 max-w-0">
                    <p className="truncate">{paper.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={[
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      paper.questionMode === 'RANDOM'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600',
                    ].join(' ')}>
                      {MODE_LABEL[paper.questionMode] ?? paper.questionMode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 whitespace-nowrap">
                    {paper.questionCount}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                    {new Date(paper.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/exams/papers/${paper.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition whitespace-nowrap"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2a1.886 1.886 0 012.667 2.667L5.167 13.5H2.5v-2.667L11.333 2z" />
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        disabled={deletingId === paper.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold transition whitespace-nowrap disabled:opacity-50"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h12M5.333 4V2.667h5.334V4M6.667 7.333v4M9.333 7.333v4M3.333 4l.667 9.333h8L12.667 4" />
                        </svg>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
