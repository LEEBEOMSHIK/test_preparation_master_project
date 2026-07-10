'use client';

/**
 * CPU 스케줄링 손입력 간트 차트 풀이 도구 — 프로세스 표 + 총 시간으로 간트 차트 타임 슬롯
 * 골격만 생성하고, 각 슬롯에 실행 중인 프로세스명과 완료/반환/대기시간은 전부 사용자가
 * 직접 손으로 채우는 보조 도구다. FIFO/SJF/RR/Priority 등 알고리즘 자동 계산·채점은
 * 하지 않는다(순수 입력 보조). 유일한 자동 계산은 결과 표 하단의 반환/대기시간
 * 평균(입력된 숫자만 대상 산술 평균)뿐이다. eval / new Function / dangerouslySetInnerHTML
 * 어느 것도 사용하지 않는다.
 *
 * 문항 등록/표시용 `SchedulingProblemEditor`·`SchedulingProblemTable`(관리자 SCHEDULING 유형
 * 구조화 문항)과는 목적이 다르다 — 이 컴포넌트는 풀이 스크래치패드(ScratchPadPanel) 전용
 * 손입력 풀이 보조 도구이며 문항 데이터와 무관하다.
 *
 * 데이터는 부모(ScratchPadPanel)가 소유하며(value/onChange), 저장은 패널의 기존 debounce
 * 저장 경로에 편입된다. 이 파일은 상태를 자체 보관하지 않는다.
 */

import { useMemo } from 'react';

/** 프로세스 입력 행 — 값은 전부 손입력 문자열로 보관(Draft 컨벤션) */
export interface SchedulingProcessDraft {
  name: string;
  arrival: string;
  burst: string;
  priority: string;
}

/** 결과 손입력 행 — 프로세스 행과 인덱스로 대응 */
export interface SchedulingResultDraft {
  completion: string;
  turnaround: string;
  waiting: string;
}

/** 손입력 간트 차트 스케줄링 풀이 도구 저장 데이터 */
export interface SchedulingSolveData {
  /** 프로세스 목록(이름/도착시간/실행시간/우선순위) */
  processes: SchedulingProcessDraft[];
  /** 간트 차트 총 시간(타임 슬롯 개수, 0~60) */
  totalTime: number;
  /** 타임 슬롯별 손입력 값(실행 중인 프로세스명 등) — 길이는 totalTime과 일치 */
  ganttCells: string[];
  /** 프로세스별 완료/반환/대기시간 손입력 — 길이는 processes와 일치 */
  results: SchedulingResultDraft[];
}

/** 초기값(프로세스 없음, 총 시간 0, 빈 그리드) */
export const EMPTY_SCHEDULING_SOLVE_DATA: SchedulingSolveData = {
  processes: [],
  totalTime: 0,
  ganttCells: [],
  results: [],
};

const MAX_PROCESS_ROWS = 10;
const MIN_TOTAL_TIME = 0;
const MAX_TOTAL_TIME = 60;

/** totalTime을 0~60 정수로 안전하게 정규화 — NaN/음수/소수 등 어떤 입력에도 throw 없음 */
function clampTotalTime(n: number): number {
  if (!Number.isFinite(n)) return MIN_TOTAL_TIME;
  return Math.min(MAX_TOTAL_TIME, Math.max(MIN_TOTAL_TIME, Math.round(n)));
}

/** 간트 셀 배열을 totalTime 길이에 맞춰 리사이즈 — 기존 값은 최대한 보존, 초과분은 잘라내고 부족분은 빈 값 */
function resizeGantt(cells: string[], totalTime: number): string[] {
  const next: string[] = [];
  for (let i = 0; i < totalTime; i++) {
    next.push(cells[i] ?? '');
  }
  return next;
}

/** 결과 행 배열을 프로세스 개수에 맞춰 리사이즈 — 기존 값은 최대한 보존, 초과분은 잘라내고 부족분은 빈 값 */
function resizeResults(results: SchedulingResultDraft[], count: number): SchedulingResultDraft[] {
  const next: SchedulingResultDraft[] = [];
  for (let i = 0; i < count; i++) {
    next.push(results[i] ?? { completion: '', turnaround: '', waiting: '' });
  }
  return next;
}

