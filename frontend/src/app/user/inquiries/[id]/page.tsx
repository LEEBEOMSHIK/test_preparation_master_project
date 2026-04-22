'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { inquiryService } from '@/services/inquiryService';
import type { Inquiry } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ON_HOLD: 'bg-gray-100 text-gray-600',
  ANSWERED: 'bg-green-100 text-green-700',
};

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    inquiryService.getMyInquiry(Number(id))
      .then((res) => {
        if (res.data.success && res.data.data) {
          setInquiry(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('문의를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await inquiryService.delete(Number(id));
      router.push('/user/inquiries');
    } catch {
      alert('삭제에 실패했습니다.');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>;
  }

  if (!inquiry) {
    return (
      <div className="p-12 text-center text-sm text-gray-400">
        문의를 찾을 수 없습니다.
        <Link href="/user/inquiries" className="block mt-2 text-indigo-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/user/inquiries" className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">문의 상세</h2>
      </div>

      {/* Inquiry */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Meta */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <span className={['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLOR[inquiry.status]].join(' ')}>
            {INQUIRY_STATUS_LABEL[inquiry.status]}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
            {INQUIRY_TYPE_LABEL[inquiry.inquiryType]}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{inquiry.createdAt?.slice(0, 10)}</span>
        </div>

        {/* Title */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{inquiry.title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[160px]">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
        </div>

        {/* Images */}
        {inquiry.imageUrls?.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">첨부 이미지</p>
            <div className="flex flex-wrap gap-3">
              {inquiry.imageUrls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`첨부 이미지 ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Reply */}
      {inquiry.status === 'ANSWERED' && inquiry.reply && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">A</span>
            <p className="text-sm font-semibold text-indigo-800">관리자 답변</p>
            {inquiry.repliedAt && (
              <span className="text-xs text-indigo-400 ml-auto">{inquiry.repliedAt.slice(0, 10)}</span>
            )}
          </div>
          <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">{inquiry.reply}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          href="/user/inquiries"
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          목록으로
        </Link>
        {inquiry.status === 'PENDING' && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? '삭제 중...' : '문의 삭제'}
          </button>
        )}
      </div>
    </div>
  );
}
