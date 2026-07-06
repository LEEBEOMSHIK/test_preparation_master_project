/**
 * 코드 트레이싱 탭 "타이핑→자동 렌더" 표기법 파서.
 *
 * 사용자가 한 줄씩 `이름 = 값` 형태로 타이핑하면 ScratchPadPanel 하단 프리뷰가
 * 실시간으로 변수/1D 배열/2D 배열 시각화를 렌더한다. 이 파일은 순수 문자열 파싱만
 * 수행하며 eval / new Function / Function 생성자 / JSON.parse(신뢰 불가 입력 실행)를
 * 전혀 사용하지 않는다. 어떤 입력에도 throw하지 않고, 표기법에 맞지 않으면 자유
 * 텍스트(text)로 안전하게 폴백한다.
 *
 * 표기법:
 *   name = value            → 변수 한 줄(타입은 값에서 자동 추론)
 *   name: type = value      → 변수 한 줄 + 명시 타입 오버라이드(자유 문자열, 예: long, char, Node)
 *   name = [a, b, c]        → 1D 배열(인덱스 라벨)
 *   name = [[1,2],[3,4]]    → 2D 배열(행/열 인덱스 헤더)
 *   그 외 줄                 → 자유 텍스트(메모 겸용, 손실 없음)
 *   빈 줄                    → 무시
 *
 * `: type` 표기는 이름 바로 뒤의 콜론만 타입으로 인식한다(값 내부의 콜론은
 * `=` 이후 rhs로 통째로 보존되므로 `t = 12:30`, `url = http://x` 같은 값은
 * 타입으로 오인되지 않는다).
 */

/** 타입 라벨의 출처 — 사용자가 `: type`으로 명시했는지, 값에서 자동 추론했는지 */
export type TypeSource = 'explicit' | 'inferred';

export interface VarLine {
  kind: 'var';
  name: string;
  value: string;
  typeLabel: string;
  typeSource: TypeSource;
}

export interface Array1DLine {
  kind: 'array1d';
  name: string;
  cells: string[];
  typeLabel: string;
  typeSource: TypeSource;
}

export interface Array2DLine {
  kind: 'array2d';
  name: string;
  grid: string[][];
  typeLabel: string;
  typeSource: TypeSource;
}

export interface TextLine {
  kind: 'text';
  text: string;
}

/** 트레이스 한 줄의 파싱 결과 판별 유니온 */
export type TraceLine = VarLine | Array1DLine | Array2DLine | TextLine;

// 그룹: 1=이름, 2=명시 타입(선택, `name:` 바로 뒤만 매칭), 3=rhs(= 이후 전체, 값 내부 콜론은 안전)
const ASSIGN_PATTERN = /^([A-Za-z_]\w*)\s*(?::\s*([^=]+?))?\s*=\s*(.+)$/;

const INT_PATTERN = /^-?\d+$/;
const FLOAT_PATTERN = /^-?\d*\.\d+$/;

/** 값이 정수/실수 리터럴 패턴에 맞는지 여부(자동 타입 추론용) */
function isNumericLiteral(value: string): boolean {
  return INT_PATTERN.test(value) || FLOAT_PATTERN.test(value);
}

/** 스칼라 값 하나에서 타입 라벨을 추론 */
function inferScalarType(value: string): string {
  if (isNumericLiteral(value)) return 'number';
  if (value === 'true' || value === 'false') return 'boolean';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  return 'string';
}

/** 1D 배열 원소 전체에서 타입 라벨을 추론 */
function inferArray1DType(cells: string[]): string {
  if (cells.length === 0) return 'array';
  return cells.every(isNumericLiteral) ? 'number[]' : 'string[]';
}

/** 2D 배열의 모든 셀에서 타입 라벨을 추론 */
function inferArray2DType(grid: string[][]): string {
  const allCells = grid.flat();
  if (allCells.length === 0) return 'array';
  return allCells.every(isNumericLiteral) ? 'number[][]' : 'string[][]';
}

