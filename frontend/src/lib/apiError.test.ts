import { describe, expect, it } from '@jest/globals';
import { extractApiErrorMessage } from './apiError';

describe('extractApiErrorMessage', () => {
  it('HTTP 예외 응답의 백엔드 오류 메시지를 반환한다', () => {
    const error = {
      message: 'Request failed with status code 400',
      response: {
        data: {
          success: false,
          error: { code: 'INVALID_PATCH_NOTE', message: '버전 형식이 올바르지 않습니다.' },
          timestamp: '2026-08-26T09:00:00',
        },
      },
    };

    expect(extractApiErrorMessage(error, '저장에 실패했습니다.')).toBe('버전 형식이 올바르지 않습니다.');
  });

  it('success=false 응답을 변환한 Error의 백엔드 메시지를 유지한다', () => {
    const error = new Error('패치노트를 찾을 수 없습니다.');

    expect(extractApiErrorMessage(error, '패치노트를 불러오지 못했습니다.')).toBe('패치노트를 찾을 수 없습니다.');
  });
});
