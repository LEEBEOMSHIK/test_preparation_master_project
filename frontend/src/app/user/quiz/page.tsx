'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizService } from '@/services/quizService';
import { useAuthStore } from '@/store/authStore';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import type { DomainMaster, DomainSlave } from '@/types';

export default function QuizCategoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [masters, setMasters] = useState<DomainMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const interestedIds = user?.interestedExamSlaveIds ?? [];
  const examTypeIdsKey = interestedIds.join(',');

  useEffect(() => {
    setLoading(true);
    quizService.getCategories(interestedIds.length > 0 ? interestedIds : undefined)
      .then(res => {
        if (res.data.success && res.data.data) {
          setMasters(res.data.data);
        }
      }).finally(() => setLoading(false));
  }, [examTypeIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (slave: DomainSlave) => {
    router.push(`/user/quiz/${slave.id}?name=${encodeURIComponent(slave.name)}`);
  };

  // EXAM_TYPE 마스터만 프론트에서 관심 유형 필터링 (QUESTION_TYPE은 백엔드에서 이미 필터됨)
  const visibleMasters = masters.map(master => ({
    ...master,
    slaves: (interestedIds.length > 0 && master.code === 'EXAM_TYPE')
      ? master.slaves.filter(s => interestedIds.includes(s.id))
      : master.slaves,
  })).filter(master => master.slaves.length > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">데일리 퀴즈</h2>
          <p className="text-sm text-gray-500 mt-1">풀고 싶은 문제 유형을 선택하세요.</p>
        </div>
        <CardGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">데일리 퀴즈</h2>
        <p className="text-sm text-gray-500 mt-1">풀고 싶은 문제 유형을 선택하세요.</p>
      </div>

      {visibleMasters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
          {masters.length === 0 ? '등록된 카테고리가 없습니다.' : '관심 유형에 해당하는 퀴즈 카테고리가 없습니다.'}
        </div>
      ) : (
        visibleMasters.map(master => (
          <div key={master.id}>
            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              {master.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {master.slaves.map(slave => (
                <button
                  key={slave.id}
                  onClick={() => handleSelect(slave)}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-5 text-left hover:border-indigo-400 hover:shadow-md transition group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition">
                    {slave.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">랜덤 연속 출제</p>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
