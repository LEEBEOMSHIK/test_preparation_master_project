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
 *   name = [[1,2],[3,4]]    → 2D 배열(행/열 인덱스 헤더, 중첩 표기)
 *   name = [1,2,3][4,5,6]   → 2D 배열(행/열 인덱스 헤더, 나란히 표기 — 대괄호 그룹 2개 이상 연속)
 *   name = {k: v, ...}      → 오브젝트(키-값 표, 값은 재귀 파싱 없이 문자열 그대로)
 *   그 외 줄                 → 자유 텍스트(메모 겸용, 손실 없음)
 *   빈 줄                    → 무시
 *
 * `: type` 표기는 이름 바로 뒤의 콜론만 타입으로 인식한다(값 내부의 콜론은
 * `=` 이후 rhs로 통째로 보존되므로 `t = 12:30`, `url = http://x` 같은 값은
 * 타입으로 오인되지 않는다).
 *
 * 변수 참조 수식 자동 계산 (2단계 확장):
 *   스칼라 var 라인의 rhs가 리터럴이 아니고 숫자/식별자/산술·비트연산자(`+ - * / % ** & | ^ ~ << >> >>>`)/괄호/공백
 *   만으로 구성되면 `@/lib/safeMathCalc`의 기존 안전 계산기(`evaluateExpression`)로 계산을
 *   시도한다(eval/new Function 없음 — 계산은 전적으로 화이트리스트 재귀하강 파서에 위임).
 *
 *   [확장1] 식별자 없는 순수 리터럴 수식도 계산한다(`av = 10 / 4` → 2.5, `x = 3 * (2 + 1)` → 9).
 *   단, 날짜·버전·전화번호가 뺄셈으로 오계산되지 않도록 rhs가 공백 없이 숫자와 `-`/`.`만으로
 *   압축 나열된 형태(`^\d+([-.]\d+)+$`, 예: `2024-01-01`, `010-1234-5678`, `1.2.3`)이면 계산하지
 *   않고 문자열로 폴백한다. 공백이 섞인 뺄셈(`10 - 3` → 7)이나 `/`를 쓴 나눗셈(`16/9`)은 이
 *   가드에 걸리지 않고 정상 계산된다.
 *
 *   [확장2] 변수 정의가 참조보다 아래 줄에 있어도(순서 무관) 계산되도록, 전체 줄을 여러 패스로
 *   반복 해석하는 픽스포인트 방식을 쓴다. 1차로 모든 `이름 = <숫자 리터럴>` 정의를 환경에 먼저
 *   채우고(같은 이름이 여러 번이면 텍스트상 마지막 정의가 최종값), 이후 패스마다 참조 식별자가
 *   전부 환경에 있는 미해결 수식 라인을 계산해 환경에 추가하는 것을 더 해결되는 라인이 없을
 *   때까지 반복한다(반복 횟수는 라인 수로 상한). 자기참조/순환·미정의 참조는 끝내 미해결로
 *   남아 문자열 var로 폴백한다.
 *
 *   [확장3] `이름 =` 대입이 아예 없이 수식만 적은 줄(예: `av / len`)도 계산한다. 조건: (a) rhs와
 *   동일한 화이트리스트(숫자/식별자/산술·비트연산자/괄호/공백)만으로 구성되고, (b) 연산자를
 *   최소 1개 포함해야 한다(단어 하나·단일 식별자·자유 문장이 수식으로 오인되지 않도록 하는
 *   핵심 가드). 두 조건을 만족하면 named 변수 픽스포인트가 모두 끝난 뒤 최종 env로 한 번만
 *   평가한다(참조 식별자가 하나라도 최종 env에 없으면 계산하지 않음). 계산에 성공하면
 *   이름 없는 `ExprLine`으로 렌더되고, 이름이 없으므로 env에는 등록되지 않는다(다른 줄에
 *   영향을 주지 않음). 실패하면 원본 줄을 그대로 자유 텍스트로 폴백한다.
 *
 *   두 경우 모두 치환 대상 식별자가 하나라도 환경에 없거나(미정의) 계산기가 오류를 반환하면
 *   계산을 시도하지 않고 기존처럼 문자열 var로 폴백한다. 계산 성공 시 결과값은 이후 패스의
 *   다른 수식에서 재참조할 수 있도록 환경에 등록된다(`avg = sum/len` → `total = avg*2`,
 *   순서·리터럴 재대입 규칙은 각 헬퍼 함수 주석 참고).
 */

