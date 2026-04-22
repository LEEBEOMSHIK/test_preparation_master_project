'use client';

import { useEffect, useState } from 'react';
import { faqService } from '@/services/faqService';
import type { Faq } from '@/types';

export default function UserFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    faqService.getFaqs()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setFaqs(res.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">자주 묻는 질문</h2>
        <p className="text-sm text-gray-500 mt-0.5">궁금한 점이 있으시면 아래 FAQ를 확인해 주세요.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : faqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-400">
          등록된 FAQ가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {faqs.map((faq) => (
            <div key={faq.id}>
              <button
                onClick={() => toggle(faq.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    Q
                  </span>
                  <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                </div>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={['w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform', openId === faq.id ? 'rotate-180' : ''].join(' ')}
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {openId === faq.id && (
                <div className="px-5 pb-5 bg-indigo-50 border-t border-indigo-100">
                  <div className="flex items-start gap-3 pt-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      A
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
