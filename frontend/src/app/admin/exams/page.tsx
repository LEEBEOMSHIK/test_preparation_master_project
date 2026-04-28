'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Examination } from '@/types';

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams]         = useState<Examination[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    examinationService
      .adminGetExaminations(0, 100)
      .then((res) => setExams(res.data.data?.content ?? []))
      .catch(() => setError('시험 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('이 시험을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await examinationService.adminDeleteExamination(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('시험 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험 관리</h2>
          <p className="text-sm text-gray-500 mt-1">등록된 시험 목록입니다.</p>
        </div>
        <Link
          href="/admin/exams/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + 시험 등록
        </Link>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : exams.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            등록된 시험이 없습니다.{' '}
            <Link href="/admin/exams/new" className="text-indigo-500 hover:underline">
              시험을 등록해보세요.
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-4 py-3 w-12 text-center whitespace-nowrap">No.</th>
                <th className="px-4 py-3">시험 제목</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">시험 유형</th>
                <th className="px-4 py-3">사용 시험지</th>
                <th className="px-4 py-3 w-24 text-center whitespace-nowrap">제한 시간</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">등록일</th>
                <th className="px-4 py-3 w-40 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exams.map((exam, idx) => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-center">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 max-w-0">
                    <p className="truncate">{exam.title}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                      {exam.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 max-w-0">
                    <p className="truncate text-sm">{exam.examPaperTitle}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 whitespace-nowrap">
                    {exam.timeLimit}분
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                    {new Date(exam.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/exams/${exam.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition whitespace-nowrap"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2a1.886 1.886 0 012.667 2.667L5.167 13.5H2.5v-2.667L11.333 2z" />
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        disabled={deletingId === exam.id}
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