import { evaluateExpression } from '@/lib/safeMathCalc';

/** 타입 라벨의 출처 — 사용자가 `: type`으로 명시했는지, 값에서 자동 추론했는지 */
export type TypeSource = 'explicit' | 'inferred';

export interface VarLine {
  kind: 'var';
  name: string;
  value: string;
  typeLabel: string;
  typeSource: TypeSource;
  /**
   * 안전 계산기로 성공적으로 자동 계산된 경우에만 존재하는 원본 수식 문자열(계산 전 rhs).
   * 존재하면 `value`는 계산 결과, 없으면 `value`는 리터럴/문자열 그대로(폴백 포함).
   */
  sourceExpr?: string;
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

/**
 * 오브젝트 표기(`name = {k: v, ...}`) 라인. 값은 재귀 파싱하지 않고 문자열 그대로 보존한다
 * (중첩 객체/배열이 값으로 와도 표시용 문자열일 뿐 계산·env 등록 대상이 아니다).
 */
export interface ObjectLine {
  kind: 'object';
  name: string;
  entries: { key: string; value: string }[];
  typeLabel: string;
  typeSource: TypeSource;
}

export interface TextLine {
  kind: 'text';
  text: string;
}

/**
 * 이름 없이(`=` 없이) 수식만 적은 줄이 계산된 경우의 결과 라인(예: `av / len` → 0.33333).
 * VarLine과 달리 이름이 없으므로 env(변수 환경)에 등록되지 않고, 다른 줄에서 참조할 수 없다.
 */
export interface ExprLine {
  kind: 'expr';
  /** 계산에 사용된 원본 수식 문자열(화면 표시용) */
  expr: string;
  /** 계산 결과(표시용 포맷 문자열) */
  value: string;
  typeLabel: string;
  typeSource: TypeSource;
}

/** 트레이스 한 줄의 파싱 결과 판별 유니온 */
export type TraceLine = VarLine | Array1DLine | Array2DLine | ObjectLine | TextLine | ExprLine;

// 그룹: 1=이름, 2=명시 타입(선택, `name:` 바로 뒤만 매칭), 3=rhs(= 이후 전체, 값 내부 콜론은 안전)
const ASSIGN_PATTERN = /^([A-Za-z_]\w*)\s*(?::\s*([^=]+?))?\s*=\s*(.+)$/;

const INT_PATTERN = /^-?\d+$/;
const FLOAT_PATTERN = /^-?\d*\.\d+$/;
const BINARY_PATTERN = /^0[bB][01]+$/;
const OCTAL_PATTERN = /^0[oO][0-7]+$/;
const HEX_PATTERN = /^0[xX][0-9A-Fa-f]+$/;

/** 값이 정수/실수 리터럴 패턴에 맞는지 여부(자동 타입 추론용) */
function isNumericLiteral(value: string): boolean {
  return INT_PATTERN.test(value) || FLOAT_PATTERN.test(value) || BINARY_PATTERN.test(value) || OCTAL_PATTERN.test(value) || HEX_PATTERN.test(value);
}

/** trace 숫자 리터럴을 env용 number로 변환 — isNumericLiteral 통과 값만 호출한다. */
function parseNumericLiteral(value: string): number {
  if (BINARY_PATTERN.test(value)) return parseInt(value.slice(2), 2);
  if (OCTAL_PATTERN.test(value)) return parseInt(value.slice(2), 8);
  if (HEX_PATTERN.test(value)) return parseInt(value.slice(2), 16);
  return Number(value);
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

// 수식 자동 계산에 허용되는 문자: 숫자·소수점·식별자(영문/숫자/밑줄)·산술/비트연산자·괄호·공백.
// 이 화이트리스트를 통과해도 evaluateExpression 자체 화이트리스트(숫자/연산자만)는 별개로
// 다시 적용되므로, 식별자 치환이 끝난 뒤 문자가 하나라도 남아있으면 계산기가 error를 반환한다.
const FORMULA_CHAR_PATTERN = /^[A-Za-z0-9_.+\-*/%().\s<>&|^~]+$/;
const IDENTIFIER_PATTERN = /\b[A-Za-z_]\w*\b/g;

// [확장1] 식별자 없는 순수 리터럴 수식 전용 오탐 가드 — 공백 없이 숫자와 '-'/'.'만 압축
// 나열된 형태(날짜 `2024-01-01`, 전화번호 `010-1234-5678`, 버전 `1.2.3`)는 뺄셈 수식으로
// 잘못 계산되지 않도록 계산을 건너뛰고 문자열로 둔다. 공백이 있는 뺄셈(`10 - 3`)이나 '/'를
// 쓴 나눗셈(`16/9`)은 이 패턴에 매칭되지 않아 정상적으로 계산된다.
const DATE_LIKE_GUARD_PATTERN = /^\d+([-.]\d+)+$/;

/** 계산된 숫자를 표시용 문자열로 정리 — 정수는 그대로, 실수는 최대 6유효숫자로 반올림 후 말미 0 제거 */
function formatComputedNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const rounded = Number(n.toPrecision(6));
  return String(rounded);
}

/** tryEvaluateFormula 성공 시 반환 형태 — 계산값과 화면 표시용 포맷 문자열 */
type FormulaEvalSuccess = { value: number; formatted: string };

/**
 * 스칼라 rhs가 계산 가능한 산술·비트 수식인지 판정하고, 맞다면 안전 계산기(evaluateExpression)로
 * 계산한다. eval / new Function은 사용하지 않는다 — 계산은 전적으로 evaluateExpression에 위임한다.
 *
 * 두 갈래로 계산을 시도한다:
 *   [확장1] rhs에 식별자가 하나도 없는 순수 리터럴 수식(예: `10 / 4`, `0b1010 & 3`) — 단, DATE_LIKE_GUARD_PATTERN에
 *           매칭되는 날짜/버전/전화번호 압축 형태는 계산하지 않는다.
 *   [확장2] rhs의 식별자가 전부 env(순서 무관 픽스포인트로 채워지는 숫자 변수 환경)에 있으면,
 *           식별자를 숫자로 치환한 뒤 계산한다.
 *
 * 다음 중 하나라도 해당하면 계산을 시도하지 않고 null(호출부에서 문자열 폴백):
 *   - rhs에 허용 문자(숫자/식별자/연산자/괄호/공백) 외의 문자가 있음(예: 콜론이 포함된 `12:30`)
 *   - 식별자가 없는 리터럴 수식인데 날짜/버전/전화번호 압축 형태(가드 매칭)
 *   - 식별자가 있는데 그중 하나라도 env에 없는 숫자 변수(미정의 참조, 예: `x = a / b`)
 *   - evaluateExpression이 error를 반환(0으로 나눔 등) 또는 결과가 유한하지 않음
 */
function tryEvaluateFormula(rhs: string, env: ReadonlyMap<string, number>): FormulaEvalSuccess | null {
  if (!FORMULA_CHAR_PATTERN.test(rhs)) return null;

  const identifiers = rhs.match(IDENTIFIER_PATTERN) ?? [];

  let substituted: string;
  if (identifiers.length === 0) {
    // 확장1 — 식별자 없는 순수 리터럴 수식. 날짜/버전/전화번호 오탐 가드 통과해야 계산.
    if (DATE_LIKE_GUARD_PATTERN.test(rhs)) return null;
    substituted = rhs;
  } else {
    // 확장2 — 식별자가 전부 env에 있어야(순서 무관 픽스포인트로 이미 해결된 숫자 변수) 계산.
    for (const id of identifiers) {
      if (!env.has(id)) return null;
    }
    substituted = rhs.replace(IDENTIFIER_PATTERN, id => String(env.get(id)));
  }

  const result = evaluateExpression(substituted);
  if ('error' in result) return null;
  if (!Number.isFinite(result.value)) return null;

  return { value: result.value, formatted: formatComputedNumber(result.value) };
}

/** `[...]`로 감싸인 값 하나를 최상위 원소 문자열 배열로 분리. 형태가 아니면 null */
function parseBracketGroup(raw: string): string[] | null {
  const s = raw.trim();
  if (s.length < 2 || s[0] !== '[') return null;

  const parts: string[] = [];
  const stack: Array<'[' | '{' | '('> = ['['];
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let partStart = 1;

  const expectedOpening = (closing: string): '[' | '{' | '(' | null => {
    if (closing === ']') return '[';
    if (closing === '}') return '{';
    if (closing === ')') return '(';
    return null;
  };

  for (let i = 1; i < s.length; i++) {
    const ch = s[i];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '[' || ch === '{' || ch === '(') {
      stack.push(ch);
      continue;
    }

    const opening = expectedOpening(ch);
    if (opening !== null) {
      if (stack[stack.length - 1] !== opening) return null;
      stack.pop();

      if (stack.length === 0) {
        if (i !== s.length - 1) return null;
        const lastPart = s.slice(partStart, i).trim();
        if (lastPart.length > 0 || parts.length > 0) parts.push(lastPart);
        return parts;
      }
      continue;
    }

    // 바깥 배열 바로 아래의 콤마만 원소 경계다. 중첩 그룹·문자열 내부 콤마는 보존한다.
    if (ch === ',' && stack.length === 1) {
      parts.push(s.slice(partStart, i).trim());
      partStart = i + 1;
    }
  }

