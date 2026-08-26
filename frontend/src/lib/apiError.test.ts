import { describe, expect, it } from '@jest/globals';
import { AxiosError } from 'axios';
import { ApiApplicationError, extractApiErrorMessage } from './apiError';

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
    const error = new ApiApplicationError('패치노트를 찾을 수 없습니다.');

    expect(extractApiErrorMessage(error, '패치노트를 불러오지 못했습니다.')).toBe('패치노트를 찾을 수 없습니다.');
  });

  it('Axios 네트워크 오류의 내부 메시지 대신 사용자용 fallback을 반환한다', () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK);

    expect(extractApiErrorMessage(error, '네트워크 연결을 확인해 주세요.')).toBe('네트워크 연결을 확인해 주세요.');
  });
});
