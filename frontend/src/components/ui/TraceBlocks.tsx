'use client';

/**
 * 코드 트레이싱 탭의 "구조화 트레이스 블록" — 변수 워치 표 / 1D 배열 / 2D 배열 / 반복 스텝 표.
 *
 * 코드 실행·eval·Function 없음. 값은 전부 사용자가 직접 입력하는 순수 편집 위젯이다.
 * ScratchPadPanel의 ScratchPadData.traceBlocks에 저장되며, 이 파일은 타입 정의 +
 * localStorage 로드 시 안전 파싱(sanitizeTraceBlocks) + 렌더링(TraceBlockEditor)을 모두 담당한다.
 */

import type { ReactNode } from 'react';

// ── 타입 정의 (판별 유니온) ──────────────────────────────────────────────

export interface VarsBlock {
  id: string;
  type: 'vars';
  title?: string;
  rows: { name: string; value: string }[];
}

export interface Array1DBlock {
  id: string;
  type: 'array1d';
  title?: string;
  name: string;
  cells: string[];
  /** 현재 가리키는 인덱스(포인터 하이라이트). 없으면 null */
  cursor: number | null;
}

export interface Array2DBlock {
  id: string;
  type: 'array2d';
  title?: string;
  name: string;
  grid: string[][];
}

export interface IterBlock {
  id: string;
  type: 'iter';
  title?: string;
  columns: string[];
  rows: string[][];
}

export type TraceBlock = VarsBlock | Array1DBlock | Array2DBlock | IterBlock;

const BLOCK_TYPE_LABELS: Record<TraceBlock['type'], string> = {
  vars: '변수 워치',
  array1d: '1D 배열',
  array2d: '2D 배열',
  iter: '반복 스텝',
};

// ── id 생성 (SSR/구형 브라우저 안전 폴백) ────────────────────────────────

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── 블록 생성 팩토리 ─────────────────────────────────────────────────────

export function createVarsBlock(): VarsBlock {
  return { id: genId(), type: 'vars', rows: [{ name: '', value: '' }] };
}

export function createArray1DBlock(): Array1DBlock {
  return { id: genId(), type: 'array1d', name: '', cells: ['', '', ''], cursor: null };
}

export function createArray2DBlock(): Array2DBlock {
  return {
    id: genId(),
    type: 'array2d',
    name: '',
    grid: [
      ['', ''],
      ['', ''],
    ],
  };
}

export function createIterBlock(): IterBlock {
  return { id: genId(), type: 'iter', columns: ['i', 'value'], rows: [] };
}

// ── localStorage 로드 시 안전 파싱 ──────────────────────────────────────
// 손상되었거나 구버전(traceBlocks 키 없음) 데이터를 만나도 절대 throw하지 않고
// 유효한 블록만 골라 담는다. 전체를 버리지 않고 항목 단위로 걸러낸다.

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === 'string');
}

function isValidVarsRows(v: unknown): v is VarsBlock['rows'] {
  return (
    Array.isArray(v) &&
    v.every(
      r =>
        r !== null &&
        typeof r === 'object' &&
        typeof (r as Record<string, unknown>).name === 'string' &&
        typeof (r as Record<string, unknown>).value === 'string'
    )
  );
}

function parseTitle(b: Record<string, unknown>): string | undefined {
  return typeof b.title === 'string' ? b.title : undefined;
}

