import { formatAnswerAlternatives } from './answer';

describe('formatAnswerAlternatives', () => {
  it('반환값: || 구분자가 있으면 대표 정답(첫 후보) 1개만 반환한다 (기존 동작)', () => {
    expect(formatAnswerAlternatives('팩토리 메서드 || 팩토리 메소드 || factory method')).toBe('팩토리 메서드');
  });

  it('반환값: || 구분자가 없으면 원문 그대로 반환한다', () => {
    expect(formatAnswerAlternatives('정답')).toBe('정답');
  });

  it('빈 문자열 입력이면 그대로 반환한다', () => {
    expect(formatAnswerAlternatives('')).toBe('');
  });

  it('disableAlternative=true면 || 구분자가 있어도 원문 그대로 반환한다 (코드 조건 논리 OR 보호)', () => {
    const codeAnswer = '① int a = 0 / ② a < m || b[a] < x / ③ b[a] < 0';
    expect(formatAnswerAlternatives(codeAnswer, true)).toBe(codeAnswer);
  });

  it('disableAlternative=false면 기존과 동일하게 || 를 대체 정답 구분자로 해석한다', () => {
    expect(formatAnswerAlternatives('팩토리 메서드 || factory method', false)).toBe('팩토리 메서드');
  });

  it('disableAlternative 인자를 생략하면 기존 동작과 동일하다 (하위 호환)', () => {
    expect(formatAnswerAlternatives('a || b')).toBe('a');
    expect(formatAnswerAlternatives('a || b', undefined)).toBe('a');
  });
});