/**
 * s에서 인덱스 startIdx(반드시 '[')와 짝이 맞는 ']'의 인덱스를 반환한다.
 * 괄호 깊이가 음수가 되거나 끝까지 닫히지 않으면 null(불일치).
 */
function findMatchingBracketEnd(s: string, startIdx: number): number | null {
  let depth = 0;
  for (let i = startIdx; i < s.length; i++) {
    if (s[i] === '[') {
      depth++;
    } else if (s[i] === ']') {
      depth--;
      if (depth === 0) return i;
      if (depth < 0) return null;
    }
  }
  return null;
}

/** 최상위(depth 0) 콤마 기준으로 분리 — 중첩 대괄호 내부의 콤마는 분리하지 않는다 */
function splitTopLevel(inner: string): string[] {
  if (inner.trim().length === 0) return [];
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(inner.slice(start).trim());
  return parts;
}

/** `[...]`로 감싸인 값 하나를 최상위 원소 문자열 배열로 분리. 형태가 아니면 null */
function parseBracketGroup(raw: string): string[] | null {
  const s = raw.trim();
  if (s.length < 2 || s[0] !== '[') return null;
  const end = findMatchingBracketEnd(s, 0);
  if (end === null || end !== s.length - 1) return null; // 닫는 괄호가 문자열 끝이 아니면 불일치
  return splitTopLevel(s.slice(1, end));
}

type ArrayParseResult = { kind: 'array1d'; cells: string[] } | { kind: 'array2d'; grid: string[][] };

/** rhs(대괄호로 시작하는 값)를 1D/2D 배열로 판정. 파싱 실패 시 null(호출부에서 text로 폴백) */
function parseArrayValue(rhs: string): ArrayParseResult | null {
  const elements = parseBracketGroup(rhs);
  if (elements === null) return null;
  if (elements.length === 0) return { kind: 'array1d', cells: [] };

  const allNested = elements.every(el => el.startsWith('['));
  if (!allNested) {
    // 스칼라(또는 혼합) 배열 — 원소를 표시용 문자열 그대로 사용
    return { kind: 'array1d', cells: elements };
  }

  const grid: string[][] = [];
  for (const el of elements) {
    const row = parseBracketGroup(el);
    if (row === null) return null; // 중첩 표기가 깨짐 → 상위에서 text로 폴백
    grid.push(row);
  }
  return { kind: 'array2d', grid };
}

/** 한 줄을 TraceLine으로 파싱. 어떤 예외도 밖으로 던지지 않고 실패 시 text로 폴백 */
function parseSingleLine(rawLine: string): TraceLine {
  try {
    const line = rawLine.trim();
    const match = ASSIGN_PATTERN.exec(line);
    if (!match) return { kind: 'text', text: rawLine };

    const name = match[1];
    const explicitType = match[2]?.trim() || undefined;
    const rhs = match[3].trim();
    const typeSource: TypeSource = explicitType ? 'explicit' : 'inferred';

    if (rhs.startsWith('[')) {
      const parsed = parseArrayValue(rhs);
      if (parsed === null) return { kind: 'text', text: rawLine };
      if (parsed.kind === 'array1d') {
        return {
          kind: 'array1d',
          name,
          cells: parsed.cells,
          typeLabel: explicitType ?? inferArray1DType(parsed.cells),
          typeSource,
        };
      }
      return {
        kind: 'array2d',
        name,
        grid: parsed.grid,
        typeLabel: explicitType ?? inferArray2DType(parsed.grid),
        typeSource,
      };
    }

    return {
      kind: 'var',
      name,
      value: rhs,
      typeLabel: explicitType ?? inferScalarType(rhs),
      typeSource,
    };
  } catch {
    return { kind: 'text', text: rawLine };
  }
}