/** localStorage 등에서 로드한 값이 SchedulingSolveData 형태인지 검증 — 하위호환 타입가드 */
export function isSchedulingSolveData(v: unknown): v is SchedulingSolveData {
  if (v === null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;

  const isProcessArray =
    Array.isArray(o.processes) &&
    o.processes.every(p => {
      if (p === null || typeof p !== 'object') return false;
      const pr = p as Record<string, unknown>;
      return (
        typeof pr.name === 'string' &&
        typeof pr.arrival === 'string' &&
        typeof pr.burst === 'string' &&
        typeof pr.priority === 'string'
      );
    });

  const isResultArray =
    Array.isArray(o.results) &&
    o.results.every(r => {
      if (r === null || typeof r !== 'object') return false;
      const rr = r as Record<string, unknown>;
      return (
        typeof rr.completion === 'string' &&
        typeof rr.turnaround === 'string' &&
        typeof rr.waiting === 'string'
      );
    });

  return (
    isProcessArray &&
    typeof o.totalTime === 'number' &&
    Array.isArray(o.ganttCells) &&
    o.ganttCells.every(c => typeof c === 'string') &&
    isResultArray
  );
}

/** 간트 셀 배경 색상 팔레트 — 같은 프로세스명 입력을 같은 색 계열로 시각 구분(표시 보조, 자동 계산 아님) */
const GANTT_COLOR_PALETTE = [
  'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-700/50',
  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-700/50',
  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700/50',
  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-700/50',
  'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-700/50',
  'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-700/50',
  'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-500/20 dark:text-lime-300 dark:border-lime-700/50',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:border-fuchsia-700/50',
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-700/50',
  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-700/50',
];

/** 입력된 텍스트를 해시해 팔레트에서 색상 클래스를 결정 — 빈 문자열은 색상 없음(기본 회색 유지) */
function hashLabelToColorClass(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '';
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return GANTT_COLOR_PALETTE[hash % GANTT_COLOR_PALETTE.length];
}

/** 문자열 배열 중 숫자로 파싱되는 값만 골라 산술 평균(소수 둘째 자리)을 문자열로 반환. 값이 없으면 '-' */
function average(values: string[]): string {
  const nums = values
    .map(v => v.trim())
    .filter(v => v.length > 0)
    .map(Number)
    .filter(n => Number.isFinite(n));
  if (nums.length === 0) return '-';
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return avg.toFixed(2);
}

interface SchedulingSolveToolProps {
  value: SchedulingSolveData;
  onChange: (next: SchedulingSolveData) => void;
}

/**
 * 손입력 간트 차트 CPU 스케줄링 풀이 도구 컴포넌트.
 * 프로세스 행을 추가하고 총 시간을 입력하면 간트 차트 타임 슬롯 골격이 생성되며, 슬롯 값과
 * 결과(완료/반환/대기시간)는 전부 손입력이다. 정답을 계산해주지 않으며, 유일한 자동 계산인
 * 반환/대기시간 평균만 실시간으로 표시한다.
 */
export function SchedulingSolveTool({ value, onChange }: SchedulingSolveToolProps) {
  const totalTime = clampTotalTime(value.totalTime);
  const processes = useMemo(() => value.processes.slice(0, MAX_PROCESS_ROWS), [value.processes]);

  // 현재 총 시간·프로세스 수에 맞춘 정규화된 그리드/결과(렌더용) — 저장값 차원이 어긋나 있어도 안전
  const normalizedGantt = useMemo(() => resizeGantt(value.ganttCells, totalTime), [value.ganttCells, totalTime]);
  const normalizedResults = useMemo(
    () => resizeResults(value.results, processes.length),
    [value.results, processes.length]
  );

  const turnaroundAvg = useMemo(() => average(normalizedResults.map(r => r.turnaround)), [normalizedResults]);
  const waitingAvg = useMemo(() => average(normalizedResults.map(r => r.waiting)), [normalizedResults]);

  const addProcess = () => {
    if (processes.length >= MAX_PROCESS_ROWS) return;
    const nextProcesses = [...processes, { name: `P${processes.length + 1}`, arrival: '', burst: '', priority: '' }];
    onChange({
      processes: nextProcesses,
      totalTime,
      ganttCells: normalizedGantt,
      results: resizeResults(normalizedResults, nextProcesses.length),
    });
  };

  const removeProcess = (idx: number) => {
    const nextProcesses = processes.filter((_, i) => i !== idx);
    const nextResults = normalizedResults.filter((_, i) => i !== idx);
    onChange({ processes: nextProcesses, totalTime, ganttCells: normalizedGantt, results: nextResults });
  };

  const updateProcess = (idx: number, field: keyof SchedulingProcessDraft, val: string) => {
    const nextProcesses = processes.map((p, i) => (i === idx ? { ...p, [field]: val } : p));
    onChange({ processes: nextProcesses, totalTime, ganttCells: normalizedGantt, results: normalizedResults });
  };

  const handleTotalTimeChange = (raw: number) => {
    const nextTotal = clampTotalTime(raw);
    onChange({
      processes,
      totalTime: nextTotal,
      ganttCells: resizeGantt(normalizedGantt, nextTotal),
      results: normalizedResults,
    });
  };

  // 프로세스 실행시간 합으로 총 시간을 제안(자동 적용 아님 — 버튼으로 사용자가 직접 트리거)
  const suggestTotalTimeFromBurst = () => {
    const sum = processes.reduce((acc, p) => {
      const trimmed = p.burst.trim();
      if (trimmed.length === 0) return acc;
      const n = Number(trimmed);
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);
    handleTotalTimeChange(sum);
  };

  const handleGanttCellChange = (idx: number, val: string) => {
    const nextGantt = normalizedGantt.map((c, i) => (i === idx ? val : c));
    onChange({ processes, totalTime, ganttCells: nextGantt, results: normalizedResults });
  };

  const updateResult = (idx: number, field: keyof SchedulingResultDraft, val: string) => {
    const nextResults = normalizedResults.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    onChange({ processes, totalTime, ganttCells: normalizedGantt, results: nextResults });
  };

  // 간트 차트·결과 입력값만 초기화 — 프로세스 목록/총 시간은 유지(문제 설정 재입력 없이 재도전 가능)
  const handleReset = () => {
    onChange({
      processes,
      totalTime,
      ganttCells: resizeGantt([], totalTime),
      results: resizeResults([], processes.length),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
        프로세스 표와 총 시간으로 간트 차트·결과 표 골격만 생성됩니다. FIFO/SJF/RR/Priority 등
        정답은 자동 계산하지 않으니 슬롯과 결과를 직접 입력하세요. (평균만 자동 계산)
      </p>

      {/* 프로세스 입력 표 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400 dark:text-gray-500">프로세스 목록</label>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs min-w-[360px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium w-20">프로세스</th>
                <th className="px-2 py-1.5 text-left font-medium">도착시간</th>
                <th className="px-2 py-1.5 text-left font-medium">실행시간</th>
                <th className="px-2 py-1.5 text-left font-medium">우선순위</th>
                <th className="px-2 py-1.5 w-7" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {processes.map((p, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <input
                      value={p.name}
                      onChange={e => updateProcess(i, 'name', e.target.value)}
                      placeholder={`P${i + 1}`}
                      spellCheck={false}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={p.arrival}
                      onChange={e => updateProcess(i, 'arrival', e.target.value)}
                      placeholder="0"
                      spellCheck={false}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={p.burst}
                      onChange={e => updateProcess(i, 'burst', e.target.value)}
                      placeholder="1"
                      spellCheck={false}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={p.priority}
                      onChange={e => updateProcess(i, 'priority', e.target.value)}
                      placeholder="-"
                      spellCheck={false}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeProcess(i)}
                      aria-label="프로세스 행 삭제"
                      className="text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processes.length < MAX_PROCESS_ROWS ? (
          <button
            type="button"
            onClick={addProcess}
            className="self-start text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
          >
            + 프로세스 추가
          </button>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600">최대 {MAX_PROCESS_ROWS}개까지 추가할 수 있습니다.</p>
        )}
      </div>

      {/* 총 시간 입력 */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-24 flex flex-col gap-1">
          <label className="text-xs text-gray-400 dark:text-gray-500">총 시간</label>
          <input
            type="number"
            min={MIN_TOTAL_TIME}
            max={MAX_TOTAL_TIME}
            value={totalTime}
            onChange={e => handleTotalTimeChange(Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {processes.length > 0 && (
          <button
            type="button"
            onClick={suggestTotalTimeFromBurst}
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition pb-2"
          >
            실행시간 합으로 설정
          </button>
        )}
      </div>

      {/* 간트 차트 손입력 그리드 */}
      {totalTime === 0 ? (
        <p className="text-xs text-gray-300 dark:text-gray-600">총 시간을 입력하면 간트 차트가 생성됩니다.</p>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 dark:text-gray-500">간트 차트</label>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 w-max">
              <thead>
                <tr>
                  {normalizedGantt.map((_, c) => (
                    <th key={c} className="text-center text-[10px] font-normal text-gray-400 dark:text-gray-500 w-12">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {normalizedGantt.map((cell, c) => {
                    const colorClass = hashLabelToColorClass(cell);
                    return (
                      <td key={c}>
                        <input
                          value={cell}
                          onChange={e => handleGanttCellChange(c, e.target.value)}
                          spellCheck={false}
                          className={[
                            'w-12 text-center rounded border text-xs font-mono px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors',
                            colorClass ||
                              'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100',
                          ].join(' ')}
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 결과 손입력 표 — 완료/반환/대기시간은 손입력, 평균만 자동 계산 */}
      {processes.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 dark:text-gray-500">결과</label>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs min-w-[360px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                  <th className="px-2 py-1.5 text-left font-medium w-20">프로세스</th>
                  <th className="px-2 py-1.5 text-left font-medium">완료시간</th>
                  <th className="px-2 py-1.5 text-left font-medium">반환시간</th>
                  <th className="px-2 py-1.5 text-left font-medium">대기시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {normalizedResults.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
                      {processes[i]?.name.trim() || `P${i + 1}`}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={r.completion}
                        onChange={e => updateResult(i, 'completion', e.target.value)}
                        spellCheck={false}
                        className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={r.turnaround}
                        onChange={e => updateResult(i, 'turnaround', e.target.value)}
                        spellCheck={false}
                        className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={r.waiting}
                        onChange={e => updateResult(i, 'waiting', e.target.value)}
                        spellCheck={false}
                        className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">평균</td>
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5 text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">{turnaroundAvg}</td>
                  <td className="px-2 py-1.5 text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">{waitingAvg}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {(totalTime > 0 || processes.length > 0) && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            그리드 초기화
          </button>
        </div>
      )}
    </div>
  );
}