  // 바깥 대괄호, 중첩 그룹 또는 따옴표가 닫히지 않은 입력은 배열로 오인하지 않는다.
  return null;
}

type ArrayParseResult = { kind: 'array1d'; cells: string[] } | { kind: 'array2d'; grid: string[][] };

/**
 * rhs가 대괄호로 시작할 때, 공백만 사이에 두고 이어지는 최상위 `[...]` 그룹들로 전체 문자열이
 * 정확히 덮이는지 확인해 그룹별 원문 문자열 배열로 분리한다("나란히" 2D 표기 `[a,b][c,d]` 전용
 * 헬퍼). 그룹 경계는 대괄호/중괄호/소괄호 깊이와 따옴표만으로 판정하며, 각 그룹 내부의 괄호
 * 타입이 실제로 맞는지는 검증하지 않는다(그건 이후 `parseBracketGroup`이 그룹별로 재검증한다).
 * 최상위 그룹이 1개뿐이거나(기존 1D/중첩 2D 경로로 위임), 그룹 사이/뒤에 대괄호가 아닌 문자가
 * 있거나, 괄호가 끝까지 닫히지 않으면 null을 반환한다.
 */
function splitTopLevelBracketGroups(rhs: string): string[] | null {
  const s = rhs.trim();
  if (s.length === 0 || s[0] !== '[') return null;

  const groups: string[] = [];
  let i = 0;
  const n = s.length;

  while (i < n) {
    while (i < n && /\s/.test(s[i])) i++;
    if (i >= n) break;
    if (s[i] !== '[') return null; // 그룹 사이/뒤에 대괄호가 아닌 문자 → 나란히 표기 아님

    let depth = 0;
    let quote: '"' | "'" | null = null;
    let escaped = false;
    let j = i;
    let closed = false;

    for (; j < n; j++) {
      const ch = s[j];
      if (quote !== null) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === '[' || ch === '{' || ch === '(') {
        depth++;
        continue;
      }
      if (ch === ']' || ch === '}' || ch === ')') {
        depth--;
        if (depth === 0) {
          closed = true;
          j++;
          break;
        }
        continue;
      }
    }

    if (!closed || depth !== 0) return null; // 괄호가 끝까지 닫히지 않음
    groups.push(s.slice(i, j));
    i = j;
  }

  return groups.length >= 1 ? groups : null;
}

