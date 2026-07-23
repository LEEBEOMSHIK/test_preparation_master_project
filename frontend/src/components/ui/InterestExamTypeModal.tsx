'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { examInfoService } from '@/services/examInfoService';
import type { ExamTypeOption } from '@/services/examInfoService';
import { ExamTypeGridSkeleton } from '@/components/ui/Skeleton';

interface InterestExamTypeModalProps {
  open: boolean;
  onClose: () => void;
  /** 저장 성공 후(모달이 닫히기 직전) 호출된다. 목록 재조회 등 호출부 후처리에 사용 */
  onSaved?: () => void;
}

/**
 * 관심 시험 유형 설정 모달.
 * `/user/exam-info`, `/user/settings` 두 화면에서 공용으로 사용한다.
 * 저장 시 examInfoService.updateInterests 호출 후 authStore.user를 즉시 갱신한다.
 */
export function InterestExamTypeModal({ open, onClose, onSaved }: InterestExamTypeModalProps) {
  const { user, setAuth } = useAuthStore();
  const [examTypes, setExamTypes] = useState<ExamTypeOption[]>([]);
  const [pendingInterests, setPendingInterests] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    examInfoService.getExamTypes()
      .then(res => setExamTypes(res.data.data ?? []))
      .catch(() => {});
    setPendingInterests(new Set(user?.interestedExamSlaveIds ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await examInfoService.updateInterests(Array.from(pendingInterests));
      const updatedUser = res.data.data;
      if (updatedUser && user) {
        const token = sessionStorage.getItem('accessToken') ?? '';
        setAuth({ ...user, ...updatedUser }, token);
      }
      onClose();
      onSaved?.();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">관심 시험 유형 설정</h3>
        {examTypes.length === 0 ? (
          <ExamTypeGridSkeleton count={6} itemHeight="h-10" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {examTypes.map(type => {
              const sel = pendingInterests.has(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setPendingInterests(prev => {
                      const next = new Set(prev);
                      if (next.has(type.id)) next.delete(type.id); else next.add(type.id);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all min-w-0 ${
                    sel ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {sel && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600 shrink-0">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="truncate" title={type.name}>{type.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
            취소
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
