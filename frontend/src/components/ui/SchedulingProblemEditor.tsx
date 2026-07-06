'use client';

/**
 * SchedulingProblemEditor — CPU 스케줄링 구조화 문항(SCHEDULING 유형) 등록/수정 폼 공용 에디터.
 *
 * 관리자 문항 등록(new)·수정(edit) 화면에서 공용으로 사용한다.
 * 알고리즘 선택 → RR이면 타임 퀀텀 입력 → 프로세스 행 표(추가/삭제) 순서로 구성된다.
 */

import { SCHEDULING_ALGORITHMS, emptyProcessDraft, isPriorityAlgorithm, type SchedulingDataDraft } from '@/lib/scheduling';
import type { SchedulingAlgorithm } from '@/types';

interface Props {
  value: SchedulingDataDraft;
  onChange: (next: SchedulingDataDraft) => void;
}

export function SchedulingProblemEditor({ value, onChange }: Props) {
  const showPriority = isPriorityAlgorithm(value.algorithm);

  const updateProcess = (index: number, field: keyof SchedulingDataDraft['processes'][number], val: string) => {
    const next = value.processes.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    onChange({ ...value, processes: next });
  };

  const addProcess = () => onChange({ ...value, processes: [...value.processes, emptyProcessDraft()] });

  const removeProcess = (index: number) =>
    onChange({ ...value, processes: value.processes.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      {/* 알고리즘 선택 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">스케줄링 알고리즘</label>
          <select
            value={value.algorithm}
            onChange={(e) => onChange({ ...value, algorithm: e.target.value as SchedulingAlgorithm })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            {SCHEDULING_ALGORITHMS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        {value.algorithm === 'RR' && (
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              타임 퀀텀 <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={value.timeQuantum}
              onChange={(e) => onChange({ ...value, timeQuantum: e.target.value })}
              placeholder="예: 4"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        )}
      </div>

      {/* 프로세스 행 입력 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">프로세스 목록</label>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium w-24">PID</th>
                <th className="px-2 py-1.5 text-left font-medium">도착 시간</th>
                <th className="px-2 py-1.5 text-left font-medium">실행 시간</th>
                {showPriority && (
                  <th className="px-2 py-1.5 text-left font-medium">우선순위</th>
                )}
                <th className="px-2 py-1.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {value.processes.map((p, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={p.pid}
                      onChange={(e) => updateProcess(i, 'pid', e.target.value)}
                      placeholder={`P${i + 1}`}
                      className="w-full px-2 py-1 rounded border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      value={p.arrivalTime}
                      onChange={(e) => updateProcess(i, 'arrivalTime', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={1}
                      value={p.burstTime}
                      onChange={(e) => updateProcess(i, 'burstTime', e.target.value)}
                      placeholder="1"
                      className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                  </td>
                  {showPriority && (
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={p.priority}
                        onChange={(e) => updateProcess(i, 'priority', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-center">
                    {value.processes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProcess(i)}
                        className="text-gray-300 hover:text-red-400 transition"
                        aria-label="행 삭제"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addProcess}
          className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 transition"
        >
          + 행 추가
        </button>
      </div>
    </div>
  );
}
