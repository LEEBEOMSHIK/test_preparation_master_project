'use client';

/**
 * SqlProblemEditor — SQL 구조화 문항(SQL 유형) 등록/수정 폼 공용 에디터.
 *
 * 관리자 문항 등록(new)·수정(edit) 화면에서 공용으로 사용한다.
 * 테이블 카드 반복 — 테이블명 → 컬럼 편집 표(추가/삭제) → 샘플 데이터 행 표(추가/삭제) → 테이블 추가/삭제 순서로 구성된다.
 * (SchedulingProblemEditor 스타일 컨벤션을 그대로 따르되 accent는 cyan 계열)
 */

import { emptyColumnDraft, emptyTableDraft, type SqlColumnDraft, type SqlDataDraft, type SqlTableDraft } from '@/lib/sql';

interface Props {
  value: SqlDataDraft;
  onChange: (next: SqlDataDraft) => void;
}

export function SqlProblemEditor({ value, onChange }: Props) {
  const updateTable = (index: number, next: SqlTableDraft) => {
    const tables = value.tables.map((t, i) => (i === index ? next : t));
    onChange({ tables });
  };

  const addTable = () => onChange({ tables: [...value.tables, emptyTableDraft()] });

  const removeTable = (index: number) =>
    onChange({ tables: value.tables.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4">
      {value.tables.map((table, tIdx) => (
        <TableCard
          key={tIdx}
          table={table}
          index={tIdx}
          canRemove={value.tables.length > 1}
          onChange={(next) => updateTable(tIdx, next)}
          onRemove={() => removeTable(tIdx)}
        />
      ))}
      <button
        type="button"
        onClick={addTable}
        className="text-xs text-cyan-600 hover:text-cyan-800 transition"
      >
        + 테이블 추가
      </button>
    </div>
  );
}

function TableCard({
  table, index, canRemove, onChange, onRemove,
}: {
  table:     SqlTableDraft;
  index:     number;
  canRemove: boolean;
  onChange:  (next: SqlTableDraft) => void;
  onRemove:  () => void;
}) {
  const updateColumn = (colIdx: number, field: keyof SqlColumnDraft, val: string | boolean) => {
    const columns = table.columns.map((c, i) => (i === colIdx ? { ...c, [field]: val } : c));
    onChange({ ...table, columns });
  };

  const addColumn = () => {
    const columns = [...table.columns, emptyColumnDraft()];
    const rows = table.rows.map((row) => [...row, '']);
    onChange({ ...table, columns, rows });
  };

  const removeColumn = (colIdx: number) => {
    const columns = table.columns.filter((_, i) => i !== colIdx);
    const rows = table.rows.map((row) => row.filter((_, i) => i !== colIdx));
    onChange({ ...table, columns, rows });
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const rows = table.rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? val : cell)) : row,
    );
    onChange({ ...table, rows });
  };

  const addRow = () =>
    onChange({ ...table, rows: [...table.rows, Array(table.columns.length).fill('')] });

  const removeRow = (rowIdx: number) =>
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== rowIdx) });

  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-3 space-y-3">
      {/* 테이블명 + 테이블 삭제 */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            테이블 {index + 1} 이름 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={table.name}
            onChange={(e) => onChange({ ...table, name: e.target.value })}
            placeholder="예: employees"
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-5 text-gray-300 hover:text-red-400 transition shrink-0"
            aria-label={`테이블 ${index + 1} 삭제`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 컬럼 편집 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">컬럼</label>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium">컬럼명</th>
                <th className="px-2 py-1.5 text-left font-medium">데이터타입</th>
                <th className="px-2 py-1.5 text-center font-medium w-16">PK</th>
                <th className="px-2 py-1.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.columns.map((col, cIdx) => (
                <tr key={cIdx}>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => updateColumn(cIdx, 'name', e.target.value)}
                      placeholder={`col${cIdx + 1}`}
                      className="w-full px-2 py-1 rounded border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={col.dataType}
                      onChange={(e) => updateColumn(cIdx, 'dataType', e.target.value)}
                      placeholder="예: INT, VARCHAR(50)"
                      className="w-full px-2 py-1 rounded border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={col.primaryKey}
                      onChange={(e) => updateColumn(cIdx, 'primaryKey', e.target.checked)}
                      className="w-4 h-4 accent-cyan-600"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {table.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(cIdx)}
                        className="text-gray-300 hover:text-red-400 transition"
                        aria-label="컬럼 삭제"
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
          onClick={addColumn}
          className="mt-2 text-xs text-cyan-600 hover:text-cyan-800 transition"
        >
          + 컬럼 추가
        </button>
      </div>

      {/* 샘플 데이터 행 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          샘플 데이터 <span className="text-gray-300 font-normal">(선택)</span>
        </label>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                {table.columns.map((col, cIdx) => (
                  <th key={cIdx} className="px-2 py-1.5 text-left font-medium font-mono">
                    {col.name || `col${cIdx + 1}`}
                  </th>
                ))}
                <th className="px-2 py-1.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2 py-1.5">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    {table.rows.length > 1 && (
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
        <button
          type="button"
          onClick={addRow}
          className="mt-2 text-xs text-cyan-600 hover:text-cyan-800 transition"
        >
          + 행 추가
        </button>
      </div>
    </div>
  );
}