/** localStorage에서 읽은 원시 값을 TraceBlock[]으로 안전 변환. 구버전 데이터(필드 없음)는 빈 배열 처리 */
export function sanitizeTraceBlocks(raw: unknown): TraceBlock[] {
  if (!Array.isArray(raw)) return [];

  const result: TraceBlock[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    if (typeof b.id !== 'string' || typeof b.type !== 'string') continue;
    const title = parseTitle(b);

    switch (b.type) {
      case 'vars':
        if (isValidVarsRows(b.rows)) {
          result.push({ id: b.id, type: 'vars', title, rows: b.rows });
        }
        break;
      case 'array1d':
        if (typeof b.name === 'string' && isStringArray(b.cells) && (b.cursor === null || typeof b.cursor === 'number')) {
          result.push({ id: b.id, type: 'array1d', title, name: b.name, cells: b.cells, cursor: (b.cursor as number | null) ?? null });
        }
        break;
      case 'array2d':
        if (typeof b.name === 'string' && Array.isArray(b.grid) && b.grid.every(row => isStringArray(row))) {
          result.push({ id: b.id, type: 'array2d', title, name: b.name, grid: b.grid as string[][] });
        }
        break;
      case 'iter':
        if (isStringArray(b.columns) && Array.isArray(b.rows) && b.rows.every(row => isStringArray(row))) {
          result.push({ id: b.id, type: 'iter', title, columns: b.columns, rows: b.rows as string[][] });
        }
        break;
      default:
        break;
    }
  }
  return result;
}

// ── 공용 스타일 ──────────────────────────────────────────────────────────

const cellInputClass =
  'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 min-w-0';
const smallBtnClass =
  'shrink-0 h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-[11px] leading-none';
const deleteBtnClass =
  'shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm leading-none';
const addBtnClass = 'text-xs text-indigo-600 dark:text-indigo-400 hover:underline self-start';
const iconBtnClass =
  'w-5 h-5 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs leading-none';

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-md text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 transition"
    >
      {label}
    </button>
  );
}

