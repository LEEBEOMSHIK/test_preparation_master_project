'use client';

/**
 * 페이지 부재(페이지 교체) 풀이 도구 — 참조열·프레임 수로 표 골격만 생성하고,
 * 프레임 칸과 "부재(F)" 여부는 전부 사용자가 직접 손으로 채우는 보조 도구다.
 * FIFO/LRU/Optimal 등 알고리즘 자동 계산·채점은 하지 않는다(순수 입력 보조).
 * eval / new Function / dangerouslySetInnerHTML 어느 것도 사용하지 않는다.
 *
 * 데이터는 부모(ScratchPadPanel)가 소유하며(value/onChange), 저장은 패널의
 * 기존 debounce 저장 경로에 편입된다. 이 파일은 상태를 자체 보관하지 않는다.
 */

import { useMemo } from 'react';

/** 페이지 부재 도구 저장 데이터 — cells[frameRow][step] 2차원 배열 + 스텝별 부재 토글 */
export interface PageReplacementData {
  /** 참조열 원본 입력(공백/콤마 구분, 혼용 가능), 예: "7 0 1 2 0 3 0 4" */
  refString: string;
  /** 프레임 수(1~8로 제한) */
  frameCount: number;
  /** 프레임별 x 스텝별 손입력 셀 값 — cells[frameRow][step] */
  cells: string[][];
  /** 스텝별 "부재(page fault)" 토글 — 사용자가 직접 체크(자동 채점 아님, 집계만) */
  faults: boolean[];
}

/** 초기값(참조열 없음, 프레임 수 기본 3, 빈 그리드) */
export const EMPTY_PAGE_REPLACEMENT_DATA: PageReplacementData = {
  refString: '',
  frameCount: 3,
  cells: [],
  faults: [],
};

const MIN_FRAME_COUNT = 1;
const MAX_FRAME_COUNT = 8;

/** frameCount를 1~8 정수로 안전하게 정규화 — NaN/음수/소수 등 어떤 입력에도 throw 없음 */
function clampFrameCount(n: number): number {
  if (!Number.isFinite(n)) return MIN_FRAME_COUNT;
  return Math.min(MAX_FRAME_COUNT, Math.max(MIN_FRAME_COUNT, Math.round(n)));
}

/** 참조열 문자열을 공백/콤마(혼용 포함) 기준으로 토큰 배열로 분리. 빈 입력은 빈 배열 */
export function parseRefTokens(refString: string): string[] {
  return refString
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 저장된 cells/faults를 현재 스텝 수·프레임 수에 맞춰 안전하게 리사이즈한다.
 * 유효 인덱스의 기존 값은 최대한 보존하고, 범위를 벗어나면 잘라내거나 빈 값(''/false)으로 채운다.
 * 어떤 입력(차원이 어긋난 구버전 데이터 포함)에도 throw하지 않는다.
 */
function resizeGrid(
  cells: string[][],
  faults: boolean[],
  stepsCount: number,
  frameCount: number
): { cells: string[][]; faults: boolean[] } {
  const nextCells: string[][] = [];
  for (let r = 0; r < frameCount; r++) {
    const oldRow = cells[r] ?? [];
    const row: string[] = [];
    for (let c = 0; c < stepsCount; c++) {
      row.push(oldRow[c] ?? '');
    }
    nextCells.push(row);
  }
  const nextFaults: boolean[] = [];
  for (let c = 0; c < stepsCount; c++) {
    nextFaults.push(faults[c] ?? false);
  }
  return { cells: nextCells, faults: nextFaults };
}

/** localStorage 등에서 로드한 값이 PageReplacementData 형태인지 검증 — 하위호환 타입가드 */
export function isPageReplacementData(v: unknown): v is PageReplacementData {
  if (v === null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.refString === 'string' &&
    typeof o.frameCount === 'number' &&
    Array.isArray(o.cells) &&
    o.cells.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'string')) &&
    Array.isArray(o.faults) &&
    o.faults.every(f => typeof f === 'boolean')
  );
}

interface PageReplacementToolProps {
  value: PageReplacementData;
  onChange: (next: PageReplacementData) => void;
}

/**
 * 페이지 부재(페이지 교체) 풀이 도구 컴포넌트.
 * 참조열/프레임 수를 바꾸면 그리드 차원이 자동으로 리사이즈되며, 유효 인덱스의 기존 입력값은
 * 최대한 보존된다(초과분은 잘라내고, 부족분은 빈 값으로 확장). 프레임 셀 입력과 부재 토글은
 * 전부 사용자 손입력이며 정답을 계산해주지 않는다.
 */