/** rhs(대괄호로 시작하는 값)를 1D/2D 배열로 판정. 파싱 실패 시 null(호출부에서 text로 폴백) */
function parseArrayValue(rhs: string): ArrayParseResult | null {
  // "나란히" 2D 표기 — 최상위 대괄호 그룹이 2개 이상 연속으로 전체 문자열을 덮으면 각 그룹을
  // 한 행으로 취급한다. 그룹이 1개뿐이면(기존 1D/중첩 2D 케이스) 아래 기존 경로로 넘어간다.
  const topGroups = splitTopLevelBracketGroups(rhs);
  if (topGroups !== null && topGroups.length >= 2) {
    const grid: string[][] = [];
    for (const group of topGroups) {
      const row = parseBracketGroup(group);
      if (row === null) return null; // 한 그룹이라도 깨지면 전체 text로 폴백
      grid.push(row);
    }
    return { kind: 'array2d', grid };
  }

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

/** `{...}`로 감싸인 값 하나를 최상위 엔트리 문자열 배열로 분리. 형태가 아니면 null(오브젝트 파싱용, parseBracketGroup과 동일한 깊이/따옴표 추적 로직을 `{`용으로 적용) */
function parseBraceGroup(raw: string): string[] | null {
  const s = raw.trim();
  if (s.length < 2 || s[0] !== '{') return null;

  const parts: string[] = [];
  const stack: Array<'[' | '{' | '('> = ['{'];
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let partStart = 1;

  const expectedOpening = (closing: string): '[' | '{' | '(' | null => {
    if (closing === ']') return '[';
    if (closing === '}') return '{';
    if (closing === ')') return '(';
    return null;
  };

  for (let i = 1; i < s.length; i++) {
    const ch = s[i];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '[' || ch === '{' || ch === '(') {
      stack.push(ch);
      continue;
    }

    const opening = expectedOpening(ch);
    if (opening !== null) {
      if (stack[stack.length - 1] !== opening) return null;
      stack.pop();

      if (stack.length === 0) {
        if (i !== s.length - 1) return null;
        const lastPart = s.slice(partStart, i).trim();
        if (lastPart.length > 0 || parts.length > 0) parts.push(lastPart);
        return parts;
      }
      continue;
    }

    // 바깥 오브젝트 바로 아래의 콤마만 엔트리 경계다. 중첩 그룹·문자열 내부 콤마는 보존한다.
    if (ch === ',' && stack.length === 1) {
      parts.push(s.slice(partStart, i).trim());
      partStart = i + 1;
    }
  }

  // 바깥 중괄호, 중첩 그룹 또는 따옴표가 닫히지 않은 입력은 오브젝트로 오인하지 않는다.
  return null;
}

