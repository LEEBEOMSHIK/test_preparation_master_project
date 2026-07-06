'use client';

/**
 * 코드 트레이싱 탭 — 표기법 파서(@/lib/traceNotation)의 결과를 실시간으로 시각화하는
 * 읽기 전용 프리뷰. 클릭식 편집 UI는 없다(입력은 오직 상단 textarea 타이핑, 이 컴포넌트는
 * 순수 렌더만 담당). 코드 실행/eval 없음.
 */

import type { TraceLine, TypeSource } from '@/lib/traceNotation';

/**
 * 타입 배지 — explicit(`: type` 명시)은 채운 배경, inferred(값 기반 자동 추론)는
 * 점선 테두리 + 이탤릭으로 시각적으로 구분한다. title로 마우스오버 시 출처를 알려준다.
 */
function TypeBadge({ typeLabel, typeSource }: { typeLabel: string; typeSource: TypeSource }) {
  const isExplicit = typeSource === 'explicit';
  return (
    <span
      title={isExplicit ? '명시 타입' : '자동 추론'}
      className={
        isExplicit
          ? 'rounded px-1.5 py-0.5 text-[10px] font-semibold not-italic bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
          : 'rounded border border-dashed border-gray-300 dark:border-gray-600 px-1.5 py-0.5 text-[10px] italic text-gray-400 dark:text-gray-500'
      }
    >
      {typeLabel}
    </span>
  );
}

function VarRow({
  name,
  value,
  typeLabel,
  typeSource,
}: {
  name: string;
  value: string;
  typeLabel: string;
  typeSource: TypeSource;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-mono">
      <span className="font-semibold text-indigo-600 dark:text-indigo-300">{name}</span>
      <TypeBadge typeLabel={typeLabel} typeSource={typeSource} />
      <span className="text-gray-300 dark:text-gray-600">=</span>
      <span className="text-gray-800 dark:text-gray-100 break-all">{value}</span>
    </div>
  );
}

function Array1DRow({
  name,
  cells,
  typeLabel,
  typeSource,
}: {
  name: string;
  cells: string[];
  typeLabel: string;
  typeSource: TypeSource;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 font-mono">{name}</span>
        <TypeBadge typeLabel={typeLabel} typeSource={typeSource} />
      </div>
      {cells.length === 0 ? (
        <span className="text-xs text-gray-300 dark:text-gray-600">(빈 배열)</span>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-1 w-max">
            {cells.map((cell, idx) => (
              <div key={idx} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{idx}</span>
                <span className="min-w-[2.5rem] text-center rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-xs font-mono px-1.5 py-1">
                  {cell === '' ? ' ' : cell}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Array2DGrid({
  name,
  grid,
  typeLabel,
  typeSource,
}: {
  name: string;
  grid: string[][];
  typeLabel: string;
  typeSource: TypeSource;
}) {
  const maxCols = grid.reduce((max, row) => Math.max(max, row.length), 0);
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 font-mono">{name}</span>
        <TypeBadge typeLabel={typeLabel} typeSource={typeSource} />
      </div>
      {maxCols === 0 ? (
        <span className="text-xs text-gray-300 dark:text-gray-600">(빈 배열)</span>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="w-6" />
                {Array.from({ length: maxCols }).map((_, c) => (
                  <th key={c} className="text-[10px] font-normal text-gray-400 dark:text-gray-500 w-10">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, r) => (
                <tr key={r}>
                  <td className="text-[10px] text-gray-400 dark:text-gray-500 text-center pr-1">{r}</td>
                  {Array.from({ length: maxCols }).map((_, c) => (
                    <td key={c}>
                      <span className="flex items-center justify-center min-w-[2.5rem] rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-xs font-mono px-1.5 py-1">
                        {row[c] === undefined || row[c] === '' ? ' ' : row[c]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FreeTextRow({ text }: { text: string }) {
  return <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-pre-wrap px-0.5">{text}</p>;
}

interface TracePreviewProps {
  lines: TraceLine[];
}

/** trace 표기법 파싱 결과를 변수 행 · 1D 배열 · 2D 배열 · 자유 텍스트로 렌더하는 읽기 전용 프리뷰 */
export function TracePreview({ lines }: TracePreviewProps) {
  if (lines.length === 0) {
    return (
      <p className="text-xs text-gray-300 dark:text-gray-600">
        위 입력창에 <span className="font-mono">이름 = 값</span> 형식으로 입력하면 여기에 자동으로 시각화됩니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, idx) => {
        switch (line.kind) {
          case 'var':
            return (
              <VarRow
                key={idx}
                name={line.name}
                value={line.value}
                typeLabel={line.typeLabel}
                typeSource={line.typeSource}
              />
            );
          case 'array1d':
            return (
              <Array1DRow
                key={idx}
                name={line.name}
                cells={line.cells}
                typeLabel={line.typeLabel}
                typeSource={line.typeSource}
              />
            );
          case 'array2d':
            return (
              <Array2DGrid
                key={idx}
                name={line.name}
                grid={line.grid}
                typeLabel={line.typeLabel}
                typeSource={line.typeSource}
              />
            );
          case 'text':
            return <FreeTextRow key={idx} text={line.text} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
