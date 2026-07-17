'use client';

/**
 * SqlResultAnswerInput — SQL "결과 테이블(컬럼×튜플)" 정답 입력용 그리드.
 *
 * 퀴즈 풀이 화면에서 문항에 sqlResultColumns(컬럼명 목록)가 있을 때 CodeAnswerInput 대신
 * 사용한다. 열은 컬럼명으로 고정 표시하고, 행은 "+ 행 추가"/삭제로 자유롭게 늘리고 줄인다.
 * 값은 기존 채점 API의 문자열 계약(`셀 | 셀` + 줄바꿈)으로 직렬화해 부모(value/onChange)에
 * 노출하므로, 페이지 쪽 제출 로직은 CodeAnswerInput과 동일하게 다룰 수 있다.
 *
 * 문항 전환 리마운트와 외부 value 변경 모두에서 저장된 답안을 복원한다.
 */

import { useEffect, useState } from 'react';
import { deserializeSqlAnswerGrid, serializeSqlAnswerGrid } from '@/lib/sql';

interface Props {
  columns: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function SqlResultAnswerInput({ columns, value, onChange, disabled = false }: Props) {
  const [rows, setRows] = useState<string[][]>(() => deserializeSqlAnswerGrid(value, columns.length));

  // 부모의 답안 복원·초기화가 들어오면 로컬 그리드만 갱신한다. onChange를 재호출하지 않아
  // controlled 업데이트 루프를 만들지 않고, 방금 commit한 동일 값은 그대로 유지한다.
  useEffect(() => {
    setRows((current) => {
      const hasCurrentShape = current.every((row) => row.length === columns.length);
      return hasCurrentShape && serializeSqlAnswerGrid(current) === value
        ? current
        : deserializeSqlAnswerGrid(value, columns.length);
    });
  }, [value, columns.length]);

  const commit = (next: string[][]) => {
    setRows(next);
    onChange(serializeSqlAnswerGrid(next));
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