/**
 * 엔트리 문자열 하나(`key: value` 형태 기대)를 최상위(중첩/따옴표 밖) 첫 번째 콜론으로
 * key/value 분리한다. 값 내부의 콜론(`url: http://x`의 `://`)은 최상위가 아니므로 안전하게
 * value에 보존된다. 최상위 콜론이 하나도 없으면 null(호출부에서 Set 형태 등으로 판단해 전체
 * text 폴백).
 */
function splitEntryByTopColon(entry: string): { key: string; value: string } | null {
  const stack: Array<'[' | '{' | '('> = [];
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < entry.length; i++) {
    const ch = entry[i];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '[' || ch === '{' || ch === '(') {
      stack.push(ch);
      continue;
    }

    if (ch === ']' || ch === '}' || ch === ')') {
      stack.pop();
      continue;
    }

    if (ch === ':' && stack.length === 0) {
      return { key: entry.slice(0, i).trim(), value: entry.slice(i + 1).trim() };
    }
  }

  return null;
}

/**
 * rhs(중괄호로 시작하는 값)를 오브젝트 키-값 엔트리 배열로 판정. 파싱 실패 시(불균형 중괄호,
 * 콜론 없는 엔트리 등) null(호출부에서 text로 폴백). 값은 재귀 파싱하지 않고 문자열 그대로
 * 보존한다.
 */
function parseObjectValue(rhs: string): { key: string; value: string }[] | null {
  const rawEntries = parseBraceGroup(rhs);
  if (rawEntries === null) return null;
  if (rawEntries.length === 0) return [];

  const entries: { key: string; value: string }[] = [];
  for (const raw of rawEntries) {
    const split = splitEntryByTopColon(raw);
    if (split === null) return null; // 콜론 없는 엔트리(예: Set 형태 `{1, 2, 3}`) → 오브젝트로 보지 않음
    entries.push(split);
  }
  return entries;
}

/**
 * 스칼라 대입(`name = rhs` 또는 `name: type = rhs`) 라인의 1차 분류 결과. 배열/텍스트와 달리
 * env(숫자 변수 환경) 없이는 최종 TraceLine을 확정할 수 없어 rhs를 원본 그대로 보존한다.
 */
interface ScalarAssignInfo {
  kind: 'scalarAssign';
  name: string;
  rhs: string;
  explicitType?: string;
  typeSource: TypeSource;
}

