'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { extractApiErrorMessage } from '@/lib/apiError';
import {
  getInquiryTargetAreaLabel,
  INQUIRY_REQUEST_TYPES,
  INQUIRY_STATUSES,
  INQUIRY_TARGET_AREAS,
} from '@/lib/inquiry';
import { useColumnResize } from '@/lib/useColumnResize';
import { inquiryService } from '@/services/inquiryService';
import type { InquiryRequestType, InquiryStatus, InquirySummary } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUS_COLOR: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  ON_HOLD: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  ANSWERED: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  UNABLE_TO_PROCESS: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function AdminInquiriesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');
  const initialRequestType = INQUIRY_REQUEST_TYPES.find((type) => type === initialType) ?? '';

  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [requestTypeFilter, setRequestTypeFilter] = useState<InquiryRequestType | ''>(initialRequestType);
  const [targetArea, setTargetArea] = useState('');
  const [appliedTargetArea, setAppliedTargetArea] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { widths, startResize } = useColumnResize(
    'tpmp:admin-inquiries:col-widths:v3',
    [56, 300, 120, 110, 110, 110, 88],
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    inquiryService
      .adminGetAll(page, pageSize, {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(requestTypeFilter ? { requestType: requestTypeFilter } : {}),
        ...(appliedTargetArea ? { targetArea: appliedTargetArea } : {}),
        ...(appliedKeyword ? { keyword: appliedKeyword } : {}),
      })
      .then((response) => {
        const result = response.data.data;
        setInquiries(result?.content ?? []);
        setTotalElements(result?.totalElements ?? 0);
        setTotalPages(result?.totalPages ?? 0);
      })
      .catch((requestError: unknown) => {
        setInquiries([]);
        setTotalElements(0);
        setTotalPages(0);
        setError(extractApiErrorMessage(requestError, '문의·요청 목록을 불러오지 못했습니다.'));
      })
      .finally(() => setLoading(false));
  }, [appliedKeyword, appliedTargetArea, page, pageSize, requestTypeFilter, statusFilter]);

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim());
    setAppliedTargetArea(targetArea.trim());
    setPage(0);
  };

  const handleReset = () => {
    setStatusFilter('');
    setRequestTypeFilter('');
    setTargetArea('');
    setAppliedTargetArea('');
    setKeyword('');
    setAppliedKeyword('');
    setPage(0);
  };

  const handleDelete = async (event: React.MouseEvent, inquiryId: number) => {
    event.preventDefault();
    if (!confirm('이 문의·요청을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    setDeleting(inquiryId);
    setError('');
    try {
      await inquiryService.adminDelete(inquiryId);
      setInquiries((current) => current.filter((inquiry) => inquiry.id !== inquiryId));
      setTotalElements((current) => Math.max(0, current - 1));
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '문의·요청을 삭제하지 못했습니다.'));
    } finally {
      setDeleting(null);
    }
  };

  const hasFilters = Boolean(
    statusFilter || requestTypeFilter || appliedTargetArea || appliedKeyword,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">문의·요청 관리</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            사용자 문의와 처리 요청을 확인하고 답변합니다.
          </p>
        </div>
        <Link
          href="/admin/inquiries/settings"
          className="self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          수신 이메일 설정
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            상태
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as InquiryStatus | '');
                setPage(0);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">전체</option>
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>{INQUIRY_STATUS_LABEL[status]}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            접수 유형
            <select
              value={requestTypeFilter}
              onChange={(event) => {
                setRequestTypeFilter(event.target.value as InquiryRequestType | '');
                setPage(0);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">전체</option>
              {INQUIRY_REQUEST_TYPES.map((requestType) => (
                <option key={requestType} value={requestType}>{INQUIRY_TYPE_LABEL[requestType]}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            발생 영역
            <select
              value={targetArea}
              onChange={(event) => setTargetArea(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">전체</option>
              {INQUIRY_TARGET_AREAS.map((area) => (
                <option key={area} value={area}>{getInquiryTargetAreaLabel(area)}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 xl:col-span-2">
            제목 / 작성자
            <div className="mt-1 flex gap-2">
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                placeholder="검색어를 입력하세요"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                검색
              </button>
            </div>
          </label>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 text-sm text-gray-500 underline underline-offset-2 dark:text-gray-400"
          >
            검색 조건 초기화
          </button>
        )}
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            {hasFilters ? '검색 결과가 없습니다.' : '등록된 문의·요청이 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                {widths.map((width, index) => <col key={index} style={{ width }} />)}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">No.<ColResizeHandle onMouseDown={(event) => startResize(0, event)} /></th>
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">제목<ColResizeHandle onMouseDown={(event) => startResize(1, event)} /></th>
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">유형<ColResizeHandle onMouseDown={(event) => startResize(2, event)} /></th>
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">작성자<ColResizeHandle onMouseDown={(event) => startResize(3, event)} /></th>
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">상태<ColResizeHandle onMouseDown={(event) => startResize(4, event)} /></th>
                  <th className="relative px-4 py-3 text-left font-medium text-gray-500">등록일<ColResizeHandle onMouseDown={(event) => startResize(5, event)} /></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {inquiries.map((inquiry, index) => (
                  <tr key={inquiry.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 text-gray-400">{page * pageSize + index + 1}</td>
                    <td className="overflow-hidden px-4 py-3 font-medium">
                      <Link
                        href={`/admin/inquiries/${inquiry.id}`}
                        className="block truncate text-gray-900 transition hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                      >
                        {inquiry.title}
                      </Link>
                      {inquiry.targetArea && (
                        <span className="mt-0.5 block truncate text-xs font-normal text-gray-400">
                          {getInquiryTargetAreaLabel(inquiry.targetArea)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {INQUIRY_TYPE_LABEL[inquiry.requestType]}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inquiry.userName ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[inquiry.status]}`}>
                        {INQUIRY_STATUS_LABEL[inquiry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{inquiry.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => void handleDelete(event, inquiry.id)}
                        disabled={deleting === inquiry.id}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400"
                      >
                        {deleting === inquiry.id ? '삭제 중' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalElements > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as PageSize);
                setPage(0);
              }}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}개</option>)}
            </select>
            <span>/ 총 {totalElements}건</span>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={7} />}>
      <AdminInquiriesContent />
    </Suspense>
  );
}
