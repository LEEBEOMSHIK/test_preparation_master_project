/**
 * 안전한 산술·비트 수식 계산기.
 *
 * eval / new Function / Function 생성자를 전혀 사용하지 않는다.
 * 1) 화이트리스트 정규식으로 허용 문자만 있는지 1차 검증
 * 2) 자체 재귀하강 파서(recursive descent parser)로 토큰화 후 계산
 *
 * 허용 문법:
 *   - 숫자: 10진수(소수점 포함), 2진수(0b1010), 8진수(0o12), 16진수(0xA)
 *   - 산술: + - * / % ** ( ), 단항 마이너스/플러스
 *   - 비트: & | ^ ~ << >> >>> (JavaScript/Java 계열과 같은 32비트 정수 기준)
 *
 * 안전한 정수 결과는 계산 방식과 무관하게(사칙연산이든 비트 연산이든) 2·8·16진수 변환값을
 * bitwise 필드로 함께 반환한다. 음수는 비트 문맥일 때만 32비트 2의 보수로 표시한다.
 * 순수 함수 — 부수효과 없음. 어떤 입력에도 throw하지 않고 { error }로 반환한다.
 */

/**
 * 정수 결과의 진수 변환 보조 표시값(2진/8진/16진). 이름은 하위 호환을 위해 BitwiseFormats로
 * 유지하지만, 비트 연산 결과뿐 아니라 "정수 결과 전반"의 진수 변환 표시 겸용으로 쓰인다.
 * 음수는 비트 문맥(비트 연산자·0b/0o/0x 리터럴 사용)일 때만 생성되며 32비트 2의 보수 기준으로 표시한다.
 */
export interface BitwiseFormats {
  /** 2진 표현. 음수(비트 문맥)는 32비트 2의 보수 전체를 표시한다. */
  binary: string;
  /** 8진 표현. 음수(비트 문맥)는 32비트 2의 보수 전체를 표시한다. */
  octal: string;
  /** 16진 표현. 음수(비트 문맥)는 32비트 2의 보수 전체를 표시한다. */
  hex: string;
}

export type EvalResult = { value: number; bitwise?: BitwiseFormats } | { error: string };

/** 파싱/계산 중 발생하는 내부 오류 — evaluateExpression 내부에서만 캐치되어 절대 밖으로 전파되지 않는다 */
class ScratchCalcError extends Error {}

// 허용 문자 화이트리스트: 숫자/진법 접두·소수점·공백·산술/비트 연산자·괄호.
// 세부 문법 오류는 tokenize/parser가 다시 판정한다.
const ALLOWED_PATTERN = /^[0-9A-Fa-fxXbBoO+\-*/%().\s<>&|^~]+$/;
const BIT_CONTEXT_PATTERN = /(?:0[xX][0-9A-Fa-f]+|0[bB][01]+|0[oO][0-7]+|>>>|<<|>>|[&|^~])/;

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

/**
 * 정수 결과 보조 표시용 2진/8진/16진 문자열 생성.
 * 음수(비트 문맥 전용 호출)는 32비트 2의 보수 기준 자릿수로 패딩한다.
 * - 2진: 32자리, 8진: 11자리(32비트를 8진으로 표현 시 최대 11자리), 16진: 8자리
 */
function formatBitwise(value: number): BitwiseFormats {
  const unsigned = value >>> 0;
  const binaryDigits = unsigned.toString(2);
  const octalDigits = unsigned.toString(8);
  const hexDigits = unsigned.toString(16).toUpperCase();
  return {
    binary: `0b${value < 0 ? binaryDigits.padStart(32, '0') : binaryDigits}`,
    octal: `0o${value < 0 ? octalDigits.padStart(11, '0') : octalDigits}`,
    hex: `0x${value < 0 ? hexDigits.padStart(8, '0') : hexDigits}`,
  };
}

function toInt32(value: number): number {
  return value | 0;
}

function toShiftCount(value: number): number {
  return (value >>> 0) & 31;
}

function parseNumberLiteral(raw: string): number {
  if (/^0[xX]/.test(raw)) return parseInt(raw.slice(2), 16);
  if (/^0[bB]/.test(raw)) return parseInt(raw.slice(2), 2);
  if (/^0[oO]/.test(raw)) return parseInt(raw.slice(2), 8);
  return Number(raw);
}