/**
 * [확장3] `=` 없이 수식만 적은 줄의 1차 분류 결과. 이름이 없어 env 등록 대상이 아니므로
 * named 변수 픽스포인트가 모두 끝난 뒤 최종 env로 1회만 평가한다(scalarAssign과 달리
 * 이 자체가 다른 줄의 계산에 영향을 주지 않는다). raw는 계산 실패 시 텍스트 폴백용 원본 줄.
 */
interface ExprCandidateInfo {
  kind: 'exprCandidate';
  expr: string;
  raw: string;
}

/** classifyLine의 반환 유니온 — 배열/오브젝트/텍스트는 이미 확정, 스칼라 대입·수식 후보만 후속 처리 대상 */
type ClassifiedLine = Array1DLine | Array2DLine | ObjectLine | TextLine | ScalarAssignInfo | ExprCandidateInfo;

// [확장3] 이름 없는 수식 후보 판별에 쓰는 "연산자 최소 1개 포함" 가드 — 단어 하나(note)·단일
// 식별자(av)·자유 문장이 수식으로 오인되지 않도록 하는 핵심 조건. FORMULA_CHAR_PATTERN(숫자/
// 식별자/연산자/괄호/공백 화이트리스트) 통과 + 이 조건을 모두 만족해야 수식 후보로 분류한다.
const HAS_OPERATOR_PATTERN = /(?:>>>|<<|>>|[+\-*/%&|^~])/;

/**
 * 한 줄을 env(숫자 변수 환경)와 무관하게 1차 분류한다. 배열/텍스트는 이 시점에 바로 확정하고,
 * 스칼라 대입은 이름/rhs/타입 정보만 보존해 parseTraceLines의 픽스포인트 단계로 넘긴다.
 * 어떤 예외도 밖으로 던지지 않고 실패 시 text로 폴백한다.
 */
function classifyLine(rawLine: string): ClassifiedLine {
  try {
    const line = rawLine.trim();
    const match = ASSIGN_PATTERN.exec(line);
    if (!match) {
      // [확장3] `=` 없는 줄 — 화이트리스트 문자만 + 연산자 최소 1개를 만족하면 수식 후보로 분류.
      // 실제 계산 가능 여부(식별자가 최종 env에 있는지, 날짜형 가드 등)는 tryEvaluateFormula가
      // named 변수 픽스포인트 종료 후 최종 패스에서 판정한다.
      if (FORMULA_CHAR_PATTERN.test(line) && HAS_OPERATOR_PATTERN.test(line)) {
        return { kind: 'exprCandidate', expr: line, raw: rawLine };
      }
      return { kind: 'text', text: rawLine };
    }

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

    if (rhs.startsWith('{')) {
      const entries = parseObjectValue(rhs);
      if (entries === null) return { kind: 'text', text: rawLine };
      return {
        kind: 'object',
        name,
        entries,
        typeLabel: explicitType ?? 'object',
        typeSource,
      };
    }

    return { kind: 'scalarAssign', name, rhs, explicitType, typeSource };
  } catch {
    return { kind: 'text', text: rawLine };
  }
}

/**
 * trace 텍스트를 줄 단위로 파싱한다. 빈 줄은 결과에서 제외. 코드 실행 없음, 항상 안전 폴백.
 *
 * 스칼라 대입 라인의 숫자 변수 참조 수식은 순서 무관 픽스포인트로 해석한다:
 *   1) 1차 — 모든 `이름 = <숫자 리터럴>` 정의를 env에 수집(같은 이름이 여러 번이면
 *      텍스트상 마지막 정의가 최종값 — 재대입 시나리오).
 *   2) 2차~ — 리터럴이 아닌 스칼라 대입(수식 후보) 중 참조 식별자가 전부 env에 있는 라인을
 *      계산해 env에 추가하는 것을, 더 이상 새로 해결되는 라인이 없을 때까지 반복한다
 *      (반복 횟수는 라인 수로 상한 — 순환 참조 무한루프 방지). 이 단계는 확장1(식별자 없는
 *      순수 리터럴 수식)과 확장2(순서 무관 변수 참조)를 tryEvaluateFormula를 통해 함께 처리한다.
 *   3) 끝까지 미해결(순환·미정의 참조 등)인 라인은 문자열 var로 폴백한다.
 * 계산된 값을 env에 반영할 때, 같은 이름의 리터럴 정의가 이 수식 라인보다 텍스트상 뒤에 있으면
 * (즉 그 리터럴이 최종값이어야 하면) env를 덮어쓰지 않아 리터럴의 "마지막 정의 우선" 규칙을 지킨다.
 */
