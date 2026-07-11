'use client';

/**
 * SqlResultAnswerInput — SQL "결과 테이블(컬럼×튜플)" 정답 입력용 그리드.
 *
 * 퀴즈 풀이 화면에서 문항에 sqlResultColumns(컬럼명 목록)가 있을 때 CodeAnswerInput 대신
 * 사용한다. 열은 컬럼명으로 고정 표시하고, 행은 "+ 행 추가"/삭제로 자유롭게 늘리고 줄인다.
 * 값은 기존 채점 API의 문자열 계약(`셀 | 셀` + 줄바꿈)으로 직렬화해 부모(value/onChange)에
 * 노출하므로, 페이지 쪽 제출 로직은 CodeAnswerInput과 동일하게 다룰 수 있다.
 *
 * 문항 전환 시 그리드를 초기화해야 하므로, 호출부에서 반드시 `key={question.id}`를 지정해
 * 문항이 바뀔 때 컴포넌트를 리마운트해야 한다(내부 상태는 마운트 시 1회만 초기화됨).
 */

import { useState } from 'react';

interface Props {
  columns: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

/** 컬럼 수에 맞는 빈 행 1개로 시작 (value는 부모가 관리하는 직렬화 문자열이지만,
 *  진실 원천은 이 컴포넌트의 로컬 grid 상태 — CodeAnswerInput과 동일한 uncontrolled 패턴) */
function initialGrid(columnCount: number): string[][] {
  return [Array(columnCount).fill('')];
}

/** 행렬 → "셀 | 셀\n셀 | 셀" 직렬화 문자열 */
function serializeGrid(rows: string[][]): string {
  return rows.map((row) => row.join(' | ')).join('\n');
}

export function SqlResultAnswerInput({ columns, value, onChange, disabled = false }: Props) {
  void value; // 직렬화 문자열은 onChange로만 내보내고, 그리드 자체 상태가 진실 원천(컴포넌트는 문항별로 리마운트됨)
  const [rows, setRows] = useState<string[][]>(() => initialGrid(columns.length));

  const commit = (next: string[][]) => {
    setRows(next);
    onChange(serializeGrid(next));
  };

  const updateCell = (rowIdx: number, colIdx: number, cell: string) => {
    commit(rows.map((row, ri) => (ri === rowIdx ? row.map((c, ci) => (ci === colIdx ? cell : c)) : row)));
  };
  const addRow = () => commit([...rows, Array(columns.length).fill('')]);
  const removeRow = (idx: number) => commit(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm min-w-[280px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium font-mono">{col}</th>
              ))}
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2 py-1.5">
                    <input
                      type="text"
                      value={cell}
                      disabled={disabled}
                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition disabled:bg-gray-50 dark:disabled:bg-gray-800"
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  {rows.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeRow(rIdx)}
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
      {!disabled && (
        <button
          type="button"
          onClick={addRow}
          className="text-xs text-cyan-600 hover:text-cyan-800 transition"
        >
          + 행 추가
        </button>
      )}
    </div>
  );
}
