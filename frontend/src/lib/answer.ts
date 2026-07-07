/**
 * 문항 보기(options) 존재 여부 판정 공용 유틸.
 *
 * 보기가 있으면(trim 후 비어있지 않은 항목 1개 이상) 유형과 무관하게
 * "보기 참고 표시 + 정답 번호 직접 입력" 방식으로 채점한다(백엔드 AnswerGrader의
 * 4-인자 오버로드와 동일한 판정 기준). 예: `['', '', '', '']` → false.
 */
export function hasOptions(options?: string[] | null): boolean {
  if (!Array.isArray(options) || options.length === 0) return false;
  return options.some((o) => typeof o === 'string' && o.trim() !== '');
}
