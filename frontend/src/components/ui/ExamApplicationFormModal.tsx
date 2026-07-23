'use client';

import { useState } from 'react';
import { examApplicationService } from '@/services/examApplicationService';
import type { UserExamApplication } from '@/types';

export interface ExamApplicationPrefill {
  examInfoId: number;
  examName: string;
  examType?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (saved: UserExamApplication) => void;
  /** 기존 접수 정보를 수정하는 경우 전달 (있으면 수정 모드) */
  editing?: UserExamApplication | null;
  /** 시험 정보 카드에서 특정 시험에 연결해 신규 등록할 때 전달 */
  prefill?: ExamApplicationPrefill | null;
}

/**
 * 내 시험 접수 정보 등록/수정 모달.
 * - editing이 있으면 수정 모드(examInfoId는 기존 값 유지).
 * - prefill이 있으면 특정 시험 정보에 연결된 신규 등록(examInfoId 고정).
 * - 둘 다 없으면 자유 입력(examInfoId 없이 신규 등록).
 */
export function ExamApplicationFormModal({ open, onClose, onSaved, editing, prefill }: Props) {
  const examInfoId = editing?.examInfoId ?? prefill?.examInfoId;
  const examType = editing?.examType ?? prefill?.examType;

  const [examName, setExamName] = useState(editing?.examName ?? prefill?.examName ?? '');
  const [applicationDate, setApplicationDate] = useState(editing?.applicationDate ?? '');
  const [examDate, setExamDate] = useState(editing?.examDate ?? '');
  const [memo, setMemo] = useState(editing?.memo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const validate = (): string | null => {
    if (!examName.trim()) return '시험명을 입력해 주세요.';
    if (!applicationDate && !examDate) return '접수일 또는 시험일 중 하나는 입력해야 합니다.';

    const minYear = 2000;
    const maxYear = new Date().getFullYear() + 10;
    for (const dateStr of [applicationDate, examDate]) {
      if (!dateStr) continue;
      const year = Number(dateStr.slice(0, 4));
      if (!Number.isFinite(year) || year < minYear || year > maxYear) {
        return `날짜는 ${minYear}년부터 ${maxYear}년 사이여야 합니다.`;
      }
    }

    if (applicationDate && examDate && applicationDate > examDate) {
      return '접수일은 시험일보다 늦을 수 없습니다.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        examInfoId,
        examName: examName.trim(),
        applicationDate: applicationDate || undefined,
        examDate: examDate || undefined,
        memo: memo.trim() || undefined,
      };
      const res = editing
        ? await examApplicationService.update(editing.id, payload)
        : await examApplicationService.create(payload);
      if (res.data.data) {
        onSaved(res.data.data);
        onClose();
      }
    } catch (err: unknown) {
      let errorMsg = '저장에 실패했습니다. 다시 시도해 주세요.';
      if (
        err !== null &&
        typeof err === 'object' &&
        'response' in err &&
        err.response !== null &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data !== null &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof (err.response.data as { message: unknown }).message === 'string'
      ) {
        errorMsg = (err.response.data as { message: string }).message;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            {examType && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                {examType}
              </span>
            )}
            {editing ? '접수 정보 수정' : '접수 정보 등록'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">시험명</label>
          <input
            type="text"
            value={examName}
            onChange={e => setExamName(e.target.value)}
            placeholder="시험명을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <label className="text-xs font-medium text-gray-500">접수일</label>
            <input
              type="date"
              value={applicationDate}
              onChange={e => setApplicationDate(e.target.value)}
              className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <label className="text-xs font-medium text-gray-500">시험일</label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">메모 (선택)</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="준비물, 시험장 위치 등 메모"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-medium transition bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '저장 중...' : editing ? '수정' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