/** trace 텍스트를 줄 단위로 파싱한다. 빈 줄은 결과에서 제외. 코드 실행 없음, 항상 안전 폴백 */
export function parseTraceLines(text: string): TraceLine[] {
  return text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(parseSingleLine);
}

// ── 레거시 traceBlocks(HIST-20260706-001, 클릭식 블록 위젯) → 표기법 텍스트 마이그레이션 ──
// 클릭식 블록 에디터(TraceBlocks.tsx의 TraceBlockEditor)는 폐지되었으나, 이미 로컬에 저장된
// 사용자 데이터를 잃지 않도록 최초 로드 시 1회만 아래 함수로 표기법 텍스트로 변환해
// trace 뒤에 합친다. 이관 후 traceBlocks 필드 자체는 더 이상 저장하지 않는다.

interface LegacyVarsBlock {
  type: 'vars';
  rows: { name: string; value: string }[];
}
interface LegacyArray1DBlock {
  type: 'array1d';
  name: string;
  cells: string[];
}
interface LegacyArray2DBlock {
  type: 'array2d';
  name: string;
  grid: string[][];
}
interface LegacyIterBlock {
  type: 'iter';
  columns: string[];
  rows: string[][];
}
type LegacyTraceBlock = LegacyVarsBlock | LegacyArray1DBlock | LegacyArray2DBlock | LegacyIterBlock;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === 'string');
}

function isValidLegacyVarsRows(v: unknown): v is LegacyVarsBlock['rows'] {
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

/** localStorage 구버전 traceBlocks 원시 값을 안전 파싱. 배열이 아니거나 손상된 항목은 개별 drop */
export function sanitizeLegacyTraceBlocks(raw: unknown): LegacyTraceBlock[] {
  if (!Array.isArray(raw)) return [];
  const result: LegacyTraceBlock[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    switch (b.type) {
      case 'vars':
        if (isValidLegacyVarsRows(b.rows)) result.push({ type: 'vars', rows: b.rows });
        break;
      case 'array1d':
        if (typeof b.name === 'string' && isStringArray(b.cells)) {
          result.push({ type: 'array1d', name: b.name, cells: b.cells });
        }
        break;
      case 'array2d':
        if (typeof b.name === 'string' && Array.isArray(b.grid) && b.grid.every(row => isStringArray(row))) {
          result.push({ type: 'array2d', name: b.name, grid: b.grid as string[][] });
        }
        break;
      case 'iter':
        if (isStringArray(b.columns) && Array.isArray(b.rows) && b.rows.every(row => isStringArray(row))) {
          result.push({ type: 'iter', columns: b.columns, rows: b.rows as string[][] });
        }
        break;
      default:
        break;
    }
  }
  return result;
}

/** 레거시 블록 배열을 표기법 텍스트 줄들로 best-effort 직렬화(데이터 손실 없이 신방식으로 이관) */
export function legacyTraceBlocksToNotation(blocks: LegacyTraceBlock[]): string {
  const lines: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'vars':
        for (const row of block.rows) {
          if (row.name.trim().length === 0) continue;
          lines.push(`${row.name.trim()} = ${row.value}`);
        }
        break;
      case 'array1d': {
        const name = block.name.trim() || 'arr';
        lines.push(`${name} = [${block.cells.join(', ')}]`);
        break;
      }
      case 'array2d': {
        const name = block.name.trim() || 'grid';
        const rows = block.grid.map(row => `[${row.join(', ')}]`);
        lines.push(`${name} = [${rows.join(', ')}]`);
        break;
      }
      case 'iter': {
        // 표기법에 대응 개념이 없는 반복 스텝 표는 자유 텍스트 주석 줄로 보존(손실 없음)
        lines.push(`# 반복 스텝 표 (${block.columns.join(' | ')})`);
        for (const row of block.rows) {
          lines.push(`# ${row.join(' | ')}`);
        }
        break;
      }
      default:
        break;
    }
  }
  return lines.join('\n');
}
