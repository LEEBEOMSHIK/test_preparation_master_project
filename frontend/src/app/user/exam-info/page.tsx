'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { examInfoService } from '@/services/examInfoService';
import { EXAM_TYPES } from '@/types';
import type { ExamInfo } from '@/types';

const TYPE_COLOR: Record<string, string> = {
  'IT 자격증':  'bg-blue-100 text-blue-700',
  '공무원':     'bg-emerald-100 text-emerald-700',
  '어학':       'bg-yellow-100 text-yellow-700',
  '금융/회계':  'bg-amber-100 text-amber-700',
  '의료/보건':  'bg-red-100 text-red-700',
  '법무/행정':  'bg-purple-100 text-purple-700',
  '공기업':     'bg-indigo-100 text-indigo-700',
  '수능/입시':  'bg-pink-100 text-pink-700',
};

export default function UserExamInfoPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [items, setItems] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('전체');
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [pendingInterests, setPendingInterests] = useState<Set<string>>(new Set());
  const [savingInterests, setSavingInterests] = useState(false);

  const userInterests = user?.interestedExamTypes ?? [];

  useEffect(() => {
    examInfoService.getMyExamInfo()
      .then(res => setItems(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openInterestModal = () => {
    setPendingInterests(new Set(userInterests));
    setShowInterestModal(true);
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    try {
      const res = await examInfoService.updateInterests(Array.from(pendingInterests));
      const updatedUser = res.data.data;
      if (updatedUser && user) {
        const token = sessionStorage.getItem('accessToken') ?? '';
        setAuth({ ...user, ...updatedUser }, token);
      }
      setShowInterestModal(false);
      // Reload filtered items
      setLoading(true);
      const infoRes = await examInfoService.getMyExamInfo();
      setItems(infoRes.data.data ?? []);
    } catch {
      // silent
    } finally {
      setSavingInterests(false);
      setLoading(false);
    }
  };

  const allTypes = ['전체', ...Array.from(new Set(items.map(i => i.examType)))];
  const displayed = filterType === '전체' ? items : items.filter(i => i.examType === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">시험 정보</h2>
          {userInterests.length > 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              관심 시험:&nbsp;
              {userInterests.map(t => (
                <span key={t} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${TYPE_COLOR[t] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">전체 시험 정보를 표시합니다.</p>
          )}
        </div>
        <button
          type="button"
          onClick={openInterestModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          관심 설정
        </button>
      </div>

      {/* Type filter tabs */}
      {allTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-2">표시할 시험 정보가 없습니다.</p>
          {userInterests.length > 0 && (
            <button type="button" onClick={openInterestModal}
              className="text-indigo-500 text-sm hover:underline">
              관심 시험 유형을 변경해 보세요
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayed.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[item.examType] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.examType}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                </div>
                {item.officialUrl && (
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                  >
                    공식 홈페이지
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                )}
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{item.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {item.applicationPeriod && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">접수 기간</p>
                    <p className="text-sm text-gray-700">{item.applicationPeriod}</p>
                  </div>
                )}
                {item.examSchedule && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">시험 일정</p>
                    <p className="text-sm text-gray-700">{item.examSchedule}</p>
                  </div>
                )}
                {item.resultDate && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">합격 발표</p>
                    <p className="text-sm text-gray-700">{item.resultDate}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interest modal */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInterestModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">관심 시험 유형 설정</h3>
            <div className="grid grid-cols-2 gap-2">
              {EXAM_TYPES.map(type => {
                const sel = pendingInterests.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setPendingInterests(prev => {
                        const next = new Set(prev);
                        if (next.has(type)) next.delete(type); else next.add(type);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all ${
                      sel ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {sel && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600 shrink-0">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {type}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowInterestModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                취소
              </button>
              <button type="button" onClick={handleSaveInterests} disabled={savingInterests}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
                {savingInterests ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
