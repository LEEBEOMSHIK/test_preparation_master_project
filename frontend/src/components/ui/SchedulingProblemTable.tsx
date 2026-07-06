'use client';

/**
 * SchedulingProblemTable — CPU 스케줄링 구조화 문항(SCHEDULING 유형) 표시용 표.
 *
 * 관리자 문항 상세(QuestionDetailModal)와 사용자 퀴즈 풀이 화면에서 공용으로 사용한다.
 * 자동 스케줄링 계산·채점은 하지 않으며, 저장된 프로세스 목록을 표로 보여주기만 한다.
 * 풀이 화면 라이트 테마 전용 — 다크모드 대응 불필요.
 */

import type { SchedulingAlgorithm, SchedulingData } from '@/types';
import { isPriorityAlgorithm } from '@/lib/scheduling';

export const ALGORITHM_LABEL: Record<SchedulingAlgorithm, string> = {
  FCFS: 'FCFS (선입선처리)',
  SJF: 'SJF (최단작업 우선)',
  SRTF: 'SRTF (최단잔여시간 우선)',
  PRIORITY_NON_PREEMPTIVE: '우선순위 (비선점)',
  PRIORITY_PREEMPTIVE: '우선순위 (선점)',
  RR: 'RR (라운드로빈)',
};

interface Props {
  data: SchedulingData;
  className?: string;
}

export function SchedulingProblemTable({ data, className = '' }: Props) {
  const showPriority = isPriorityAlgorithm(data.algorithm);

  return (
    <div className={className}>
      {/* 알고리즘 + 타임퀀텀 배지 */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
          {ALGORITHM_LABEL[data.algorithm]}
        </span>
        {data.algorithm === 'RR' && data.timeQuantum != null && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
            타임 퀀텀 {data.timeQuantum}
          </span>
        )}
      </div>

      {/* 프로세스 표 — 가로 스크롤 반응형 */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm min-w-[320px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-2 text-left font-medium">프로세스</th>
              <th className="px-3 py-2 text-left font-medium">도착 시간</th>
              <th className="px-3 py-2 text-left font-medium">실행 시간</th>
              {showPriority && (
                <th className="px-3 py-2 text-left font-medium">우선순위</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.processes.map((p, i) => (
              <tr key={`${p.pid}-${i}`} className="text-gray-800">
                <td className="px-3 py-2 font-mono font-medium">{p.pid}</td>
                <td className="px-3 py-2">{p.arrivalTime}</td>
                <td className="px-3 py-2">{p.burstTime}</td>
                {showPriority && (
                  <td className="px-3 py-2">{p.priority ?? '-'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
