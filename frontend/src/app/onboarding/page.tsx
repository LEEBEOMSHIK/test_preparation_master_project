'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { examInfoService } from '@/services/examInfoService';
import { EXAM_TYPES } from '@/types';

const TYPE_EMOJI: Record<string, string> = {
  'IT 자격증': '💻',
  '공무원': '🏛️',
  '어학': '🌍',
  '금융/회계': '📊',
  '의료/보건': '🏥',
  '법무/행정': '⚖️',
  '공기업': '🏢',
  '수능/입시': '📚',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggle = (type: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setError('관심 시험을 하나 이상 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await examInfoService.completeOnboarding(Array.from(selected));
      const updatedUser = res.data.data;
      if (updatedUser && user) {
        const token = sessionStorage.getItem('accessToken') ?? '';
        setAuth({ ...user, ...updatedUser }, token);
      }
      router.push('/user/exam-info');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/user/exam-info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-8 h-8 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">환영합니다, {user?.name ?? ''}님!</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            관심 있는 시험 유형을 선택하면<br />
            맞춤 시험 정보를 먼저 보여드립니다.
          </p>
        </div>

        {/* Exam type grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">관심 시험 유형 선택 (복수 선택 가능)</p>
          <div className="grid grid-cols-2 gap-3">
            {EXAM_TYPES.map((type) => {
              const isSelected = selected.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggle(type)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-400'
                      : 'border-gray-100 hover:border-gray-200 text-gray-700 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="text-2xl shrink-0">{TYPE_EMOJI[type] ?? '📋'}</span>
                  <span className="text-sm font-medium leading-tight">{type}</span>
                  {isSelected && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600 ml-auto shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <p className="text-xs text-indigo-600 text-center">
              {selected.size}개 선택됨
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selected.size === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '저장 중...' : '시작하기'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              나중에 설정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