function BlockContainer({
  title,
  typeLabel,
  onTitleChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: {
  title?: string;
  typeLabel: string;
  onTitleChange: (title: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {typeLabel}
        </span>
        <input
          value={title ?? ''}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="라벨(선택)"
          className="flex-1 min-w-0 text-xs bg-transparent border-none focus:outline-none text-gray-600 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        <div className="flex gap-0.5 shrink-0">
          {onMoveUp && (
            <button onClick={onMoveUp} aria-label="위로 이동" className={iconBtnClass}>
              ↑
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} aria-label="아래로 이동" className={iconBtnClass}>
              ↓
            </button>
          )}
          <button onClick={onDelete} aria-label="블록 삭제" className={`${iconBtnClass} text-red-400 hover:text-red-600`}>
            ×
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── 블록별 본문 ──────────────────────────────────────────────────────────

function VarsBlockBody({ block, onChange }: { block: VarsBlock; onChange: (next: VarsBlock) => void }) {
  const updateRow = (idx: number, field: 'name' | 'value', value: string) => {
    onChange({ ...block, rows: block.rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)) });
  };
  const addRow = () => onChange({ ...block, rows: [...block.rows, { name: '', value: '' }] });
  const removeRow = (idx: number) => onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-1">
        {block.rows.map((row, idx) => (
          <div key={idx} className="flex gap-1.5 items-center">
            <input
              value={row.name}
              onChange={e => updateRow(idx, 'name', e.target.value)}
              placeholder="이름"
              className={`${cellInputClass} flex-1`}
            />
            <span className="text-gray-300 dark:text-gray-600 text-xs shrink-0">=</span>
            <input
              value={row.value}
              onChange={e => updateRow(idx, 'value', e.target.value)}
              placeholder="값"
              className={`${cellInputClass} flex-1`}
            />
            <button onClick={() => removeRow(idx)} aria-label="행 삭제" className={deleteBtnClass}>
              ×
            </button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className={addBtnClass}>
        + 행 추가
      </button>
    </div>
  );
}

function Array1DBlockBody({ block, onChange }: { block: Array1DBlock; onChange: (next: Array1DBlock) => void }) {
  const updateCell = (idx: number, value: string) => {
    onChange({ ...block, cells: block.cells.map((c, i) => (i === idx ? value : c)) });
  };
  const addCell = () => onChange({ ...block, cells: [...block.cells, ''] });
  const removeCell = () => {
    if (block.cells.length <= 1) return;
    const cells = block.cells.slice(0, -1);
    const cursor = block.cursor !== null && block.cursor >= cells.length ? null : block.cursor;
    onChange({ ...block, cells, cursor });
  };
  const toggleCursor = (idx: number) => onChange({ ...block, cursor: block.cursor === idx ? null : idx });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          value={block.name}
          onChange={e => onChange({ ...block, name: e.target.value })}
          placeholder="배열 이름(선택)"
          className={`${cellInputClass} w-28`}
        />
        <div className="flex gap-1 ml-auto items-center">
          <button onClick={removeCell} aria-label="칸 삭제" className={smallBtnClass}>
            -
          </button>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{block.cells.length}칸</span>
          <button onClick={addCell} aria-label="칸 추가" className={smallBtnClass}>
            +
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1 w-max">
          {block.cells.map((cell, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => toggleCursor(idx)}
                aria-label={`인덱스 ${idx} 포인터 지정`}
                className={[
                  'text-[10px] w-10 text-center rounded px-0.5',
                  block.cursor === idx
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {idx}
              </button>
              <input
                value={cell}
                onChange={e => updateCell(idx, e.target.value)}
                className={[
                  cellInputClass,
                  'w-10 text-center px-1',
                  block.cursor === idx ? 'ring-2 ring-indigo-400 border-indigo-300 dark:border-indigo-500' : '',
                ].join(' ')}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Array2DBlockBody({ block, onChange }: { block: Array2DBlock; onChange: (next: Array2DBlock) => void }) {
  const rows = block.grid.length;
  const cols = block.grid[0]?.length ?? 0;

  const updateCell = (r: number, c: number, value: string) => {
    onChange({ ...block, grid: block.grid.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)) });
  };
  const addRow = () => onChange({ ...block, grid: [...block.grid, Array(cols).fill('')] });
  const removeRow = () => {
    if (rows <= 1) return;
    onChange({ ...block, grid: block.grid.slice(0, -1) });
  };
  const addCol = () => onChange({ ...block, grid: block.grid.map(row => [...row, '']) });
  const removeCol = () => {
    if (cols <= 1) return;
    onChange({ ...block, grid: block.grid.map(row => row.slice(0, -1)) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          value={block.name}
          onChange={e => onChange({ ...block, name: e.target.value })}
          placeholder="배열 이름(선택)"
          className={`${cellInputClass} w-28`}
        />
        <div className="flex gap-1 ml-auto items-center text-[10px] text-gray-400 dark:text-gray-500">
          <span>행</span>
          <button onClick={removeRow} aria-label="행 삭제" className={smallBtnClass}>
            -
          </button>
          <button onClick={addRow} aria-label="행 추가" className={smallBtnClass}>
            +
          </button>
          <span className="ml-1">열</span>
          <button onClick={removeCol} aria-label="열 삭제" className={smallBtnClass}>
            -
          </button>
          <button onClick={addCol} aria-label="열 추가" className={smallBtnClass}>
            +
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="w-6" />
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="text-[10px] font-normal text-gray-400 dark:text-gray-500 w-10">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.grid.map((row, r) => (
              <tr key={r}>
                <td className="text-[10px] text-gray-400 dark:text-gray-500 text-center pr-1">{r}</td>
                {row.map((cell, c) => (
                  <td key={c}>
                    <input
                      value={cell}
                      onChange={e => updateCell(r, c, e.target.value)}
                      className={`${cellInputClass} w-10 text-center px-1`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IterBlockBody({ block, onChange }: { block: IterBlock; onChange: (next: IterBlock) => void }) {
  const updateColumnName = (idx: number, name: string) => {
    onChange({ ...block, columns: block.columns.map((c, i) => (i === idx ? name : c)) });
  };
  const addColumn = () => {
    onChange({
      ...block,
      columns: [...block.columns, `col${block.columns.length + 1}`],
      rows: block.rows.map(r => [...r, '']),
    });
  };
  const removeColumn = (idx: number) => {
    if (block.columns.length <= 1) return;
    onChange({
      ...block,
      columns: block.columns.filter((_, i) => i !== idx),
      rows: block.rows.map(r => r.filter((_, i) => i !== idx)),
    });
  };
  const updateCell = (r: number, c: number, value: string) => {
    onChange({ ...block, rows: block.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)) });
  };
  const nextStep = () => {
    const last = block.rows[block.rows.length - 1];
    const newRow = last ? [...last] : block.columns.map(() => '');
    onChange({ ...block, rows: [...block.rows, newRow] });
  };
  const removeRow = (idx: number) => onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) });

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 w-max">
          <thead>
            <tr>
              {block.columns.map((col, idx) => (
                <th key={idx} className="text-left">
                  <div className="flex items-center gap-0.5">
                    <input
                      value={col}
                      onChange={e => updateColumnName(idx, e.target.value)}
                      className={`${cellInputClass} w-16 text-[11px] font-semibold px-1`}
                    />
                    {block.columns.length > 1 && (
                      <button onClick={() => removeColumn(idx)} aria-label="열 삭제" className={deleteBtnClass}>
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th>
                <button onClick={addColumn} aria-label="열 추가" className={smallBtnClass}>
                  +열
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.length === 0 ? (
              <tr>
                <td colSpan={block.columns.length + 1} className="text-[11px] text-gray-300 dark:text-gray-600 py-1">
                  &quot;다음 스텝&quot;으로 첫 반복을 기록하세요.
                </td>
              </tr>
            ) : (
              block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <input
                        value={cell}
                        onChange={e => updateCell(r, c, e.target.value)}
                        className={`${cellInputClass} w-16 px-1`}
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => removeRow(r)} aria-label="행 삭제" className={deleteBtnClass}>
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button onClick={nextStep} className={addBtnClass}>
        + 다음 스텝
      </button>
    </div>
  );
}

// ── 최상위 에디터 ────────────────────────────────────────────────────────

interface TraceBlockEditorProps {
  blocks: TraceBlock[];
  onChange: (next: TraceBlock[]) => void;
}

/** 코드 트레이싱 탭 하단에 배치되는 구조화 블록 툴바 + 목록 */
export function TraceBlockEditor({ blocks, onChange }: TraceBlockEditorProps) {
  const addBlock = (block: TraceBlock) => onChange([...blocks, block]);
  const removeBlock = (id: string) => onChange(blocks.filter(b => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const next = [...blocks];
    const tmp = next[idx];
    next[idx] = next[newIdx];
    next[newIdx] = tmp;
    onChange(next);
  };
  const updateBlock = (id: string, next: TraceBlock) => onChange(blocks.map(b => (b.id === id ? next : b)));
  const updateTitle = (id: string, title: string) => onChange(blocks.map(b => (b.id === id ? { ...b, title } : b)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <ToolbarButton label="+ 변수 표" onClick={() => addBlock(createVarsBlock())} />
        <ToolbarButton label="+ 1D 배열" onClick={() => addBlock(createArray1DBlock())} />
        <ToolbarButton label="+ 2D 배열" onClick={() => addBlock(createArray2DBlock())} />
        <ToolbarButton label="+ 반복 스텝 표" onClick={() => addBlock(createIterBlock())} />
      </div>

      {blocks.length === 0 ? (
        <p className="text-xs text-gray-300 dark:text-gray-600">추가된 트레이스 블록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {blocks.map((block, idx) => (
            <BlockContainer
              key={block.id}
              title={block.title}
              typeLabel={BLOCK_TYPE_LABELS[block.type]}
              onTitleChange={t => updateTitle(block.id, t)}
              onMoveUp={idx > 0 ? () => moveBlock(block.id, -1) : undefined}
              onMoveDown={idx < blocks.length - 1 ? () => moveBlock(block.id, 1) : undefined}
              onDelete={() => removeBlock(block.id)}
            >
              {block.type === 'vars' && <VarsBlockBody block={block} onChange={next => updateBlock(block.id, next)} />}
              {block.type === 'array1d' && <Array1DBlockBody block={block} onChange={next => updateBlock(block.id, next)} />}
              {block.type === 'array2d' && <Array2DBlockBody block={block} onChange={next => updateBlock(block.id, next)} />}
              {block.type === 'iter' && <IterBlockBody block={block} onChange={next => updateBlock(block.id, next)} />}
            </BlockContainer>
          ))}
        </div>
      )}
    </div>
  );
}
