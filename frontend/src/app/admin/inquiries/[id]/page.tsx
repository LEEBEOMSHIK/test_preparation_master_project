'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { inquiryService } from '@/services/inquiryService';
import type { Inquiry, InquiryStatus } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUS_COLOR: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ON_HOLD: 'bg-gray-100 text-gray-600',
  ANSWERED: 'bg-green-100 text-green-700',
};

export default function AdminInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [holding, setHolding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    inquiryService.adminGetOne(id)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setInquiry(data);
          setReplyText(data.reply ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReply = async () => {
    if (!replyText.trim() || !inquiry) return;
    setReplying(true);
    try {
      const res = await inquiryService.adminReply(inquiry.id, replyText.trim());
      if (res.data.success && res.data.data) {
        setInquiry(res.data.data);
        setReplyText(res.data.data.reply ?? '');
        alert(inquiry.status === 'ANSWERED' ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.');
      }
    } finally {
      setReplying(false);
    }
  };

  const handleToggleHold = async () => {
    if (!inquiry) return;
    setHolding(true);
    try {
      const res = await inquiryService.adminToggleHold(inquiry.id);
      if (res.data.success && res.data.data) {
        setInquiry(res.data.data);
      }
    } finally {
      setHolding(false);
    }
  };

  const handleDelete = async () => {
    if (!inquiry) return;
    if (!confirm('이 문의를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    setDeleting(true);
    try {
      await inquiryService.adminDelete(inquiry.id);
      router.push('/admin/inquiries');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-12 text-center text-sm text-gray-400">문의를 찾을 수 없습니다.</div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back + header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/inquiries"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          목록으로
        </Link>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {deleting ? '삭제 중...' : '문의 삭제'}
        </button>
      </div>

      {/* Inquiry info card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Title bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-900 leading-snug">{inquiry.title}</h2>
          <span className={['shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLOR[inquiry.status]].join(' ')}>
            {INQUIRY_STATUS_LABEL[inquiry.status]}
          </span>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>작성자: <span className="font-medium text-gray-700">{inquiry.userName}</span></span>
          <span>유형: <span className="font-medium text-gray-700">{INQUIRY_TYPE_LABEL[inquiry.inquiryType]}</span></span>
          <span>등록일: <span className="font-medium text-gray-700">{inquiry.createdAt?.slice(0, 10)}</span></span>
          {inquiry.repliedAt && (
            <span>답변일: <span className="font-medium text-gray-700">{inquiry.repliedAt.slice(0, 10)}</span></span>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
        </div>

        {/* Images */}
        {inquiry.imageUrls && inquiry.imageUrls.length > 0 && (
          <div className="px-6 pb-5">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">첨부 이미지</p>
            <div className="flex flex-wrap gap-2">
              {inquiry.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hold toggle (not shown when ANSWERED) */}
      {inquiry.status !== 'ANSWERED' && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleHold}
            disabled={holding}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50',
              inquiry.status === 'ON_HOLD'
                ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {holding ? '처리 중...' : inquiry.status === 'ON_HOLD' ? '대기로 변경' : '보류로 변경'}
          </button>
          <span className="text-xs text-gray-400">
            {inquiry.status === 'ON_HOLD' ? '보류 → 답변 대기 상태로 변경합니다.' : '답변 대기 → 보류 상태로 변경합니다.'}
          </span>
        </div>
      )}

      {/* Reply section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            {inquiry.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}
          </h3>
          {inquiry.status === 'ANSWERED' && (
            <p className="text-xs text-gray-400 mt-0.5">이미 등록된 답변입니다. 수정 후 저장하세요.</p>
          )}
        </div>
        <div className="px-6 py-5 space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={6}
            placeholder="답변을 입력하세요."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y bg-white"
          />
          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {replying ? '저장 중...' : inquiry.status === 'ANSWERED' ? '답변 수정' : '답변 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
