'use client';

/**
 * SqlProblemView — SQL 구조화 문항(SQL 유형) 표시용 뷰.
 *
 * 관리자 문항 상세(QuestionDetailModal)와 사용자 퀴즈 풀이 화면에서 공용으로 사용한다.
 * SQL 실행·자동 채점은 하지 않으며, 저장된 테이블 구조·샘플 데이터를 표 또는
 * DDL(CREATE TABLE) 형태로 보여주기만 한다. 우측 상단 세그먼트 버튼으로 모드 전환.
 */

import { useState } from 'react';
import type { SqlData, SqlTable } from '@/types';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface Props {
  data: SqlData;
  className?: string;
}

function buildDdl(tables: SqlTable[]): string {
  return tables
    .map((table) => {
      const columnLines = table.columns.map((col) => {
        const type = col.dataType?.trim() || 'VARCHAR(255)';
        return `  ${col.name} ${type}${col.primaryKey ? ' PRIMARY KEY' : ''}`;
      });
      return `CREATE TABLE ${table.name} (\n${columnLines.join(',\n')}\n);`;
    })
    .join('\n\n');
}

export function SqlProblemView({ data, className = '' }: Props) {
  const [mode, setMode] = useState<'table' | 'schema'>('table');

  return (
    <div className={className}>
      {/* 모드 전환 세그먼트 */}
      <div className="flex items-center justify-end mb-2">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('table')}
            className={[
              'px-2.5 py-1 transition',
              mode === 'table' ? 'bg-cyan-50 text-cyan-700' : 'bg-white text-gray-500 hover:bg-gray-50',
            ].join(' ')}
          >
            표
          </button>
          <button
            type="button"
            onClick={() => setMode('schema')}
            className={[
              'px-2.5 py-1 border-l border-gray-200 transition',
              mode === 'schema' ? 'bg-cyan-50 text-cyan-700' : 'bg-white text-gray-500 hover:bg-gray-50',
            ].join(' ')}
          >
            스키마
          </button>
        </div>
      </div>

      {mode === 'table' ? (
        <div className="space-y-3">
          {data.tables.map((table, tIdx) => (
            <div key={tIdx}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 font-mono mb-1.5">{table.name}</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {table.columns.map((col, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 text-left font-medium font-mono">
                          <span>{col.name}</span>
                          {col.primaryKey && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-100">
                              PK
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {table.rows && table.rows.length > 0 ? (
                      table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="text-gray-800 dark:text-gray-200">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 font-mono">{cell}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={table.columns.length} className="px-3 py-2 text-gray-400 dark:text-gray-500 text-center">
                          샘플 데이터 없음
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CodeBlock code={buildDdl(data.tables)} language="sql" size="xs" />
      )}

      {/* 결과 테이블 정답 — 관리자 응답에만 포함됨(퀴즈 노출 DTO는 정답 유출 방지를 위해 항상 제거) */}
      {data.expectedResult && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            결과 테이블 정답
            {data.expectedResult.orderedRows && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-100">
                순서 채점
              </span>
            )}
          </p>
          <div className="overflow-x-auto rounded-lg border border-cyan-200 dark:border-cyan-800">
            <table className="w-full text-sm min-w-[280px]">
              <thead>
                <tr className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                  {data.expectedResult.columns.map((col, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 text-left font-medium font-mono">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.expectedResult.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="text-gray-800 dark:text-gray-200">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 font-mono">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
