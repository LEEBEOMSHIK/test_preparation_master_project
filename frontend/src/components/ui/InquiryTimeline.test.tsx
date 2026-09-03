import { buildInquiryTimeline, getInquiryTimelineLabel } from './InquiryTimeline';
import type { Inquiry } from '@/types';

describe('InquiryTimeline', () => {
  it('orders same-time entries by id and preserves author role and attachments', () => {
    const inquiry: Inquiry = { id: 11, title: '제목', content: '초기', requestType: 'BUG_REPORT', status: 'IN_PROGRESS', imageUrls: [], createdAt: '2026-08-28T10:00:00', messages: [
      { id: 3, authorId: 1, authorRole: 'ADMIN', content: '관리자', createdAt: '2026-08-28T11:00:00', imageUrls: ['https://example.com/a.png'] },
      { id: 2, authorId: 2, authorRole: 'USER', content: '사용자', createdAt: '2026-08-28T11:00:00', imageUrls: [] },
    ] };
    const timeline = buildInquiryTimeline(inquiry);
    expect(timeline.map((entry) => entry.id)).toEqual([0, 2, 3]);
    expect(timeline[2].authorRole).toBe('ADMIN');
    expect(timeline[2].imageUrls).toEqual(['https://example.com/a.png']);
  });

  it('최초 문의와 작성자 역할별 문맥 라벨을 구분한다', () => {
    expect(getInquiryTimelineLabel({ authorRole: 'USER', initial: true })).toBe('최초 문의');
    expect(getInquiryTimelineLabel({ authorRole: 'USER' })).toBe('내 답변');
    expect(getInquiryTimelineLabel({ authorRole: 'ADMIN' })).toBe('관리자 답변');
    expect(getInquiryTimelineLabel({ authorRole: 'SYSTEM' })).toBe('시스템');
  });

  it('관리자 관점에서 USER 항목 라벨은 사용자 답변으로 표시한다', () => {
    expect(getInquiryTimelineLabel({ authorRole: 'USER' }, 'ADMIN')).toBe('사용자 답변');
  });
});
