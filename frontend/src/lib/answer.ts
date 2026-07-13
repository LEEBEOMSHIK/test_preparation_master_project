/**
 * 문항 보기(options) 존재 여부 판정 공용 유틸.
 *
 * 보기가 있으면(trim 후 비어있지 않은 항목 1개 이상) 유형과 무관하게 "빈칸 순서대로"
 * 채점한다(백엔드 AnswerGrader의 4-인자 오버로드와 동일한 판정 기준). 정답·사용자 답안을
 * 각각 콤마(,)·슬래시(/)로 분리해 순서를 보존한 뒤 같은 위치끼리 비교하며(순서 무시 X),
 * 토큰 수가 다르면 오답이다. 각 토큰은 보기 번호(1-based)와 보기 텍스트를 상호 인정하고
 * (예: "4" == "pwd" == "4. pwd"), 같은 보기 번호를 여러 위치에 중복 지정할 수 있다.
 * 부분 점수는 없다(전 위치 일치해야만 정답). 예: `['', '', '', '']` → hasOptions는 false.
 */
export function hasOptions(options?: string[] | null): boolean {
  if (!Array.isArray(options) || options.length === 0) return false;
  return options.some((o) => typeof o === 'string' && o.trim() !== '');
}

/**
 * options 채점용 단일 토큰 정규화: trim → 소문자화 → 내부 연속 공백 단일화 → 선행 열거
 * 접두(예: "1. ", "2) ") 제거 → 재trim. 백엔드 AnswerGrader.normalizeOptionToken과
 * 반드시 동일한 규칙을 유지해야 한다.
 */
function normalizeOptionToken(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/^\d+\s*[.)]\s*/, '');
  return s.trim();
}

/**
 * 정답 문자열에 백엔드 AnswerGrader의 {@code ||} 대체 정답 구분자(공백-파이프 2개-공백, 공백은
 * 없어도 됨)가 있으면 대표 정답(첫 번째 비어있지 않은 항목) 1개만 반환한다. 대체 정답이 많은
 * 문항(예: 수십 개)에서 표시가 지나치게 길어지는 것을 막기 위함이다. 구분자가 없으면(후보 1개)
 * 원문 그대로 반환한다. 예: `"팩토리 메서드 || factory method"` → `"팩토리 메서드"`.
 * 오답 시 "정답:" 표시 등 사용자 화면에서만 사용하고, 관리자 화면(문항 상세/목록)은 원문을
 * 그대로 노출한다.
 */
export function formatAnswerAlternatives(answer: string): string {
  if (!answer) return answer;
  const alternatives = answer
    .split(/\s*\|\|\s*/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (alternatives.length <= 1) return answer;
  return alternatives[0];
}

/** 슬롯 번호 배열(1-based, 보기 인덱스)을 answer 저장 문자열로 변환. 빈 배열이면 빈 문자열. */
export function slotsToAnswer(slots: number[]): string {
  if (!slots.length) return '';
  return slots.join(',');
}

/**
 * answer 문자열을 보기 슬롯(빈칸 순서대로 1-based 보기 번호) 배열로 파싱한다.
 * [,/] 분리 → 각 토큰이 (a) 1..options.length 범위 숫자면 그 번호, (b) 아니면
 * 열거 접두 제거(정규식 `^\d+\s*[.)]\s*`)·소문자화·공백축약 후 보기 텍스트와
 * (동일 정규화하여) 매칭되면 그 번호로 복원.
 * 하나라도 매칭 실패하거나 answer가 빈 문자열이면 null 반환(호출부는 원문 텍스트 입력으로 폴백해야 함).
 */
export function parseAnswerToSlots(answer: string, options: string[]): number[] | null {
  if (!answer || !answer.trim()) return null;
  const tokens = answer.split(/[,/]/).map((t) => t.trim()).filter((t) => t !== '');
  if (tokens.length === 0) return null;

  const normalizedOptions = options.map((o) => normalizeOptionToken(o ?? ''));
  const slots: number[] = [];

  for (const rawTok of tokens) {
    const normalized = normalizeOptionToken(rawTok);
    if (/^\d+$/.test(normalized)) {
      const n = Number(normalized);
      if (n >= 1 && n <= options.length) {
        slots.push(n);
        continue;
      }
    }
    const idx = normalizedOptions.findIndex((o) => o === normalized);
    if (idx === -1) return null;
    slots.push(idx + 1);
  }

  return slots;
}
