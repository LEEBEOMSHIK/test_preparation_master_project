'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { faqService } from '@/services/faqService';

export default function NewFaqPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!question.trim()) { setError('질문을 입력해 주세요.'); return; }
    if (!answer.trim()) { setError('답변을 입력해 주세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await faqService.adminCreate({
        question: question.trim(),
        answer: answer.trim(),
        displayOrder,
        isActive,
      });
      router.push('/admin/faq');
    } catch {
      setError('FAQ 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/faq" className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">FAQ 등록</h2>
          <p className="text-sm text-gray-500 mt-0.5">새로운 FAQ를 등록합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* 질문 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            질문 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="자주 묻는 질문을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 답변 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            답변 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="답변을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* 표시 순서 + 공개 여부 */}
        <div className="flex gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">표시 순서</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              min={0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">숫자가 작을수록 먼저 표시됩니다.</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">공개 여부</label>
            <button
              onClick={() => setIsActive((v) => !v)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isActive ? 'bg-indigo-600' : 'bg-gray-200',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isActive ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
            <span className="ml-2 text-sm text-gray-600">{isActive ? '공개' : '비공개'}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/faq"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? '등록 중...' : 'FAQ 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
