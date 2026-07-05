/**
 * 안전한 사칙연산 수식 계산기.
 *
 * eval / new Function / Function 생성자를 전혀 사용하지 않는다.
 * 1) 화이트리스트 정규식으로 허용 문자만 있는지 1차 검증
 * 2) 자체 재귀하강 파서(recursive descent parser)로 토큰화 후 계산
 *
 * 허용 문법: 숫자(소수점 포함) + - * / % ** ( ) 공백, 단항 마이너스/플러스
 * 순수 함수 — 부수효과 없음. 어떤 입력에도 throw하지 않고 { error }로 반환한다.
 */

export type EvalResult = { value: number } | { error: string };

/** 파싱/계산 중 발생하는 내부 오류 — evaluateExpression 내부에서만 캐치되어 절대 밖으로 전파되지 않는다 */
class ScratchCalcError extends Error {}

// 허용 문자 화이트리스트: 숫자, 소수점, 공백, + - * / % ( )
const ALLOWED_PATTERN = /^[0-9+\-*/%().\s]+$/;

type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
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

    if (ch === '(') { tokens.push({ type: 'LPAREN', value: ch }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'RPAREN', value: ch }); i++; continue; }

    // '**' (거듭제곱)은 '*' 두 글자를 먼저 확인해야 함
    if (ch === '*' && expr[i + 1] === '*') { tokens.push({ type: 'OP', value: '**' }); i += 2; continue; }
    if ('+-*/%'.includes(ch)) { tokens.push({ type: 'OP', value: ch }); i++; continue; }

    throw new ScratchCalcError(`허용되지 않은 문자입니다: "${ch}"`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

/**
 * 문법(우선순위 낮음 → 높음):
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/' | '%') unary)*
 *   unary      := ('+' | '-') unary | power
 *   power      := primary ('**' unary)?   (우결합, 지수부에 단항부호 허용)
 *   primary    := NUMBER | '(' expression ')'
 *
 * 단항 마이너스가 '**'보다 우선순위가 낮아 `-2**2` === -4 (일반적인 수학/파이썬 관례)로 계산된다.
 */
class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  parse(): number {
    const value = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new ScratchCalcError('괄호가 맞지 않습니다.');
    }
    return value;
  }

  private parseExpression(): number {
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
    if (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.advance().value;
      const value = this.parseUnary();
      return op === '-' ? -value : value;
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
      return Number(token.value);
    }
    if (token.type === 'LPAREN') {
      this.advance();
      const value = this.parseExpression();
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
 * @param expr 계산할 수식 (숫자, + - * / % ** ( ), 공백만 허용)
 * @returns 성공 시 { value: number }, 실패 시 { error: string }. 절대 throw하지 않는다.
 */
export function evaluateExpression(expr: string): EvalResult {
  const trimmed = expr.trim();

  if (trimmed === '') {
    return { error: '수식을 입력하세요.' };
  }
  if (!ALLOWED_PATTERN.test(trimmed)) {
    return { error: '숫자와 + - * / % ** ( ) 만 입력할 수 있습니다.' };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const value = parser.parse();
    if (!Number.isFinite(value)) {
      return { error: '계산 결과가 유효하지 않습니다.' };
    }
    return { value };
  } catch (e) {
    if (e instanceof ScratchCalcError) {
      return { error: e.message };
    }
    return { error: '수식을 계산할 수 없습니다.' };
  }
}