export function parseTraceLines(text: string): TraceLine[] {
  const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const classified: ClassifiedLine[] = rawLines.map(classifyLine);

  const scalarIndices: number[] = [];
  classified.forEach((c, i) => {
    if (c.kind === 'scalarAssign') scalarIndices.push(i);
  });

  // 1차 — 숫자 리터럴 정의만 먼저 env에 채운다(같은 이름 여러 번이면 텍스트상 마지막이 최종값)
  const literalEnv = new Map<string, number>();
  const literalLastIndex = new Map<string, number>();
  for (const i of scalarIndices) {
    const info = classified[i] as ScalarAssignInfo;
    if (isNumericLiteral(info.rhs)) {
      literalEnv.set(info.name, parseNumericLiteral(info.rhs));
      literalLastIndex.set(info.name, i);
    }
  }

  // 2차~ — 리터럴이 아닌 수식 후보 라인만 픽스포인트로 반복 해석
  const formulaIndices = scalarIndices.filter(i => !isNumericLiteral((classified[i] as ScalarAssignInfo).rhs));
  const resolvedEnv = new Map(literalEnv);
  const computedValues = new Map<number, FormulaEvalSuccess>();

  let changed = true;
  let pass = 0;
  const maxPasses = formulaIndices.length + 1; // 순환 참조 등 미해결 라인이 있어도 무한루프되지 않도록 상한
  while (changed && pass < maxPasses) {
    changed = false;
    pass++;
    for (const i of formulaIndices) {
      if (computedValues.has(i)) continue;
      const info = classified[i] as ScalarAssignInfo;
      const computed = tryEvaluateFormula(info.rhs, resolvedEnv);
      if (computed === null) continue;

      computedValues.set(i, computed);
      changed = true;

      // 같은 이름의 리터럴 정의가 이 수식 라인보다 텍스트상 뒤에 있으면 그 리터럴이 최종값이므로
      // env를 덮어쓰지 않는다(리터럴 "마지막 정의 우선" 규칙 보호).
      const laterLiteralIndex = literalLastIndex.get(info.name);
      if (laterLiteralIndex === undefined || laterLiteralIndex < i) {
        resolvedEnv.set(info.name, computed.value);
      }
    }
  }

  // 최종 렌더 — 원래 줄 순서 그대로, 각 라인은 자신의 값(리터럴/계산/폴백)만 반영
  return classified.map((c, i): TraceLine => {
    if (c.kind === 'array1d' || c.kind === 'array2d' || c.kind === 'object' || c.kind === 'text') return c;

    if (c.kind === 'exprCandidate') {
      // [확장3] named 변수 픽스포인트가 모두 끝난 최종 resolvedEnv로 1회만 평가. 이름이 없으므로
      // 계산에 성공해도 env에는 등록하지 않는다(다른 줄의 계산에 영향 없음).
      const computed = tryEvaluateFormula(c.expr, resolvedEnv);
      if (computed !== null) {
        return { kind: 'expr', expr: c.expr, value: computed.formatted, typeLabel: 'number', typeSource: 'inferred' };
      }
      return { kind: 'text', text: c.raw };
    }

    if (isNumericLiteral(c.rhs)) {
      return { kind: 'var', name: c.name, value: c.rhs, typeLabel: c.explicitType ?? 'number', typeSource: c.typeSource };
    }

    const computed = computedValues.get(i);
    if (computed !== undefined) {
      return {
        kind: 'var',
        name: c.name,
        value: computed.formatted,
        typeLabel: c.explicitType ?? 'number',
        typeSource: c.typeSource,
        sourceExpr: c.rhs,
      };
    }

    // 계산 불가(미정의 식별자·순환·계산기 오류 등) — 기존처럼 문자열 var로 안전 폴백
    return {
      kind: 'var',
      name: c.name,
      value: c.rhs,
      typeLabel: c.explicitType ?? inferScalarType(c.rhs),
      typeSource: c.typeSource,
    };
  });
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