export function PageReplacementTool({ value, onChange }: PageReplacementToolProps) {
  const steps = useMemo(() => parseRefTokens(value.refString), [value.refString]);
  const frameCount = clampFrameCount(value.frameCount);

  // 현재 스텝 수·프레임 수에 맞춘 정규화된 그리드(렌더용) — 저장값 차원이 어긋나 있어도 안전
  const normalized = useMemo(
    () => resizeGrid(value.cells, value.faults, steps.length, frameCount),
    [value.cells, value.faults, steps.length, frameCount]
  );

  const faultCount = normalized.faults.filter(Boolean).length;

  const handleRefStringChange = (nextRefString: string) => {
    const nextSteps = parseRefTokens(nextRefString);
    const resized = resizeGrid(value.cells, value.faults, nextSteps.length, frameCount);
    onChange({ refString: nextRefString, frameCount, cells: resized.cells, faults: resized.faults });
  };

  const handleFrameCountChange = (rawValue: number) => {
    const nextFrameCount = clampFrameCount(rawValue);
    const resized = resizeGrid(value.cells, value.faults, steps.length, nextFrameCount);
    onChange({ refString: value.refString, frameCount: nextFrameCount, cells: resized.cells, faults: resized.faults });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, nextText: string) => {
    const nextCells = normalized.cells.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? nextText : cell)) : row
    );
    onChange({ refString: value.refString, frameCount, cells: nextCells, faults: normalized.faults });
  };

  const handleFaultToggle = (colIdx: number) => {
    const nextFaults = normalized.faults.map((f, i) => (i === colIdx ? !f : f));
    onChange({ refString: value.refString, frameCount, cells: normalized.cells, faults: nextFaults });
  };

  // 그리드·부재 토글만 초기화 — 참조열/프레임 수는 유지(문제 설정을 다시 입력할 필요 없이 재도전 가능)
  const handleReset = () => {
    const cleared = resizeGrid([], [], steps.length, frameCount);
    onChange({ refString: value.refString, frameCount, cells: cleared.cells, faults: cleared.faults });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
        참조열과 프레임 수로 표 골격만 생성됩니다. FIFO/LRU/Optimal 등 정답은 자동 계산하지 않으니
        프레임 칸과 부재(F) 여부를 직접 입력·체크하세요.
      </p>

      {/* 입력: 참조열 + 프레임 수 */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[10rem] flex flex-col gap-1">
          <label className="text-xs text-gray-400 dark:text-gray-500">참조열 (공백/콤마 구분)</label>
          <input
            value={value.refString}
            onChange={e => handleRefStringChange(e.target.value)}
            placeholder="예: 7 0 1 2 0 3 0 4"
            spellCheck={false}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="w-24 flex flex-col gap-1">
          <label className="text-xs text-gray-400 dark:text-gray-500">프레임 수</label>
          <input
            type="number"
            min={MIN_FRAME_COUNT}
            max={MAX_FRAME_COUNT}
            value={frameCount}
            onChange={e => handleFrameCountChange(Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* 표 골격 — 열 = 참조열 각 스텝, 행 = 프레임 1..N + 부재(F) 토글 행 */}
      {steps.length === 0 ? (
        <p className="text-xs text-gray-300 dark:text-gray-600">참조열을 입력하면 표가 생성됩니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1 w-max">
            <thead>
              <tr>
                <th className="w-16 text-left text-[10px] font-normal text-gray-400 dark:text-gray-500 px-1">참조</th>
                {steps.map((step, c) => (
                  <th key={c} className="text-center text-[10px] font-normal text-gray-400 dark:text-gray-500 w-12">
                    <div className="flex flex-col items-center">
                      <span>{c}</span>
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{step}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalized.cells.map((row, r) => (
                <tr key={r}>
                  <td className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 px-1 whitespace-nowrap">
                    F{r + 1}
                  </td>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <input
                        value={cell}
                        onChange={e => handleCellChange(r, c, e.target.value)}
                        spellCheck={false}
                        className="w-12 text-center rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-xs font-mono px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="text-xs font-semibold text-red-500 dark:text-red-400 px-1 whitespace-nowrap">부재(F)</td>
                {normalized.faults.map((isFault, c) => (
                  <td key={c} className="text-center">
                    <button
                      type="button"
                      onClick={() => handleFaultToggle(c)}
                      aria-pressed={isFault}
                      aria-label={`${c}번째 스텝 부재 토글`}
                      className={[
                        'w-12 h-7 rounded border text-xs font-mono transition',
                        isFault
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600',
                      ].join(' ')}
                    >
                      {isFault ? 'F' : '—'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 집계(채점 아님 — 사용자가 토글한 부재 개수 실시간 집계) + 초기화 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          부재 횟수(직접 입력 집계): <span className="font-semibold text-red-500 dark:text-red-400">{faultCount}</span> / {steps.length}
        </p>
        {steps.length > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            그리드 초기화
          </button>
        )}
      </div>
    </div>
  );
}
