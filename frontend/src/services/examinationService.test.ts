import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import apiClient from './apiClient';
import { examinationService } from './examinationService';

const mockedGet = jest.spyOn(apiClient, 'get').mockResolvedValue({} as never);

describe('examinationService 사용자 목록', () => {
  beforeEach(() => { mockedGet.mockClear(); });

  it('기존 page/size 호출을 유지한다', () => {
    examinationService.userGetExaminations(2, 20);

    expect(mockedGet).toHaveBeenCalledWith('/user/examinations', {
      params: { page: 2, size: 20 },
      paramsSerializer: { indexes: null },
    });
  });

  it('반복 interests와 선택 검색 조건을 서버 파라미터로 전달한다', () => {
    examinationService.userGetExaminations(0, 5, {
      title: '기사',
      category: '정보처리기사',
      interests: ['정보처리기사', 'SQLD'],
      year: 2025,
      round: 2,
      aiCustom: true,
    });

    expect(mockedGet).toHaveBeenCalledWith('/user/examinations', {
      params: {
        page: 0,
        size: 5,
        title: '기사',
        category: '정보처리기사',
        interests: ['정보처리기사', 'SQLD'],
        year: 2025,
        round: 2,
        aiCustom: true,
      },
      paramsSerializer: { indexes: null },
    });
  });

  it('전체 활성 시험 필터 선택지를 조회한다', () => {
    examinationService.userGetExaminationFilters();

    expect(mockedGet).toHaveBeenCalledWith('/user/examinations/filters');
  });
});
