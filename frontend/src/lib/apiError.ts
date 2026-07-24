import type { ApiResponse } from '@/types';

/**
 * axios 요청 실패(err)에서 백엔드가 내려준 에러 메시지를 안전하게 추출한다.
 *
 * 백엔드 GlobalExceptionHandler는 실패 응답을 항상 `ApiResponse.fail(code, message)`로
 * 생성하며, 이때 메시지는 최상위 `message` 필드가 아니라 `error.message`에 담긴다
 * (`ApiResponse`가 `@JsonInclude(NON_NULL)`이라 `fail()`이 채우지 않는 최상위 `message`는
 * 응답 JSON에서 아예 생략됨). 예: 로그인 5회 실패 시 429 `TOO_MANY_LOGIN_ATTEMPTS` →
 * `{ success: false, error: { code, message: "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요." } }`.
 *
 * `err.response.data.error.message`를 꺼낼 수 없는 경우(네트워크 오류, 형식이 다른 응답 등)에는
 * 호출부가 넘긴 `fallback` 문구를 그대로 반환한다.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (
    err !== null &&
    typeof err === 'object' &&
    'response' in err &&
    err.response !== null &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data !== null &&
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as ApiResponse<unknown>;
    if (data.error && typeof data.error.message === 'string' && data.error.message.trim() !== '') {
      return data.error.message;
    }
  }
  return fallback;
}
