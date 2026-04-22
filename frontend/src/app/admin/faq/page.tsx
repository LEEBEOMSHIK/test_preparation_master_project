'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { faqService } from '@/services/faqService';
import type { Faq } from '@/types';

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    faqService.adminGetAll(page, pageSize)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setFaqs(res.data.data.content);
          setTotalPages(res.data.data.totalPages);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { setPage(0); }, [pageSize]);
  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: number) => {
    setToggling(id);
    try {
      const res = await faqService.adminToggleActive(id);
      if (res.data.success && res.data.data) {
        setFaqs((prev) => prev.map((f) => (f.id === id ? res.data.data! : f)));
      }
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('FAQ를 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      await faqService.adminDelete(id);
      load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">FAQ 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">자주 묻는 질문을 관리합니다.</p>
        </div>
        <Link
          href="/admin/faq/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          FAQ 등록
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">등록된 FAQ가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-12 whitespace-nowrap">No.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">질문</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-16 whitespace-nowrap">순서</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-16 whitespace-nowrap">공개</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-28 whitespace-nowrap">등록일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-36 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {faqs.map((faq, idx) => (
                <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-900 truncate">{faq.question}</p>
                    <p className="text-gray-400 truncate text-xs mt-0.5">{faq.answer}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-center">
                    {faq.displayOrder}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    ].join(' ')}>
                      {faq.isActive ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {faq.createdAt?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <Link
                        href={`/admin/faq/${faq.id}/edit`}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleToggle(faq.id)}
                        disabled={toggling === faq.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {faq.isActive ? '비공개' : '공개'}
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        disabled={deleting === faq.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
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

      {/* Footer */}
      {!loading && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            >
              {[10, 20, 50].map((s) => (
                <option key={s} value={s}>{s}개</option>
              ))}
            </select>
            <span>/ 총 {totalElements}건</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1)
              .reduce<(number | '...')[]>((acc, i, idx, arr) => {
                if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={[
                      'w-8 h-8 rounded-lg text-sm transition-colors',
                      page === item ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {(item as number) + 1}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
