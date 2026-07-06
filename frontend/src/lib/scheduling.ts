import type { SchedulingAlgorithm, SchedulingData, SchedulingProcessRow } from '@/types';

/**
 * CPU 스케줄링 문항(SCHEDULING 유형) 등록/수정 폼 공용 헬퍼.
 * 입력 중에는 숫자 필드도 문자열로 보관(Draft)하다가 제출 시 payload로 변환한다.
 * (options 배열 편집 패턴과 동일하게 행 추가/삭제를 지원)
 */

/** 입력 중인 프로세스 1행 — 숫자 필드도 문자열로 보관 */
export interface SchedulingProcessDraft {
  pid: string;
  arrivalTime: string;
  burstTime: string;
  priority: string;
}

/** 입력 중인 스케줄링 데이터 */
export interface SchedulingDataDraft {
  algorithm: SchedulingAlgorithm;
  timeQuantum: string;
  processes: SchedulingProcessDraft[];
}

export const SCHEDULING_ALGORITHMS: { value: SchedulingAlgorithm; label: string }[] = [
  { value: 'FCFS', label: 'FCFS (선입선처리)' },
  { value: 'SJF', label: 'SJF (최단작업 우선)' },
  { value: 'SRTF', label: 'SRTF (최단잔여시간 우선)' },
  { value: 'PRIORITY_NON_PREEMPTIVE', label: '우선순위 (비선점)' },
  { value: 'PRIORITY_PREEMPTIVE', label: '우선순위 (선점)' },
  { value: 'RR', label: 'RR (라운드로빈)' },
];

/** 우선순위 입력이 필요한 알고리즘인지 */
export function isPriorityAlgorithm(algorithm: SchedulingAlgorithm): boolean {
  return algorithm === 'PRIORITY_NON_PREEMPTIVE' || algorithm === 'PRIORITY_PREEMPTIVE';
}

/** 빈 프로세스 행 */
export function emptyProcessDraft(): SchedulingProcessDraft {
  return { pid: '', arrivalTime: '', burstTime: '', priority: '' };
}

/** 신규 등록 폼용 빈 스케줄링 드래프트 (프로세스 2행으로 시작) */
export function emptySchedulingDraft(): SchedulingDataDraft {
  return {
    algorithm: 'FCFS',
    timeQuantum: '',
    processes: [emptyProcessDraft(), emptyProcessDraft()],
  };
}

/**
 * Draft → 서버 전송용 SchedulingData 변환.
 * - pid가 빈 행은 제외
 * - 숫자 필드 변환 (arrivalTime/burstTime/priority)
 * - 유효한 프로세스가 하나도 없으면 undefined 반환(미전송)
 */
export function toSchedulingDataPayload(draft: SchedulingDataDraft): SchedulingData | undefined {
  const processes = draft.processes
    .filter((p) => p.pid.trim() !== '')
    .map((p) => ({
      pid: p.pid.trim(),
      arrivalTime: Number(p.arrivalTime) || 0,
      burstTime: Number(p.burstTime) || 0,
      priority: p.priority.trim() !== '' ? Number(p.priority) : undefined,
    }));

  if (processes.length === 0) return undefined;

  return {
    algorithm: draft.algorithm,
    timeQuantum: draft.algorithm === 'RR' && draft.timeQuantum.trim() !== ''
      ? Number(draft.timeQuantum)
      : undefined,
    processes,
  };
}

/** 서버에서 받은 SchedulingData → 폼 편집용 Draft 변환 (없으면 빈 드래프트) */
export function fromSchedulingData(data?: SchedulingData): SchedulingDataDraft {
  if (!data) return emptySchedulingDraft();
  return {
    algorithm: data.algorithm,
    timeQuantum: data.timeQuantum != null ? String(data.timeQuantum) : '',
    processes: data.processes.length > 0
      ? data.processes.map((p: SchedulingProcessRow) => ({
          pid: p.pid,
          arrivalTime: String(p.arrivalTime),
          burstTime: String(p.burstTime),
          priority: p.priority != null ? String(p.priority) : '',
        }))
      : [emptyProcessDraft(), emptyProcessDraft()],
  };
}