/** 문자열을 토큰 배열로 변환. 허용되지 않은 형태 발견 시 ScratchCalcError */
function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      const start = i;
      if (ch === '0' && /[xXbBoO]/.test(expr[i + 1] ?? '')) {
        const prefix = expr[i + 1];
        i += 2;
        const digitPattern =
          prefix === 'x' || prefix === 'X'
            ? /[0-9A-Fa-f]/
            : prefix === 'b' || prefix === 'B'
            ? /[01]/
            : /[0-7]/;
        const digitStart = i;
        while (i < expr.length && digitPattern.test(expr[i])) i++;
        if (digitStart === i) throw new ScratchCalcError('숫자 형식이 올바르지 않습니다.');
        tokens.push({ type: 'NUMBER', value: expr.slice(start, i) });
        continue;
      } else {
        let seenDot = false;
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          if (expr[i] === '.') {
            if (seenDot) throw new ScratchCalcError('숫자 형식이 올바르지 않습니다.');
            seenDot = true;
          }
          i++;
        }
        const raw = expr.slice(start, i);
        if (raw === '.' || raw === '') throw new ScratchCalcError('숫자 형식이 올바르지 않습니다.');
        tokens.push({ type: 'NUMBER', value: raw });
        continue;
      }
    }

    if (ch === '(') { tokens.push({ type: 'LPAREN', value: ch }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'RPAREN', value: ch }); i++; continue; }

    // 긴 연산자는 짧은 연산자보다 먼저 확인해야 함
    if (ch === '>' && expr[i + 1] === '>' && expr[i + 2] === '>') {
      tokens.push({ type: 'OP', value: '>>>' });
      i += 3;
      continue;
    }
    if ((ch === '<' || ch === '>') && expr[i + 1] === ch) {
      tokens.push({ type: 'OP', value: ch + ch });
      i += 2;
      continue;
    }
    if (ch === '*' && expr[i + 1] === '*') { tokens.push({ type: 'OP', value: '**' }); i += 2; continue; }
    if ('+-*/%&|^~'.includes(ch)) { tokens.push({ type: 'OP', value: ch }); i++; continue; }

    throw new ScratchCalcError(`허용되지 않은 문자입니다: "${ch}"`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

/**
 * 문법(우선순위 낮음 → 높음):
 *   bitOr      := bitXor ('|' bitXor)*
 *   bitXor     := bitAnd ('^' bitAnd)*
 *   bitAnd     := shift ('&' shift)*
 *   shift      := additive (('<<' | '>>' | '>>>') additive)*
 *   additive   := term (('+' | '-') term)*
 *   term       := unary (('*' | '/' | '%') unary)*
 *   unary      := ('+' | '-' | '~') unary | power
 *   power      := primary ('**' unary)?   (우결합, 지수부에 단항부호 허용)
 *   primary    := NUMBER | '(' bitOr ')'
 *
 * 단항 마이너스가 '**'보다 우선순위가 낮아 `-2**2` === -4 (일반적인 수학/파이썬 관례)로 계산된다.
 * 비트 연산은 JavaScript/Java 계열과 동일하게 32비트 정수로 변환한 뒤 계산한다.
 */
class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  parse(): number {
    const value = this.parseBitwiseOr();
    if (this.peek().type !== 'EOF') {
      throw new ScratchCalcError('괄호가 맞지 않습니다.');
    }
    return value;
  }

  private parseBitwiseOr(): number {
    let value = this.parseBitwiseXor();
    while (this.peek().type === 'OP' && this.peek().value === '|') {
      this.advance();
      const rhs = this.parseBitwiseXor();
      value = toInt32(value) | toInt32(rhs);
    }
    return value;
  }

  private parseBitwiseXor(): number {
    let value = this.parseBitwiseAnd();
    while (this.peek().type === 'OP' && this.peek().value === '^') {
      this.advance();
      const rhs = this.parseBitwiseAnd();
      value = toInt32(value) ^ toInt32(rhs);
    }
    return value;
  }

  private parseBitwiseAnd(): number {
    let value = this.parseShift();
    while (this.peek().type === 'OP' && this.peek().value === '&') {
      this.advance();
      const rhs = this.parseShift();
      value = toInt32(value) & toInt32(rhs);
    }
    return value;
  }

  private parseShift(): number {
    let value = this.parseAdditive();
    while (this.peek().type === 'OP' && ['<<', '>>', '>>>'].includes(this.peek().value)) {
      const op = this.advance().value;
      const rhs = this.parseAdditive();
      const count = toShiftCount(rhs);
      if (op === '<<') {
        value = toInt32(value) << count;
      } else if (op === '>>') {
        value = toInt32(value) >> count;
      } else {
        value = value >>> count;
      }
    }
    return value;
  }

  private parseAdditive(): number {
    let value = this.parseTerm();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.advance().value;
      const rhs = this.parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    while (this.peek().type === 'OP' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.advance().value;
      const rhs = this.parseUnary();
      if (op === '*') {
        value = value * rhs;
      } else {
        if (rhs === 0) throw new ScratchCalcError('0으로 나눌 수 없습니다.');
        value = op === '/' ? value / rhs : value % rhs;
      }
    }
    return value;
  }

  private parseUnary(): number {
    if (this.peek().type === 'OP' && ['+', '-', '~'].includes(this.peek().value)) {
      const op = this.advance().value;
      const value = this.parseUnary();
      if (op === '-') return -value;
      if (op === '~') return ~toInt32(value);
      return value;
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (this.peek().type === 'OP' && this.peek().value === '**') {
      this.advance();
      const exp = this.parseUnary(); // 지수부에도 단항부호 허용 (예: 2**-2), 우결합
      return Math.pow(base, exp);
    }
    return base;
  }

  private parsePrimary(): number {
    const token = this.peek();
    if (token.type === 'NUMBER') {
      this.advance();
      const value = parseNumberLiteral(token.value);
      if (!Number.isFinite(value)) throw new ScratchCalcError('숫자 형식이 올바르지 않습니다.');
      return value;
    }
    if (token.type === 'LPAREN') {
      this.advance();
      const value = this.parseBitwiseOr();
      if (this.peek().type !== 'RPAREN') {
        throw new ScratchCalcError('괄호가 맞지 않습니다.');
      }
      this.advance();
      return value;
    }
    throw new ScratchCalcError('수식이 올바르지 않습니다.');
  }
}

/**
 * 수식 문자열을 안전하게 계산한다. eval/Function 미사용.
 * @param expr 계산할 수식 (숫자, + - * / % **, 비트 연산자, 괄호, 공백)
 * @returns 성공 시 { value: number }, 실패 시 { error: string }. 절대 throw하지 않는다.
 *
 * 안전한 정수 결과에는 bitwise(2·8·16진수 변환)를 함께 반환한다:
 * - 0 이상 정수 → 항상 포함.
 * - 음수 정수 → 비트 문맥(비트 연산자 또는 0b/0o/0x 리터럴 포함)일 때만 32비트 2의 보수로 포함.
 * - Number.MAX_SAFE_INTEGER 초과 등 안전하지 않은 정수, 정수가 아닌 결과 → 미포함.
 */
export function evaluateExpression(expr: string): EvalResult {
  const trimmed = expr.trim();

  if (trimmed === '') {
    return { error: '수식을 입력하세요.' };
  }
  if (!ALLOWED_PATTERN.test(trimmed)) {
    return { error: '숫자와 + - * / % **, 비트 연산자, 괄호만 입력할 수 있습니다.' };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const value = parser.parse();
    if (!Number.isFinite(value)) {
      return { error: '계산 결과가 유효하지 않습니다.' };
    }
    // 진수 변환(bitwise) 표시 규칙:
    // - 0 이상의 안전한 정수(Number.isSafeInteger) 결과는 항상 2·8·16진수를 함께 표시한다.
    // - 음수 정수는 비트 문맥(비트 연산자 또는 0b/0o/0x 리터럴 사용)일 때만 32비트 2의 보수로 표시한다.
    //   일반 산술의 음수 결과(예: 3-10 = -7)까지 2의 보수로 보여주면 혼란을 주므로 제외한다.
    // - Number.MAX_SAFE_INTEGER를 넘는 정수는 표시를 생략한다.
    const isSafeInt = Number.isSafeInteger(value);
    const showBitwise = isSafeInt && (value >= 0 || BIT_CONTEXT_PATTERN.test(trimmed));
    return showBitwise ? { value, bitwise: formatBitwise(value) } : { value };
  } catch (e) {
    if (e instanceof ScratchCalcError) {
      return { error: e.message };
    }
    return { error: '수식을 계산할 수 없습니다.' };
  }
}
